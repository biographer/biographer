#include "bfs.cpp"

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
         double mx=(dx>0 ? (x+w+x2-w2)/2  : (x-w+x2+w2)/2); // point thru which separation line should go (in the middle between the two nodes)
         double my=(dy>0 ? (y+h+y2-h2)/2  : (y-h+y2+h2)/2);
         if (my<min(y,y2)) my=min(y,y2); // if nodes "overlap" in one direction, these limits need to be applied
         if (mx<min(x,x2)) mx=min(x,x2);
         if (my>max(y,y2)) my=max(y,y2);
         if (mx>max(x,x2)) mx=max(x,x2);
         Point m(mx,my);
         double gx=dy; // line sould point perpendicular to distance vector; points to left
         double gy=-dx;
         //if (i==1) debugline(m.x,m.y,m.x+gx,m.y+gy,200,100,100,true);
         
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
//         if (i==1) debugline(m.x,m.y,m.x+100*g.x,m.y+100*g.y,100,100,100,true);
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
            if (c>=0 && c<minc){
               minc=c;
               minidx=j;
            }
         }
         used[minidx]=1;
         Point cp=cur.cross_point(gs[minidx].line);
         gs[minidx].line.re_ref(cp); // setting ref point of next line to the current cross point
         int newnode=nv.nodes.size(); 
         nv.addNode(newnode,other,"",1,1,cp.x,cp.y,0);
         edge_crossings[min(i,gs[curidx].node)][max(i,gs[curidx].node)].push_back(newnode); // add the new node to the two veronoi lines it belongs to
         edge_crossings[min(i,gs[minidx].node)][max(i,gs[minidx].node)].push_back(newnode);
         //nodemap[i].push_back(newnode);
         lastidx=curidx;
         curidx=minidx;
         first=false;
         //if (i==1) debugline(cur.from(),cur.to(),0,0,0,true);
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
            debugline(nv.nodes[n1].x,nv.nodes[n1].y,nv.nodes[n2].x,nv.nodes[n2].y,0,0,0,true);
         }
      }
   }
   printf("finding shortest path through network for each original edge\n");
   
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
      e.splinepoints.clear();
      e.splinehandles.clear();
      double alpha,beta;
      switch(e.type){
         case substrate:
            reverse(path.begin(),path.end());
            swap(n1,n2);
            e.splinehandles.push_back(unit(state.nw.nodes[n2]-state.nw.nodes[n1])*state.avgsize/4);
            e.splinehandles.push_back(Point(state.nw.nodes[n2].dir+PI/2)*state.avgsize/4);
            break;
         case product:
            e.splinehandles.push_back(Point(state.nw.nodes[n1].dir-PI/2)*state.avgsize/4);
            e.splinehandles.push_back(unit(state.nw.nodes[n1]-state.nw.nodes[n2])*state.avgsize/4);
            break;
         case activator:
         case inhibitor:
         case catalyst:
            reverse(path.begin(),path.end());
            swap(n1,n2);
            alpha=angle(state.nw.nodes[n1]-state.nw.nodes[n2]);
            beta=0;
            if (fabs(state.nw.nodes[n2].dir-alpha)>fabs(state.nw.nodes[n2].dir+PI-alpha)) beta=PI;
            e.splinehandles.push_back(unit(state.nw.nodes[n2]-state.nw.nodes[n1])*state.avgsize/4);
            e.splinehandles.push_back(Point(state.nw.nodes[n2].dir+beta)*state.avgsize/4);
            break;
         default:
            e.splinehandles.push_back(unit(state.nw.nodes[n2]-state.nw.nodes[n1])*state.avgsize/4);
            e.splinehandles.push_back(unit(state.nw.nodes[n1]-state.nw.nodes[n2])*state.avgsize/4);
      }
      if (path.size()>1){
         debugline(state.nw.nodes[n1].x,state.nw.nodes[n1].y,nv.nodes[path.front()].x,nv.nodes[path.front()].y,255,100,100);
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
            d=unit(d)*state.avgsize/4;
            e.splinehandles.insert(--e.splinehandles.end(),to_left(d,PI/2)*sign(scalar(to_left(d,PI/2),before-cur)));
            e.splinepoints.push_back(cur+d);
            debugline(cur+d,cur+d+to_left(d,PI/2)*sign(scalar(to_left(d,PI/2),before-cur)),0,0,255,true);
            if (j<path.size()-1) debugline(nv.nodes[path[j]].x,nv.nodes[path[j]].y,nv.nodes[path[j+1]].x,nv.nodes[path[j+1]].y,255,100,100);
         }
         debugline(nv.nodes[path.back()].x,nv.nodes[path.back()].y,state.nw.nodes[n2].x,state.nw.nodes[n2].y,255,100,100);
         
      }
   }
   /*   NetDisplay nd(nv);
   nd.waitKeyPress=true;
   nd.show();*/
}