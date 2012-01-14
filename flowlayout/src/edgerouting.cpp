#include "bfs.cpp"
#ifndef SHOWPROGRESS
// dummy functions
void debugline(double x1,double y1, double x2, double y2, int r, int g, int b, bool dotted=false){
}
void debugline(Point p1, Point p2, int r, int g, int b, bool dotted=false){
}
void debugrect(Rect re, int r, int g, int b, bool dotted=false){
}
void debugpoint(Point p, double size,int r, int g, int b, bool dotted=false){
}
#endif
class NodeLinePair{
   public:
   NodeLinePair(const int nidx,const ParamEdge &_line): node(nidx), line(_line){}
   int node;
   ParamEdge line;
};
class CmpCrossPoints{
   public:
   CmpCrossPoints(Network &nw):network(nw){}
   bool operator()(int n1, int n2){
      if (network.nodes[n1].x!=network.nodes[n2].x) return (network.nodes[n1].x<network.nodes[n2].x);
      if (network.nodes[n1].y!=network.nodes[n2].y) return (network.nodes[n1].y<network.nodes[n2].y);
      return false;
   }
   const Network &network;
};
void smooth_path(Network &nw,VI &path,double cutoff){
   // remove points from path which are too close to each other
   int i=1;
   int last=0;
   while (i<path.size()){
      if (norm(nw.nodes[path[i]]-nw.nodes[path[last]])<cutoff){
         path.erase(path.begin()+i);
      } else {
         last=i;
         i++;
      }
   }
}
void route_edges(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug){
   int n=state.nw.nodes.size();
   int i,j,k;
   vector<NodeLinePair> gs;
   Rect bb=state.nw.getBB();
   bb.extend(state.avgsize/10);
   Network nv;
   vector<VI> nodemap(n);
   vector<vector<VI> > edge_crossings(n+4,vector<VI>(n+4)); // this stores for each voronoi line between node i and j the crosspoints; includes 4 virtual nodes
   printf("finding Voronoi separator lines\n");
   for (i=0;i<n;i++){
      gs.clear();
      double x=state.nw.nodes[i].x;
      double y=state.nw.nodes[i].y;
      double w=state.nw.nodes[i].width;
      double h=state.nw.nodes[i].height;
      Rect ri=state.nw.nodes[i].rect();
      //if (i==iter) debugrect(ri,0,0,255);
      gs.push_back(NodeLinePair(n,ParamEdge(Point(x,bb.ymin),bb.TL()))); // boundary lines (should point to left); adds virtual nodes n ... n+3
      gs.push_back(NodeLinePair(n+1,ParamEdge(Point(bb.xmin,y),bb.BL())));
      gs.push_back(NodeLinePair(n+2,ParamEdge(Point(x,bb.ymax),bb.BR())));
      gs.push_back(NodeLinePair(n+3,ParamEdge(Point(bb.xmax,y),bb.TR())));
      double dclosest=DBL_MAX;
      int iclosest;
      for (j=0;j<n;j++){
         if (i==j) continue;
         double x2=state.nw.nodes[j].x;
         double y2=state.nw.nodes[j].y;
         double w2=state.nw.nodes[j].width;
         double h2=state.nw.nodes[j].height;
         double dx=x2-x;
         double dy=y2-y;
         double mx=(dx>0 ? (x+w/2+x2-w2/2)/2  : (x-w/2+x2+w2/2)/2); // point thru which separation line should go (in the middle between the two nodes)
         double my=(dy>0 ? (y+h/2+y2-h2/2)/2  : (y-h/2+y2+h2/2)/2);
         if (my<min(y,y2)) my=min(y,y2); // if nodes "overlap" in one direction, these limits need to be applied
         if (mx<min(x,x2)) mx=min(x,x2);
         if (my>max(y,y2)) my=max(y,y2);
         if (mx>max(x,x2)) mx=max(x,x2);
         Point m(mx,my);
         double gx=dy; // line sould point perpendicular to distance vector; points to left
         double gy=-dx;
         //if (i==iter) debugline(m.x,m.y,m.x+gx,m.y+gy,200,100,100,true);
//         if (i==iter) debugline(x,y,x2,y2,100,100,200,true);
         
         double ord_angles[4]; 
         double &alpha=ord_angles[0];
         alpha=angle(Point(gx,gy));
         // find suitable 0, 45 and 90° lines and sort them by proximity to (gx,gy) line
         double &nearest=ord_angles[1]; // just references to iterate through candidates later on
         double &second=ord_angles[2];
         double &third=ord_angles[3];
         nearest=PI/4*round(4*alpha/PI);
         double left=PI/2*floor(2*alpha/PI);
         double right=PI/2*ceil(2*alpha/PI);

         // find second nearest
         second=PI/4*floor(4*alpha/PI);
         if (second==nearest) second=PI/4*ceil(4*alpha/PI);
         
         // find third nearest
         if (nearest==left){
            third=right;
         } else if (nearest==right){
            third=left;
         } else if (second==left){
            third=right;
         } else {
            third=left;
         }
         
/*         for (k=0;k<3;k++){
            if (i==1) debugline(m.x,m.y,m.x+100*Point(ord_angles[k]).x,m.y+100*Point(ord_angles[k]).y,100,100,200,true);
         }*/
         // check candidates in the defined order whether they collide with one of the two nodes (i or j)
         Rect rj=state.nw.nodes[j].rect();
         Point g(0,0);
         bool found=false;
         for (k=0;k<4;k++){
            g=Point(ord_angles[k]);
            if (prod(g,rj.TL()-m)>0 && prod(g,rj.TR()-m)>0 && prod(g,rj.BR()-m)>0 && prod(g,rj.BL()-m)>0 &&
               prod(g,ri.TL()-m)<0 && prod(g,ri.TR()-m)<0 && prod(g,ri.BR()-m)<0 && prod(g,ri.BL()-m)<0) { // node j completely right of g && i completely left
                found=true;
                break;
            }
         }
         if (!found) g=Point(ord_angles[0]); // ups? do nodes overlap?
            
         // generate the line and save it 
         ParamEdge ge(m,m+g); // the voronoi line separating node i from node j
         Point pclosest=ge.dist_vec(state.nw.nodes[i]); // closest point on line to node i
         ge.re_ref(state.nw.nodes[i]+pclosest); // reference point of line needs to be the closest point to node i
         gs.push_back(NodeLinePair(j,ge));
         if (norm(pclosest)<dclosest){ // find closest line to node i on the fly
            dclosest=norm(pclosest);
            iclosest=gs.size()-1;
         }
         //if (i==iter) debugline(ge.from(),ge.p(state.avgsize*4),100,100,100,true);
      }
      
      //find  set of voronoi lines which minimally surround node i
      int curidx=iclosest;
      int minidx;
      int lastidx=-1;
      bool first=true;
      int gl=gs.size();
      VI used(gl,0);
      while (first || curidx!=iclosest){
         ParamEdge &cur=gs[curidx].line;
         double minc=DBL_MAX;
         for (j=0;j<gl;j++){ // find the nearest crosspoint of one of all voronoi lines; searching to the left from last cross point
            if (j==curidx) continue;
            if (used[j]) continue;
            if (j==lastidx) continue; // finds the last voronoi line again; should not happen as this line should be in used[] already; except for iclosest
            double c=cur.cross_param(gs[j].line);
            if (c==0) { // special case, check whether new line points inwards
               Point ctr90=to_left(Point(x,y)-cur.p(c),PI);
               Point cln90=to_left(cur.unit(),PI);
               Point dirj=gs[j].line.unit();
               if (!((scalar(ctr90,dirj)<0) && (scalar(cln90,dirj)>0))){ // new line not between center line and current line
                  continue;
               }
            }
            if (c>=0 && c<minc){
               minc=c;
               minidx=j;
               //if (i==iter) debugpoint(cur.p(c),state.avgsize/10,0,0,255);
            }
         }
         used[minidx]=1;
         Point cp=cur.cross_point(gs[minidx].line);
         //if (i==iter) debugpoint(cp,state.avgsize/10,0,255,0);
         gs[minidx].line.re_ref(cp); // setting ref point of next line to the current cross point
         //if (i==iter) debugline(gs[minidx].line.from(),gs[minidx].line.p(state.avgsize),255,0,255);
         int newnode=nv.nodes.size(); 
         nv.addNode(newnode,other,"",1,1,cp.x,cp.y,0);
         edge_crossings[min(i,gs[curidx].node)][max(i,gs[curidx].node)].push_back(newnode); // add the new node to the two veronoi lines it belongs to
         edge_crossings[min(i,gs[minidx].node)][max(i,gs[minidx].node)].push_back(newnode);
         //nodemap[i].push_back(newnode);
         lastidx=curidx;
         curidx=minidx;
         first=false;
         //if (i==iter) debugline(cur.from(),cp,0,0,0);
      }
   }
   printf("finding relevant cross points on seperator lines and building network\n");
   
   // go through all voronoi lines and connect all registered cross points
   CmpCrossPoints ccp(nv);
   for (i=0;i<n+4;i++){ // includes 4 virtual nodes
      for (j=i+1;j<n+4;j++){
         if (edge_crossings[i][j].size() ==0 ) continue;
         sort(edge_crossings[i][j].begin(),edge_crossings[i][j].end(),ccp); // sort cross points on line
         for (k=0;k<edge_crossings[i][j].size();k++){
            int n1=edge_crossings[i][j][k];
            if (i<n) nodemap[i].push_back(n1); // register voronoi node to be adjacent to original node i (if not virtual node)
            if (j<n) nodemap[j].push_back(n1);
            if (k==edge_crossings[i][j].size()-1) break; // for the last crosspoint we do not create an edge
            int n2=edge_crossings[i][j][k+1];
            nv.addEdge(n1,n2,undirected);
            if (iter<=1) debugline(nv.nodes[n1].x,nv.nodes[n1].y,nv.nodes[n2].x,nv.nodes[n2].y,0,0,0,true);
         }
      }
   }
   printf("finding shortest path through network for each original edge\n");
   if (iter>=1){ // this is just for showing 1 step show only veronoi lines, 2nd show splines
      nv.calcEdgeLengths();
      int m=state.nw.edges.size();
      for (i=0;i<m;i++){
         printf(".");fflush(stdout);
         Edge &e=state.nw.edges[i];
         int n1=e.from;
         int n2=e.to;
         BFS bfs(nv,nodemap[n1]);
         int nn=bfs.next();
         while (nn>=0 && find(nodemap[n2].begin(),nodemap[n2].end(),nn)==nodemap[n2].end()){
            nn=bfs.next();
         }
         if (nn<0) printf("Ups, no route for edge\n");
         VI path=bfs.path();
         smooth_path(nv,path,state.avgsize/4);
         e.splinepoints.clear();
         e.splinehandles.clear();
         double alpha,beta;
         Point vec;
         double dd1=(path.size()>1 ? 
            (norm(nv.nodes[path[0]]-state.nw.nodes[n1])-max(state.nw.nodes[n1].width,state.nw.nodes[n1].height)/2)/2 :
            (norm(state.nw.nodes[n2]-state.nw.nodes[n1])-max(state.nw.nodes[n1].width,state.nw.nodes[n1].height)/2-max(state.nw.nodes[n2].width,state.nw.nodes[n2].height)/2)/2);
         dd1=min(dd1,state.avgsize/2);
         double d1=max(state.nw.nodes[n1].width,state.nw.nodes[n1].height)/2+dd1;
         double dd2=(path.size()>1 ? 
         (norm(nv.nodes[path.back()]-state.nw.nodes[n2])-max(state.nw.nodes[n2].width,state.nw.nodes[n2].height)/2)/2 :
         (norm(state.nw.nodes[n2]-state.nw.nodes[n1])-max(state.nw.nodes[n1].width,state.nw.nodes[n1].height)/2-max(state.nw.nodes[n2].width,state.nw.nodes[n2].height)/2)/2);
         dd2=min(dd2,state.avgsize/2);
         double d2=max(state.nw.nodes[n2].width,state.nw.nodes[n2].height)/2+state.avgsize/2;
         Point sp1,sp2;
         switch(e.type){
            case substrate:
               reverse(path.begin(),path.end());
               swap(n1,n2);
               swap(d1,d2);
               sp1=(path.size()>1 ? nv.nodes[path[0]] : state.nw.nodes[n2]);
               e.splinehandles.push_back(unit(sp1-state.nw.nodes[n1])*d1);
               e.splinehandles.push_back(Point(state.nw.nodes[n2].dir+PI/2)*d2);
               break;
            case product:
               e.splinehandles.push_back(Point(state.nw.nodes[n1].dir-PI/2)*d1);
               sp2=(path.size()>1 ? nv.nodes[path.back()] : state.nw.nodes[n1]);
               e.splinehandles.push_back(unit(sp2-state.nw.nodes[n2])*d2);
               break;
            case activator:
            case inhibitor:
            case catalyst:
               reverse(path.begin(),path.end());
               swap(n1,n2);
               swap(d1,d2);
               vec=state.nw.nodes[n1]-state.nw.nodes[n2]; // vector pointing from n2 (reaction) to n1 (catalyst,etc)
               beta=0;
               if (scalar(vec,Point(state.nw.nodes[n2].dir+PI))>scalar(vec,Point(state.nw.nodes[n2].dir))) beta=PI;
               sp1=(path.size()>1 ? nv.nodes[path[0]] : state.nw.nodes[n2]);
               e.splinehandles.push_back(unit(sp1-state.nw.nodes[n1])*d1);
               e.splinehandles.push_back(Point(state.nw.nodes[n2].dir+beta)*d2);
               break;
            default:
               sp1=(path.size()>1 ? nv.nodes[path[0]] : state.nw.nodes[n2]);
               e.splinehandles.push_back(unit(sp1-state.nw.nodes[n1])*d1);
               sp2=(path.size()>1 ? nv.nodes[path.back()] : state.nw.nodes[n1]);
               e.splinehandles.push_back(unit(sp2-state.nw.nodes[n2])*d2);
         }
         if (path.size()>1){
            //debugline(state.nw.nodes[n1].x,state.nw.nodes[n1].y,nv.nodes[path.front()].x,nv.nodes[path.front()].y,255,100,100);
            for (j=0;j<path.size();j++){
               Point before=(j==0 ? state.nw.nodes[n1] : nv.nodes[path[j-1]]);
               Point &after=(j==path.size()-1 ? state.nw.nodes[n2] : nv.nodes[path[j+1]]);
               Point &cur=nv.nodes[path[j]];
               if (after==cur) continue;
               if (before==cur) {
                  if (j-1<0) continue;
                  before=(j-1==0 ? state.nw.nodes[n1] : nv.nodes[path[j-2]]);
               }
               Point d=unit(before-cur)+unit(after-cur);
               if (d.is_null()) continue;
               d=unit(d)*min(min(norm(before-cur),norm(after-cur))/2,state.avgsize/2);
               e.splinehandles.insert(--e.splinehandles.end(),to_left(d,PI/2)*sign(scalar(to_left(d,PI/2),before-cur)));
               e.splinepoints.push_back(cur+d);
               //debugline(cur+d,cur+d+to_left(d,PI/2)*sign(scalar(to_left(d,PI/2),before-cur)),0,0,255,true);
               //if (j<path.size()-1) debugline(nv.nodes[path[j]].x,nv.nodes[path[j]].y,nv.nodes[path[j+1]].x,nv.nodes[path[j+1]].y,255,100,100);
            }
            //debugline(nv.nodes[path.back()].x,nv.nodes[path.back()].y,state.nw.nodes[n2].x,state.nw.nodes[n2].y,255,100,100);
            
         }
      }
   }
   /*   NetDisplay nd(nv);
   nd.waitKeyPress=true;
   nd.show();*/
}
class Segment{
   public:
      Segment(ParamEdge e,bool f=false, bool l=false, bool o1=false, bool o2=false):edge(e),first(f),last(l),orient1(o1),orient2(o2){};
      ParamEdge edge;
      bool first,last;
      bool orient1,orient2; // indicates if the corrsponding node is right of this edge (not imlpemented yet)
};
void split_route(vector<Segment> &vs,VR &nodes,int idx, int n1, int n2);
void route_edges2(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug){
   VR nodes;
   double d=state.avgsize/5;
   int n=state.nw.nodes.size();
   for (int i=0;i<n;i++){
      nodes.push_back(state.nw.nodes[i].rect());
      nodes.back().extend(d);
      //debugrect(nodes.back(),0,0,255);
   }
   for (int i=0,m=state.nw.edges.size();i<m;i++){
      //if (i!=iter) continue;
      Edge &e=state.nw.edges[i];
      int n1=e.from;
      int n2=e.to;
      Point vec,p1,p2;
      double dir;
      switch(e.type){
         case substrate:
            dir=lim(state.nw.nodes[n1].dir+PI/2);
            vec=Point(dir);
            swap(n1,n2);
            p1=state.nw.nodes[n1];
            vec=state.nw.nodes[n2].rect().border_vec(vec);
            p2=state.nw.nodes[n2]+vec;
            break;
         case product:
            dir=lim(state.nw.nodes[n1].dir-PI/2);
            vec=Point(dir);
            vec=state.nw.nodes[n1].rect().border_vec(vec);
            p1=state.nw.nodes[n1]+vec;
            p2=state.nw.nodes[n2];
            break;
         case activator:
         case inhibitor:
         case catalyst:
            swap(n1,n2);
         default:
            p1=state.nw.nodes[n1];
            p2=state.nw.nodes[n2];
      }
      vector<Segment> vs;
      vs.push_back(Segment(ParamEdge(p1,p2),true,true));
      split_route(vs,nodes,0,n1,n2);
      Point vec1=state.nw.nodes[n1].rect().border_vec(vs.front().edge.to()-vs.front().edge.from());
      Point vec2=state.nw.nodes[n2].rect().border_vec(vs.back().edge.from()-vs.back().edge.to());
      switch(e.type){
         case activator:
         case inhibitor:
         case catalyst:
            dir=lim(state.nw.nodes[n2].dir);
            if (scalar(Point(dir),vs.back().edge.from()-vs.back().edge.to())<0) dir=lim(dir+PI);
            vec=Point(dir);
            vec=state.nw.nodes[n2].rect().border_vec(vec);
            p2=state.nw.nodes[n2]+vec;
         case substrate:
            e.splinehandles.push_back(vec1+d);
            e.splinehandles.push_back(vec+d);
            break;
         case product:
            e.splinehandles.push_back(vec+d);
            e.splinehandles.push_back(vec2+d);
            break;
         default:
            e.splinehandles.push_back(vec1+d);
            e.splinehandles.push_back(vec2+d);
      }
      for (int j=1,s=vs.size();j<s;j++){
         Point before=vs[j-1].edge.from();
         Point cur=vs[j-1].edge.to();
         //if (cur!=vs[j].edge.from()) throw "ups: edge segments not continious";
         Point after=vs[j].edge.to();
         Point dv=unit(before-cur)*d+unit(after-cur)*d;
	 debugline(cur,cur+dv,0,255,0,true);
         e.splinehandles.insert(--e.splinehandles.end(),unit(to_left(dv,PI/2))*sign(scalar(to_left(dv,PI/2),before-cur))*d);
         e.splinepoints.push_back(cur+dv);
      }
   }
}
void split_route(vector<Segment> &vs,VR &nodes,int idx, int n1, int n2){
   ParamEdge e=vs[idx].edge;
   debugline(e.from(),e.to(),255,0,0,true);
   double minp=DBL_MAX;
   int minidx=-1;
   for (int j=0,n=nodes.size();j<n;j++){
      if (j==n1 || j==n2) continue;
      if (e.cross(nodes[j])){
	 if (nodes[j].contains(e.from())) continue;
	 if (nodes[j].contains(e.to())) continue;
         double p=e.cross_param_smallest(nodes[j]);
         if (p<minp){
            minp=p;
            minidx=j;
         }
      }
   }
   if (minidx<0) return ;
   Point dc=e.dist_vec(nodes[minidx].center());
   if (dc.is_null()){
      dc=to_left(e.unit(),PI/2); // minidxust choose a side 
   }
   VP pts;
   Point r=e.dist_vec(nodes[minidx].TL());
   if (scalar(r,dc)<0) pts.push_back(nodes[minidx].TL());
   r=e.dist_vec(nodes[minidx].TR());
   if (scalar(r,dc)<0) pts.push_back(nodes[minidx].TR());
   r=e.dist_vec(nodes[minidx].BL());
   if (scalar(r,dc)<0) pts.push_back(nodes[minidx].BL());
   r=e.dist_vec(nodes[minidx].BR());
   if (scalar(r,dc)<0) pts.push_back(nodes[minidx].BR());
   if (pts.size()==0) {
      printf("Ups, no points on smaller side of edge/node cut area");
      return;
   }
   if (pts.size()>2 ) throw "expected 1 or 2 points";
   vector<Segment> vsnew;
   int idxlast=idx+1;
   if (pts.size()==1){
      vsnew.push_back(Segment(ParamEdge(e.from(),pts[0]),vs[idx].first,false));
      vsnew.push_back(Segment(ParamEdge(pts[0],e.to()),false,vs[idx].last));
   } else if (pts.size()==2) {
      if (norm(pts[0]-e.from())>norm(pts[1]-e.from())){ // do nearest point first
	swap(pts[0],pts[1]);
      }
      vsnew.push_back(Segment(ParamEdge(e.from(),pts[0]),vs[idx].first,false));
      vsnew.push_back(Segment(ParamEdge(pts[0],pts[1]),false,false));
      vsnew.push_back(Segment(ParamEdge(pts[1],e.to()),false,vs[idx].last));
      idxlast++;
   }
   vs.erase(vs.begin()+idx);
   vs.insert(vs.begin()+idx,vsnew.begin(),vsnew.end());
   split_route(vs,nodes,idxlast,minidx,n2);
   split_route(vs,nodes,idx,n1,minidx); // new overlaps could be introduced after makeing a kink into the line
}