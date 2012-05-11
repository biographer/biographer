#include "plugins.h"
#include "layout.h"
#include "defines.h"
#ifdef SHOWPROGRESS
#include "netdisplay.h"
#endif
#define MARGIN state.avgsize/2


#include "paramedge.cpp"
#include "edgerouting.cpp"


Plugins glob_pgs;
Plugins& register_plugins(){
   if (glob_pgs.size()) return glob_pgs; // already initialized
   glob_pgs.registerPlugin(P_force_adj,"force_adj",force_adj);
   glob_pgs.registerPlugin(P_torque_adj,"torque_adj",torque_adj);
   glob_pgs.registerPlugin(P_force_nadj,"force_nadj",force_nadj);
   glob_pgs.registerPlugin(P_expand,"expand",expand);
   glob_pgs.registerPlugin(P_separate_nodes,"separate_nodes",separate_nodes);
   glob_pgs.registerPlugin(P_force_compartments,"force_compartments",force_compartments);
   glob_pgs.registerPlugin(P_distribute_edges,"distribute_edges",distribute_edges);
   glob_pgs.registerPlugin(P_adjust_compartments,"adjust_compartments",adjust_compartments);
   glob_pgs.registerPlugin(P_adjust_compartments_fixed,"adjust_compartments_fixed",adjust_compartments_fixed);
   glob_pgs.registerPlugin(P_fix_compartments,"fix_compartments",fix_compartments);
   glob_pgs.registerPlugin(P_init_layout,"init_layout",init_layout);
   glob_pgs.registerPlugin(P_min_edge_crossing,"min_edge_crossing",min_edge_crossing);
   glob_pgs.registerPlugin(P_min_edge_crossing_multi,"min_edge_crossing_multi",min_edge_crossing_multi);
   glob_pgs.registerPlugin(P_limit_mov,"limit_mov",limit_mov,T_limit);
   glob_pgs.registerPlugin(P_node_collision,"node_collision",node_collision,T_limit);
   glob_pgs.registerPlugin(P_compartment_collision,"compartment_collision",compartment_collision,T_limit);
   glob_pgs.registerPlugin(P_rotate,"rotate",rotate,T_pos);
   glob_pgs.registerPlugin(P_stack_rotate,"stack_rotate",stack_rotate,T_pos);
   glob_pgs.registerPlugin(P_route_edges,"route_edges",route_edges,T_pos);
   glob_pgs.registerPlugin(P_route_edges2,"route_edges2",route_edges2,T_pos);
   glob_pgs.registerPlugin(P_unfix_all,"unfix_all",unfix_all,T_pos);
   return glob_pgs;
}
void Plugins::registerPlugin(enumP pgn, string name, plugin_func_ptr pfunc, enumPT type, void* persist){
   int idx=(int) pgn;
   if ((int) pluginlist.size()<idx+1) pluginlist.resize(idx+1);
   pluginlist[idx].pfunc=pfunc;
/*   pluginlist[idx].mod_mov=mod_mov;
   pluginlist[idx].mod_rot=mod_rot;*/
   pluginlist[idx].persist=persist;
   pluginlist[idx].type=type;
   pluginlist[idx].name=name;
}
size_t Plugins::size(){
   return pluginlist.size();
}
plugin& Plugins::get(int idx){
   return pluginlist[idx];
}

// Plugin definitions
int _find(VI* nd,int idx);
double _getwidths(Network &nw,VI* nd);
double _getheights(Network &nw,VI* nd);
double sign(double x);
#ifdef STACKX
#define M_INIDIM _getheights
#define M_INIDIR1 y
#define M_INIDIR2 x
#else
#define M_INIDIM _getwidths
#define M_INIDIR1 x
#define M_INIDIR2 y
#endif
void init_layout(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug){
   /* This function quickly generates an initial layout, using the edge information.
   That is, for each reaction, we try to place subtrates in above, products in below and others on sides.
   The eventual position of a node is an average: sum of expected positions divided by number of occurrences.
   */
   double cost1,cost2;
   int n=state.nw.nodes.size(), m=state.nw.edges.size();
   int i, n1, n2;
   VI* nd;
   Edgetype _type;
   for(i=0;i<m;i++){
      _type=state.nw.edges[i].type;
      n1=state.nw.edges[i].from; //reaction.
      n2=state.nw.edges[i].to; //compound.
      if(_type==product){
         //product should be below the reaction.
         //accumulating sum of expected positions (movements).
         nd=state.nw.getNeighbors(n1,product);
         int sz=nd->size();
         int idx=_find(nd,n2); // get position of product in product list
         double width=M_INIDIM(state.nw,nd); // sum of width of all products
         double left=width*(sz-1)/sz;
         double step=0;
         if (sz>1) step=2*left/(sz-1);
         state.mov[n1].M_INIDIR2+=(state.nw.nodes[n2].M_INIDIR2-state.dij[i]);
         state.mov[n2].M_INIDIR2+=(state.nw.nodes[n1].M_INIDIR2+state.dij[i]);
         state.mov[n1].M_INIDIR1+=state.nw.nodes[n2].M_INIDIR1+left-idx*step;// postioning nodes left and right of reaction depending on how many products
         state.mov[n2].M_INIDIR1+=state.nw.nodes[n1].M_INIDIR1-left+idx*step;
         delete nd;
      }
      else if(_type==substrate){
         //substrate should be above the reaction.
         //accumulating sum of expected positions (movements).
         nd=state.nw.getNeighbors(n1,substrate);
         int sz=nd->size();
         int idx=_find(nd,n2); // get position of substrate in product list
         double width=M_INIDIM(state.nw,nd); // sum of width of all substrates
         double left=width*(sz-1)/sz;
         double step=0;
         if (sz>1) step=2*left/(sz-1);
         state.mov[n1].M_INIDIR2+=(state.nw.nodes[n2].M_INIDIR2+state.dij[i]);
         state.mov[n2].M_INIDIR2+=(state.nw.nodes[n1].M_INIDIR2-state.dij[i]);
         state.mov[n1].M_INIDIR1+=state.nw.nodes[n2].M_INIDIR1+left-idx*step; // postioning nodes left and right of reaction depending on how many substrates
         state.mov[n2].M_INIDIR1+=state.nw.nodes[n1].M_INIDIR1-left+idx*step;
         delete nd;
      }
      else{
         //others on sides (the nearer side)
         //accumulating sum of expected positions (movements).
         /*         cost1=fabs((state.nw.nodes[n1].M_INIDIR1-state.dij[i])-state.mov[n2].M_INIDIR1/state.deg[n2]);  // this assumes that mon has been completely accumulated
         cost2=fabs((state.nw.nodes[n1].M_INIDIR1+state.dij[i])-state.mov[n2].M_INIDIR1/state.deg[n2]);*/
         cost1=fabs((state.nw.nodes[n1].M_INIDIR1-state.dij[i])-state.nw.nodes[n2].M_INIDIR1);
         cost2=fabs((state.nw.nodes[n1].M_INIDIR1+state.dij[i])-state.nw.nodes[n2].M_INIDIR1);
         if(cost1<cost2){
            state.mov[n2].M_INIDIR1+=(state.nw.nodes[n1].M_INIDIR1-state.dij[i]);
            state.mov[n1].M_INIDIR1+=(state.nw.nodes[n2].M_INIDIR1+state.dij[i]);
         }
         else {
            state.mov[n2].M_INIDIR1+=(state.nw.nodes[n1].M_INIDIR1+state.dij[i]);
            state.mov[n1].M_INIDIR1+=(state.nw.nodes[n2].M_INIDIR1-state.dij[i]);
         }
         state.mov[n2].M_INIDIR2+=state.nw.nodes[n1].M_INIDIR2;
         state.mov[n1].M_INIDIR2+=state.nw.nodes[n2].M_INIDIR2;
         //here we do not move reaction node.
      }         
   }
   for(i=0;i<n;i++){
      if(state.deg[i]==0)continue; //isolated nodes (should this happen?)
         state.mov[i].x/=state.deg[i]; state.mov[i].y/=state.deg[i]; //it is an average.
         state.mov[i]-=state.nw.nodes[i]; // how much to move from current positions
         state.mov[i]/=2;
         /*      // move node towards expected positon
         state.nw.nodes[i].x+=(state.mov[i].x-state.nw.nodes[i].x)/2; 
      state.nw.nodes[i].y+=(state.mov[i].y-state.nw.nodes[i].y)/2;
      state.mov[i].x=state.mov[i].y=0.0;*/
   }
}


void force_adj(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug){
   /* This function calculates the force induced by edges (or adjacent nodes), and updates the displacements (movements) of nodes accordingly.
      the force induced by an edge at its ideal length is 0. Otherwise, force=(ideal_length-length)^2.
      we move both the compounds and the reaction along the edge such that the edge tends to its ideal length.
   */
   double d,ideal;
   Point vec; //vector from state.nw.nodes[n1] to state.nw.nodes[n2];
   int n1,n2,m,n,i;
   Edgetype _type;
   m=state.nw.edges.size();
   n=state.nw.nodes.size();
   bool _left=true;
   for(i=0;i<m;i++){
                    
      n1=state.nw.edges[i].from; //reaction
      n2=state.nw.edges[i].to; //compound;
      _type=state.nw.edges[i].type; //edge type.
      
      vec=state.nw.nodes[n2]-state.nw.nodes[n1];
      ideal=state.dij[i]; //ideal length of edge-i.
      d=dist(state.nw.nodes[n1],state.nw.nodes[n2]); //length of edge-i.
      
      //distantal movements;
      if(fabs(d)<zero){
//         if(_type==substrate)state.mov[n2].y+=(ideal/n); //substrates at top;
         if(_type==substrate){state.mov[n2].y-=ideal*factor*scale;} //substrates at top;
         else if(_type==product){state.mov[n2].y+=ideal*factor*scale;}  //products at bottom;
         else{
            //others on two sides.
            if(_left) {
               state.mov[n2].x-=ideal*factor*scale;
            } else {
               state.mov[n2].x+=ideal*factor*scale;
            }
            _left=!_left;
         }
         printf("force_adj: distance too small; nodes separated\n");
      }
      else{
         //move the nodes along the edge so as to adjusting the edge to its ideal length.
         
         //state.mov[n2].x+=(vec.x/d*(ideal-d)/n);
/*         double nonlin=(ideal-d)/ideal*10;
         nonlin*=nonlin;*/
         Point mv=vec/d*(ideal-d)*factor*scale;//*nonlin;
         state.mov[n2]+=mv;
         state.mov[n1]-=mv;
         state.force[n1]+=manh(mv);
         state.force[n2]+=manh(mv);
#ifdef SHOWPROGRESS
         if (debug) state.debug[n2].push_back(forcevec(mv,debug));
         if (debug) state.debug[n1].push_back(forcevec(-mv,debug));
#endif
         
      }
   }
}
void torque_adj(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug){
   /* This function calculates the force induced by edges (or adjacent nodes), and updates the displacements (movements) of nodes accordingly.
   And this force is composed of two parts: distant part and angular part. 
   2. angular force: for a reaction, we expect that its substrates in above (+0.5PI direction), products in below (-0.5PI direaction),
   and other related compounds on sides (either 0 or PI). 
   The angular force induced by an edge is: force=0.1*length*length*sin(0.5*fabs(lim(expected_angle-angle))).
   2. angular movement: we rotate the compound around the reaction such that the edge tends to be at the expected angle. 
   Then we also adjust the default direction of the reaction a little bit.      
   */
   int m,n,i,j;
   m=state.nw.edges.size();
   n=state.nw.nodes.size();
   for (i=0;i<n;i++){ // set direction of reactions
      if (state.nw.nodes[i].type!=reaction) continue;
      const VI &nb=state.nw.nodes[i].neighbors;
      int s=nb.size();
      Point dvec(0,0);
      for (j=0;j<s;j++){
         Edgetype _type=state.nw.edges[nb[j]].type; //edge type.
         int n2=state.nw.edges[nb[j]].to; // reactant index
         Point vec=state.nw.nodes[n2]-state.nw.nodes[i];
         if (_type==substrate) {
            dvec+=to_left(vec,-0.5*PI); // could be unit vector, but we just try with full vector (preferres longer edges)
         } else if (_type==product) {
            dvec+=to_left(vec,+0.5*PI);
         } else {
            // ignoring modulators (as we don't know which side is better)
         }
      }
      for (j=0;j<s;j++){ // now do the modulators as we now can decide which side is better (based on what we know from substrates and products)
         Edgetype _type=state.nw.edges[nb[j]].type; //edge type.
         int n2=state.nw.edges[nb[j]].to; // reactant index
         Point vec=state.nw.nodes[n2]-state.nw.nodes[i];
         if (_type==catalyst || _type==activator || _type==inhibitor){
            if (scalar(vec,dvec)>=0){
               dvec+=vec;
            } else {
               dvec-=vec;
            }
         }
      }
      state.nw.nodes[i].dir=angle(dvec);
   }
/*   for (i=0;i<n;i++){ // set direction of reactions
      if (state.nw.nodes[i].type!=reaction) continue;
      const VI &nb=state.nw.nodes[i].neighbors;
      int s=nb.size();
      double alpha=0;
      int cc=0;
      for (j=0;j<s;j++){
         Edgetype _type=state.nw.edges[nb[j]].type; //edge type.
         int n2=state.nw.edges[nb[j]].to; // reactant index
         Point vec=state.nw.nodes[n2]-state.nw.nodes[i];
         if (_type==substrate) {
            alpha+=lim(angle(vec)-0.5*PI);
            cc++;
         } else if (_type==product) {
            alpha+=lim(angle(vec)+0.5*PI);
            cc++;
         } else {
            // ignoring modulators (as we don't know which side is better)
         }
      }
      for (j=0;j<s;j++){ // now do the modulators as we now can decide which side is better (based on what we know from substrates and products)
         Edgetype _type=state.nw.edges[nb[j]].type; //edge type.
         int n2=state.nw.edges[nb[j]].to; // reactant index
         Point vec=state.nw.nodes[n2]-state.nw.nodes[i];
         if (_type==catalyst || _type==activator || _type==inhibitor){
            double diff=fabs(angle(vec)-alpha/cc);
            if (diff>PI) diff=2*PI-diff; // take smaller difference
               if (diff<PI/2){
                  alpha+=angle(vec);
               } else {
                  alpha+=lim(angle(vec)+PI);
               }
               cc++;
         }
      }
      state.nw.nodes[i].dir=alpha/cc; // WARNING never use lim() on alpha (the lim for the single contributions above is ok)
   }*/
   for(i=0;i<m;i++){
      //angular force;
      int n1=state.nw.edges[i].from; //reaction
      int n2=state.nw.edges[i].to; //compound;
      Edgetype _type=state.nw.edges[i].type; //edge type.
      
      Point vec=state.nw.nodes[n2]-state.nw.nodes[n1];//vector from state.nw.nodes[n1] to state.nw.nodes[n2];
//      double d=dist(state.nw.nodes[n1],state.nw.nodes[n2]); //length of edge-i.

      double alpha=angle(vec); //angle of the edge w.r.t. the +x axis. i_alpha is the corresponding ideal angle.
      double i_alpha;
      double beta;
      if(_type==substrate){
         //substates in above.
         i_alpha=0.5*PI+state.nw.nodes[n1].dir;
         beta=lim(i_alpha-alpha);
      }         
      else if(_type==product){
         //products in below.
         i_alpha=1.5*PI+state.nw.nodes[n1].dir;
         beta=lim(i_alpha-alpha);
      }
      else{ 
         //other compounds, rotating to the nearer side.
         i_alpha=state.nw.nodes[n1].dir; beta=lim(i_alpha-alpha);
         double i_alpha1=PI+state.nw.nodes[n1].dir, beta1=lim(i_alpha1-alpha);
         if(fabs(beta)>fabs(beta1)){
            beta=beta1;
            i_alpha=i_alpha1;
         }
      }
      // adding some noise for large angles; this results in nodes turning around in reverse direction (especially for large betas)
/*      if (rand() % (360^2) < (fabs(beta) *180 / PI)^2){ // for beta==PI -> 25:75
         if (beta<0) beta+=2*PI;
         if (beta>0) beta-=2*PI;
      }*/
/*      if (fabs(beta)>PI/2 && state.tension[n2] && rand()%10==1){ // node is locked and cannot turn around -> mirror node on desired direction. + invert beta
         double delta;
         if (beta<0) delta=beta+PI;
         if (beta>0) delta=PI-beta;
         state.nw.nodes[n2].setPoint(state.nw.nodes[n1]+to_left(vec,-2*delta));
         state.mov[n2].x=0; // reset accumulated force;
         state.mov[n2].y=0;
         beta=-beta;
      } else {*/
         Point mv=to_left(vec,factor*scale*beta)-vec;
         state.mov[n2]+=mv;//angular movement; 
         state.mov[n1]-=mv;
//         state.rot[n1]-=(factor*scale*beta); //adjust the default direction of the reaction a little bit (to the opposite direaction).
         state.force[n2]+=manh(mv);
         state.force[n1]+=manh(mv);
#ifdef SHOWPROGRESS
         if (debug) state.debug[n2].push_back(forcevec(mv,debug));
         if (debug) state.debug[n1].push_back(forcevec(-mv,debug));
#endif
         
//      }
   }
   
}

void force_nadj(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug){
   /* This function computes the force induced by non-adjacent nodes, and updates the movements of nodes.
      The force is calculated in this manner:
        1. If the distance between node-n1 and node-n2 (d) is larger than or equal to the the minimum distance (dij2[n1][n2]), then the force is 0; else
        2. force=0.1*(d-dij2[n1][n2])^2.
      If the force is greater than 0, the two nodes will repel each other. That is, they will move apart from each other along the line connecting them.
   */
   int n1,n2,n=state.nw.nodes.size();
   double d,ideal;
   Point vec;
   
   for(n1=0;n1<n;n1++)
      for(n2=n1+1;n2<n;n2++){
//         if(isadj[n1][n2])continue; //we only calculate the force and movements for nonadjacent nodes, so we skip the adjacent ones.             
         ideal=state.avgsize*1.5; //the minimum distance.
         d=dist(state.nw.nodes[n1],state.nw.nodes[n2]); //the distance between node-n1 and node-n2.
         if(d>=ideal)continue; //include force and move nodes only if they are too close to each other;
         
         vec=state.nw.nodes[n2]-state.nw.nodes[n1]; //the vector from node-n1 to node-n2.
/*         if(fabs(d)<zero){
            vec.x=1.0;
            vec.y=0.0;
         }
         else{
            vec.x/=d;vec.x*=2; //x-displacement greater than y-displacement, since width is greater than height for almost all the nodes.
            vec.y/=d;
         }*/
         if (d!=0){
            vec.x*=(ideal-d)/d*factor*scale;
            vec.y*=(ideal-d)/d*factor*scale;
/*            vec.x*=((1/(d/ideal))-1)/d;
            vec.y*=((1/(d/ideal))-1)/d;*/
         } else {
            vec.x=0.001*state.avgsize*factor*scale; // just displace the two a little bit;
            vec.y=0.001*state.avgsize*factor*scale; // just displace the two a little bit;
         }
         state.mov[n1]-=vec;
         state.mov[n2]+=vec;
         state.force[n1]+=manh(vec);
         state.force[n2]+=manh(vec);
#ifdef SHOWPROGRESS
         if (debug) state.debug[n1].push_back(forcevec(-vec,debug));
         if (debug) state.debug[n2].push_back(forcevec(vec,debug));
#endif
         
/*         state.mov[n1].x+=(vec.x/n);state.mov[n1].y+=(vec.y/n); //two nodes repel each other, along the line connecting them.
         state.mov[n2].x-=(vec.x/n);state.mov[n2].y-=(vec.y/n); //two nodes repel each other, along the line connecting them.*/
      }
}

void expand(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug){
   int n1,n2,n=state.nw.nodes.size();
   double d;
   Point vec;
   
   for(n1=0;n1<n;n1++){
      for(n2=n1+1;n2<n;n2++){
         if (state.nw.isNeighbor(n1,n2)) continue;
         double thr=state.avgsize*2;
         vec=state.nw.nodes[n2]-state.nw.nodes[n1]; //the vector from node-n1 to node-n2.
         d=norm(vec);
         if (d<thr) continue; //expansion only for distant nodes
         //vec=unit(vec)*max(0.0,min(norm(vec)/thr,1-(norm(vec)-thr)/4))*state.avgsize*scale;
         vec=(unit(vec)*min(state.avgsize,norm(vec)-thr)+(1-temp)*state.avgsize)*scale;
         state.mov[n1]-=vec;
         state.mov[n2]+=vec;
         state.force[n1]+=manh(vec);
         state.force[n2]+=manh(vec);
         #ifdef SHOWPROGRESS
//         if (debug) state.debug[n1].push_back(forcevec(-vec,debug));
//         if (debug) state.debug[n2].push_back(forcevec(vec,debug));
         #endif
      }
   }
}
void separate_nodes(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug){
   /* similar to force_nadj, but much more agressive */
   int n1,n2,n=state.nw.nodes.size();
   double dw,dh;
   Point vec;
   
   for(n1=0;n1<n;n1++){
      for(n2=n1+1;n2<n;n2++){
         dw=(state.nw.nodes[n1].width+state.nw.nodes[n2].width)/2;
         dh=(state.nw.nodes[n1].height+state.nw.nodes[n2].height)/2;
         vec=state.nw.nodes[n2]-state.nw.nodes[n1];
         if (!norm(vec)) vec.x=0.001; // just separate them a little bit;
         if (fabs(vec.x)>dw+0.1*state.avgsize) continue;
         if (fabs(vec.y)>dh+0.1*state.avgsize) continue;
         dw=(dw<fabs(vec.x) ? (1-(fabs(vec.x)-dw)/(0.1*state.avgsize))*10000 : 10000); //lin. incr. force from distance 0.1*state.avgsize to 0; 1000000 if touching
         dh=(dh<fabs(vec.x) ? (1-(fabs(vec.y)-dh)/(0.1*state.avgsize))*10000 : 10000);
         Point mv=unit(vec)*(dw+dh)*scale;
         state.mov[n1]-=mv;
         state.mov[n2]+=mv;
         state.force[n1]+=manh(mv);
         state.force[n2]+=manh(mv);
#ifdef SHOWPROGRESS
         if (debug) state.debug[n2].push_back(forcevec(mv,debug));
         if (debug) state.debug[n1].push_back(forcevec(-mv,debug));
#endif
      }
   }
}
void limit_mov(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug){
   int n=state.nw.nodes.size();
   for(int i=0;i<n;i++){
      double length=norm(state.mov[i]);
      if (length>state.avgsize*scale) state.mov[i]=state.mov[i]*(state.avgsize*scale/length); // limit movement to average node size
   }
}
void node_collision(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug){
   int n=state.nw.nodes.size(),n1,n2;
//   bool repeat=true;
   double d=MARGIN;
/*   while (repeat){
      repeat=false;*/
      for(n1=0;n1<n;n1++){
         for(n2=n1+1;n2<n;n2++){
            double dw=(state.nw.nodes[n1].width+state.nw.nodes[n2].width)/2+d;
            double dh=(state.nw.nodes[n1].height+state.nw.nodes[n2].height)/2+d;
            Point vec=state.nw.nodes[n2]-state.nw.nodes[n1];
            Point &mov1=state.mov[n1];
            Point &mov2=state.mov[n2];
            Point vec2=state.nw.nodes[n2]+mov2-state.nw.nodes[n1]-mov1;
            if ((fabs(vec.x)>=dw || fabs(vec.y)>=dh) // no overlap on old position
               && fabs(vec2.x)<dw && fabs(vec2.y)<dh){ // overlap on new position
               double qx=(fabs(vec.x)-dw)/fabs(mov2.x-mov1.x);
               double qy=(fabs(vec.y)-dh)/fabs(mov2.y-mov1.y);
               if (qx>qy){ // note : the second direction that hits is the one that has to be cut; the other direction will "glide"
                  double rmom=(mov1.x+mov2.x)*(1-qx)/2; // remaining momentum after hit (i.e. should the two nodes move together)
                  mov1.x*=qx;
                  mov1.x+=rmom;
                  mov2.x*=qx;
                  mov2.x+=rmom;
               } else {
                  double rmom=(mov1.y+mov2.y)*(1-qy)/2;
                  mov1.y*=qy;
                  mov1.y+=rmom;
                  mov2.y*=qy;
                  mov2.y+=rmom;
               }
               //printf("avoided collision %d %d %f %f \n",n1,n2,qx,qy);
            } else if ((fabs(vec.x)<dw && fabs(vec.y)<dh) // overlap on old position and
               && fabs(vec2.x)<dw && fabs(vec2.y)<dh){ // overlap on new position
               // we base calculation on old positions
               if (dw-fabs(vec.x) > dh-fabs(vec.y)){ // x-overlap larger? -> remove smaller overlap
                  double sgn=sign(vec.y);
                  if (sgn==0) sgn=1;
                  mov1.y=-sgn*(dh-fabs(vec.y))/2;
                  mov2.y=+sgn*(dh-fabs(vec.y))/2;
               } else {
                  double sgn=sign(vec.x);
                  if (sgn==0) sgn=1;
                  mov1.x=-sgn*(dw-fabs(vec.x))/2;
                  mov2.x=+sgn*(dw-fabs(vec.x))/2;
               }
               //printf("removed collision %d %d\n",n1,n2);
            }
         }
      }
   //}   
}
void unfix_all(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug){
   for (int i=0,n=state.nw.nodes.size();i<n;i++){
      state.nw.nodes[i].fixed=false;
   }
   state.nw.hasfixed=false;
   
}

void rotate(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug){
   int n=state.nw.nodes.size();
   Point com(0,0); // center of mass
   Point avgdir(0,0);
   for (int i=0;i<n;i++){
      com+=state.nw.nodes[i];
   }
   for (int i=0;i<n;i++){
      if (state.nw.nodes[i].type == reaction){
         //avgdir+=Point(state.nw.nodes[i].dir)*norm(state.nw.nodes[i]-com); // prefer nodes at edge of network
         avgdir+=Point(state.nw.nodes[i].dir);
      }
   }
   com/=(double) n;
   if (norm(avgdir)){
      #ifdef STACKX
      double dangle=PI/2-angle(avgdir);
      #else
      double dangle=PI-angle(avgdir);
      #endif
      for (int i=0;i<n;i++){
         state.nw.nodes[i].setPoint(to_left(state.nw.nodes[i]-com,dangle)+com);
         if (state.nw.nodes[i].type == reaction){
            state.nw.nodes[i].dir=lim(state.nw.nodes[i].dir+dangle);
         }
      }
   }
}
void stack_rotate(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug){
   int n=state.nw.compartments.size();
   Point com(0,0); // center of mass
   Point avgdir(0,0);
   double xmin=DBL_MAX,xmax=-DBL_MAX,ymin=DBL_MAX,ymax=-DBL_MAX;
   for (int i=0;i<n;i++){
      Point c=state.nw.compartments[i].center();
      if (c.x<xmin) xmin=c.x;
      if (c.y<ymin) ymin=c.y;
      if (c.x>xmax) xmax=c.x;
      if (c.y>ymax) ymax=c.y;
   }
   #ifdef STACKX
   double dangle=(xmax-xmin>ymax-ymin ? 0 : -PI/2);
   #elif STACKY
   double dangle=(xmax-xmin<ymax-ymin ? 0 : -PI/2);
   #else
   double dangle=0;
   #endif
   if (dangle!=0){
      for (int i=0;i<n;i++){
         state.nw.nodes[i].setPoint(to_left(state.nw.nodes[i]-com,dangle)+com);
         if (state.nw.nodes[i].type == reaction){
            state.nw.nodes[i].dir=lim(state.nw.nodes[i].dir+dangle);
         }
      }
   }
}

void force_compartments(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug){
   /* This function computes the force induced by compartments, and updates the movements of nodes.
      Compartments are boxes which constrain the nodes belonging to it inside.
      A node experiences force if it is outside its compartment: force=d*d, where d is the shortest distance between the node and its compartment.
      If a node is outside its compartment, we simply move it to the nearest point inside the compartment.
      Specially, compartment-0 is the whole plane.
   */
      
   int i,comp;
   int n=state.nw.nodes.size();
   double w;
   double d=MARGIN;
   for(i=0;i<n;i++){
      comp=state.nw.nodes[i].compartment; //the compartment which node-i belongs to.
      if(comp==0)continue; //the compartment is the whole plane.
      Point vec(0,0);
      if(state.nw.nodes[i].x-state.nw.nodes[i].width/2-d<state.nw.compartments[comp].xmin){ //if it is outside the its compartment.
         w=state.nw.compartments[comp].xmin-state.nw.nodes[i].x+state.nw.nodes[i].width/2+d; //calculate the x-displacement to its nearest point inside the compartment.
         vec.x+=w*scale*factor*(1+9*(1-temp)); // for lower temperatures (temp=0..1) forces increase
      }
      if(state.nw.nodes[i].x+state.nw.nodes[i].width/2+d>state.nw.compartments[comp].xmax){
         w=state.nw.compartments[comp].xmax-state.nw.nodes[i].x-state.nw.nodes[i].width/2-d;
         vec.x+=w*scale*factor*(1+9*(1-temp));
      }
      if(state.nw.nodes[i].y-state.nw.nodes[i].height/2-d<state.nw.compartments[comp].ymin){ //if it is outside the its compartment.
         w=state.nw.compartments[comp].ymin-state.nw.nodes[i].y+state.nw.nodes[i].height/2+d; //calculate the y-displacement to its nearest point inside the compartment.
         vec.y+=w*scale*factor*(1+9*(1-temp));
      }
      if(state.nw.nodes[i].y+state.nw.nodes[i].height/2+d>state.nw.compartments[comp].ymax){
         w=state.nw.compartments[comp].ymax-state.nw.nodes[i].y-state.nw.nodes[i].height/2-d;
         vec.y+=w*scale*factor*(1+9*(1-temp)); // FIXME if factor is not 1/10 the 9 is not correct anymore
      }
      state.mov[i]+=vec;
      state.force[i]+=manh(vec);
#ifdef SHOWPROGRESS
      if (debug) state.debug[i].push_back(forcevec(vec,debug));
#endif
      
   }
}      
   
void compartment_collision(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug){
   int i,comp;
   int n=state.nw.nodes.size();
   double d=MARGIN;
   for(i=0;i<n;i++){
      comp=state.nw.nodes[i].compartment; //the compartment which node-i belongs to.
      if(comp==0)continue; //the compartment is the whole plane.
      Point tgt=state.nw.nodes[i]+state.mov[i];
      Point vec(0,0);
      if(tgt.x-state.nw.nodes[i].width/2-d<state.nw.compartments[comp].xmin){ //if it is outside the its compartment.
         vec.x+=state.nw.compartments[comp].xmin-tgt.x+state.nw.nodes[i].width/2+d; //calculate the x-displacement to its nearest point inside the compartment.
      }
      if(tgt.x+state.nw.nodes[i].width/2+d>state.nw.compartments[comp].xmax){
         vec.x+=state.nw.compartments[comp].xmax-tgt.x-state.nw.nodes[i].width/2-d;
      }
      if(tgt.y-state.nw.nodes[i].height/2-d<state.nw.compartments[comp].ymin){ //if it is outside the its compartment.
         vec.y+=state.nw.compartments[comp].ymin-tgt.y+state.nw.nodes[i].height/2+d; //calculate the y-displacement to its nearest point inside the compartment.
      }
      if(tgt.y+state.nw.nodes[i].height/2+d>state.nw.compartments[comp].ymax){
         vec.y+=state.nw.compartments[comp].ymax-tgt.y-state.nw.nodes[i].height/2-d;
      }
      state.mov[i]+=vec;
   }
}      
   
void distribute_edges(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug){
   /* This procedure tries to distribute the edges incident on a node firmly: the angles btween them tends to be the same.
      This is done by:
         1. sorting the edges in increasing order (by angle).
         2. for each edge-i, we tried to rotate it to the bisector of edge-(i-1) and edge-(i+1).
   */
   int i,j,jj,k,m,n=state.nw.nodes.size(),tem;
//   double strength=0.2; 
   double strength_rea=0.2; //this should not be a major force for reactions , so we make it small.
   VI *neighbors;
   double average,beta,beta2,d;
   for(k=0;k<n;k++){
      neighbors=state.nw.getNeighbors(k);
      m=neighbors->size();
      if(m<2)continue;
      Point baseNode=state.nw.nodes[k];
      for(i=0;i<m-1;i++){ //sort out duplicates
         for(j=i+1;j<m;j++){
            if ((*neighbors)[j]==(*neighbors)[i]){ // i.e. more than one edge to a single neighbor
               tem=(*neighbors)[j];(*neighbors)[j]=(*neighbors)[m-1];(*neighbors)[m-1]=tem; // put duplicate to the end;
               m--;
            }
         }
      }
      if(m<2)continue;
      for(i=0;i<m-1;i++){ // sorting the edges in increasing order (by angle).
         for(j=i+1;j<m;j++){
            if (angle(state.nw.nodes[(*neighbors)[j]]-baseNode)<angle(state.nw.nodes[(*neighbors)[i]]-baseNode)){
               tem=(*neighbors)[i];(*neighbors)[i]=(*neighbors)[j];(*neighbors)[j]=tem;
            }            
         }
      }
      for(i=0;i<m;i++){
         //2. for each edge-i, we tried to rotate it to the bisector of edge-(i-1) and edge-(i+1).
         j=i+1; if(j==m)j=0;
         jj=i-1; if(jj<0)jj=m-1;
//         average=lim(lim(angle(state.nw.nodes[(*neighbors)[j]]-baseNode))+lim(angle(state.nw.nodes[(*neighbors)[jj]]-baseNode)))*0.5; //bisector of edge-(i-1) and edge-(i+1).
         Point vec=state.nw.nodes[(*neighbors)[i]]-baseNode;
//         Point vecj=state.nw.nodes[(*neighbors)[j]]-baseNode;
//         Point vecjj=state.nw.nodes[(*neighbors)[jj]]-baseNode;
         if (vec.x == 0 && vec.y==0) continue;
         beta2=angle(state.nw.nodes[(*neighbors)[j]]-baseNode)-angle(state.nw.nodes[(*neighbors)[jj]]-baseNode);
         if (beta2<=0) beta2+=2*PI;
         average=lim(angle(state.nw.nodes[(*neighbors)[jj]]-baseNode)+beta2/2);
/*         Point avgvec=to_left(Point(state.avgsize,0),average);
         debugline(baseNode.x,baseNode.y,baseNode.x+avgvec.x,baseNode.y+avgvec.y,0,155,255);*/
         beta=lim(average-lim(angle(vec))); //angle difference (from edge-i to the bisector).
//         if (beta==PI) beta=0; // don't know in which directions; may cause problems in some cases so silently ignored
         d=dist(state.nw.nodes[(*neighbors)[i]],baseNode);
         if (state.nw.nodes[k].type==reaction) beta*=strength_rea;
         Point mv=(to_left(vec,beta*factor*scale)-vec);
//         Point mvj=(to_left(vecj,-beta*factor*scale)-vecj)/2;
//         Point mvjj=(to_left(vecjj,-beta*factor*scale)-vecjj)/2;
         state.mov[(*neighbors)[i]]+=mv;
         state.mov[k]-=mv;
//         state.mov[k]-=mv+mvj+mvjj;
         // force has to be delivered to the two neighboring nodes to avoid overall torque on network
         // FIXME this still creates an overal torque
         //state.mov[(*neighbors)[j]]+=mvj;
         //state.mov[(*neighbors)[jj]]+=mvjj;
         state.force[(*neighbors)[i]]+=manh(mv);
         //state.force[(*neighbors)[j]]+=manh(mvj);
         //state.force[(*neighbors)[jj]]+=manh(mvjj);
         //state.force[k]+=manh(mv+mvj+mvjj);
         state.force[k]+=manh(mv);
#ifdef SHOWPROGRESS
         //if (debug) state.debug[k].push_back(forcevec(-mv-mvj-mvjj,debug));
         if (debug) state.debug[k].push_back(forcevec(-mv,debug));
         if (debug) state.debug[(*neighbors)[i]].push_back(forcevec(mv,debug));
//         if (debug) state.debug[(*neighbors)[j]].push_back(forcevec(mvj,debug));
//         if (debug) state.debug[(*neighbors)[jj]].push_back(forcevec(mvjj,debug));
         #endif

      }
      delete neighbors; // we should delete neighbors in the loop as it is generated in each iteration.
   }
}
void adjust_compartments(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug){
   /* This procedure adjusts the boundaries of compartments, so that it tends the minimum rectangle contains all the nodes belongs to it.
   1. find the minimum reactangles that contains all the nodes belongs to the corresponding compartments.
   2. adjust the compartments such that they tend to become the corresponding minimum rectangles.
   3. adjust the compartments such that there is no gap between adjacent compartments.     
   */
   int n=state.nw.nodes.size(),cn=state.nw.compartments.size();
   int i,j,comp;  
   for(comp=1;comp<cn;comp++){ //the 0-th compartment is the infinite plane, so we start from index 1.
      //initialization the rectangles.
      state.nw.compartments[comp].xmin=state.nw.compartments[comp].ymin=inf;
      state.nw.compartments[comp].xmax=state.nw.compartments[comp].ymax=-inf;
   }
   double d=MARGIN; // minimum distance to node boundaries
   for(i=0;i<n;i++){
      //adjusting the compartments to bbox of containing nodes; considering node sizes
      comp=state.nw.nodes[i].compartment;
      if(comp==0)continue;
      if(state.nw.nodes[i].x-state.nw.nodes[i].width/2-d<state.nw.compartments[comp].xmin) state.nw.compartments[comp].xmin=state.nw.nodes[i].x-state.nw.nodes[i].width/2-d;
      if(state.nw.nodes[i].x+state.nw.nodes[i].width/2+d>state.nw.compartments[comp].xmax) state.nw.compartments[comp].xmax=state.nw.nodes[i].x+state.nw.nodes[i].width/2+d;
      if(state.nw.nodes[i].y-state.nw.nodes[i].height/2-d<state.nw.compartments[comp].ymin) state.nw.compartments[comp].ymin=state.nw.nodes[i].y-state.nw.nodes[i].height/2-d;
      if(state.nw.nodes[i].y+state.nw.nodes[i].height/2+d>state.nw.compartments[comp].ymax) state.nw.compartments[comp].ymax=state.nw.nodes[i].y+state.nw.nodes[i].height/2+d;
   }
/*   for(comp=1;comp<cn;comp++){
      //changed ----> adjusting the compartments so that its tends to be the corresponding minimum rectangles.
      state.nw.compartments[comp].xmin+=((bcomp[comp].xmin-state.nw.compartments[comp].xmin)/n);
      state.nw.compartments[comp].xmax+=((bcomp[comp].xmax-state.nw.compartments[comp].xmax)/n);
      state.nw.compartments[comp].ymin+=((bcomp[comp].ymin-state.nw.compartments[comp].ymin)/n);
      state.nw.compartments[comp].ymax+=((bcomp[comp].ymax-state.nw.compartments[comp].ymax)/n);
      // now: set compartment to bounding box
   } */
   
   for(i=1;i<cn;i++){
      for (j=i+1;j<cn;j++){
      //adjusting the compartments so that there is no gap between adjacent ones.
      // Note: there is no force to bring compartments together if they don't overlap. this force should come from the connections between the compartments
         const Compartment &cpi=state.nw.compartments[i];
         const Compartment &cpj=state.nw.compartments[j];
         Point vec=cpj.center()-cpi.center();
         if (2*fabs(vec.x)<cpi.size().x+cpj.size().x && 2*fabs(vec.y)<cpi.size().y+cpj.size().y){ // the 2 compartments overlap
            if (
#ifdef STACKX
1 ||
#endif
#ifdef STACKY
0 &&
#endif
               cpi.size().x+cpj.size().x-2*fabs(vec.x)<cpi.size().y+cpj.size().y-2*fabs(vec.y)){ // move in x direction (if x-overlap is smaller)
               double d=sign(vec.x)*((cpi.size().x+cpj.size().x)/2-fabs(vec.x));
               d*=0.5*(1+(factor*scale-1)*temp);// each compartment should go half way (for temp==0);
               state.nw.compartments[i].translate(-d,0);
               state.nw.compartments[j].translate(d,0);
            } else {
               double d=sign(vec.y)*((cpi.size().y+cpj.size().y)/2-fabs(vec.y));
               d*=0.5*(1+(factor*scale-1)*temp);// each compartment should go half way (for temp==0);
               state.nw.compartments[i].translate(0,-d);
               state.nw.compartments[j].translate(0,d);
            }
         }
      }
   }
}
enum adj {left,top,right,bottom}; // WARNING this needs to be the same order as xmin,ymin,xmax,ymax of Rect
class Adjacency{
   public:
      Adjacency():left(VI()),top(VI()),right(VI()),bottom(VI()){};
      VI& acs(int idx){
         switch (idx) {
            case 0: return left;
            case 1: return top;
            case 2: return right;
            case 3: return bottom;
            default: abort();
         }
      }
      VI left,top,right,bottom;
};

VCPB* adjline(vector<Adjacency> &a, int idx, int dir, vector<VI>& visit){
   if (visit.size()<a.size()) visit.resize(a.size());
   if (visit[idx].size()<4) visit[idx].resize(4);
   if (visit[idx][dir]) return NULL;
   VCPB* ret=new VCPB;
   ret->push_back(CompartmentBorder(idx,dir));
   visit[idx][dir]=1;
   VI& neigh=a[idx].acs(dir);
   
   for (int i=0,is=neigh.size();i<is;i++){ // find neighbor compartments assigned to current copmartment and direction
      VCPB* sub=adjline(a,neigh[i],(dir+2) % 4,visit);
      if (sub) {
         ret->insert(ret->end(),sub->begin(),sub->end());
         delete sub;
      }
   }
   for (int i=1,is=a.size();i<is;i++){ // find compartments which have current compartment and direction assigned as neighbor#
      VI& neigh2=a[i].acs((dir+2) % 4);
      if (find(neigh2.begin(),neigh2.end(),idx)!=neigh2.end()){ // found current compartment
         VCPB* sub=adjline(a,i,(dir+2) % 4,visit);
         if (sub) {
            ret->insert(ret->end(),sub->begin(),sub->end());
            delete sub;
         }
      }
   }
   //sort(ret->begin(),ret->end());
   return ret;
}
void fix_compartments(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug){
   int cn=state.nw.compartments.size();
   int i,j;  
   for(i=1;i<cn;i++){
      for (j=i+1;j<cn;j++){
         //adjusting the compartments so that there is no overlap between them.
         // Note: there is no force to bring compartments together if they don't overlap. this force should come from the connections between the compartments
         const Compartment &cpi=state.nw.compartments[i];
         const Compartment &cpj=state.nw.compartments[j];
         Point vec=cpj.center()-cpi.center();
         if (2*fabs(vec.x)-1e-12<cpi.size().x+cpj.size().x && 2*fabs(vec.y)-1e-12<cpi.size().y+cpj.size().y){ // the 2 compartments overlap
            if (cpi.size().x+cpj.size().x-2*fabs(vec.x)<cpi.size().y+cpj.size().y-2*fabs(vec.y)){ // move in x direction (if x-overlap is smaller)
               double d=sign(vec.x)*((cpi.size().x+cpj.size().x)/2-fabs(vec.x));
               if (vec.x>0){
                  double pos=state.nw.compartments[i].xmax-d/2;
                  state.nw.compartments[i].xmax=pos;
                  state.nw.compartments[j].xmin=pos;
               } else {
                  double pos=state.nw.compartments[i].xmin-d/2;
                  state.nw.compartments[i].xmin=pos;
                  state.nw.compartments[j].xmax=pos;
               }
            } else {
               double d=sign(vec.y)*((cpi.size().y+cpj.size().y)/2-fabs(vec.y));
               if (vec.y>0){
                  double pos=state.nw.compartments[i].ymax-d/2;
                  state.nw.compartments[i].ymax=pos;
                  state.nw.compartments[j].ymin=pos;
               } else {
                  double pos=state.nw.compartments[i].ymin-d/2;
                  state.nw.compartments[i].ymin=pos;
                  state.nw.compartments[j].ymax=pos;
               }
            }
         }
      }
   }
   //state.nd.show(); // FIXME this is just for debug; remove!!
   // expanding compartments as much as possible
   double xmin=DBL_MAX,xmax=-DBL_MAX,ymin=DBL_MAX,ymax=-DBL_MAX;
   for(i=1;i<cn;i++){
      const Compartment &cpi=state.nw.compartments[i];
      if (cpi.xmax>xmax) xmax=cpi.xmax;
      if (cpi.ymax>ymax) ymax=cpi.ymax;
      if (cpi.xmin<xmin) xmin=cpi.xmin;
      if (cpi.ymin<ymin) ymin=cpi.ymin;
   }
   vector<Adjacency> a(cn); // which compartments are adjacent on which size of compartment
   double d=state.avgsize/10000; // all compartment borders that are situated in a -d,+d environment are assumed to be on one line
   for(i=1;i<cn;i++){
      Compartment &cpi=state.nw.compartments[i];
      double where=xmin;
      for (j=1;j<cn;j++){
         if (i==j) continue;
         const Compartment &cpj=state.nw.compartments[j];
         if (cpj.ymax>cpi.ymin && cpj.ymin<cpi.ymax){ // could collide if exapnding
            if (cpj.xmin<cpi.xmax && cpj.xmax>=where-d) {
               if (cpj.xmax>where+d) a[i].left.clear();
               a[i].left.push_back(j);
               where=cpj.xmax;
            }
         }
      }
      if (where<cpi.xmin) cpi.xmin=where; // move to left
      where=xmax;
      for (j=1;j<cn;j++){
         if (i==j) continue;
         const Compartment &cpj=state.nw.compartments[j];
         if (cpj.ymax>cpi.ymin && cpj.ymin<cpi.ymax){ // could collide if exapnding
            if (cpj.xmax>cpi.xmin && cpj.xmin<=where+d) {
               if (cpj.xmin<where-d) a[i].right.clear();
               a[i].right.push_back(j);
               where=cpj.xmin;
            }
         }
      }
      if (where>cpi.xmax) cpi.xmax=where; // move to right
      where=ymin;
      for (j=1;j<cn;j++){
         if (i==j) continue;
         const Compartment &cpj=state.nw.compartments[j];
         if (cpj.xmax>cpi.xmin && cpj.xmin<cpi.xmax){ // could collide if exapnding
            if (cpj.ymin<cpi.ymax && cpj.ymax>=where-d) {
               if (cpj.ymax>where+d) a[i].top.clear();
               a[i].top.push_back(j);
               where=cpj.ymax;
            }
         }
      }
      if (where<cpi.ymin) cpi.ymin=where; // move to top
      where=ymax;
      for (j=1;j<cn;j++){
         if (i==j) continue;
         const Compartment &cpj=state.nw.compartments[j];
         if (cpj.xmax>cpi.xmin && cpj.xmin<cpi.xmax){ // could collide if exapnding
            if (cpj.ymax>cpi.ymin && cpj.ymin<=where+d) {
               if (cpj.ymin<where-d) a[i].bottom.clear();
               a[i].bottom.push_back(j);
               where=cpj.ymin;
            }
         }
      }
      if (where>cpi.ymax) cpi.ymax=where; // move to bottom
   }
   state.nw.compartment_borders.clear();
   vector<VI> visit;
   for(i=1;i<cn;i++){ // create inner compartment border lines
      for (int j=0;j<4;j++){
         VCPB* line=adjline(a,i,j,visit);
         if (line && line->size()>1) {
            int idx=state.nw.compartment_borders.size();
            for (int k=0,kn=line->size();k<kn;k++){
               state.nw.compartments[(*line)[k].compartment].border_index.acs((*line)[k].dir)=idx; //setting compartment vorder index to corresponding compartments
            }
            state.nw.compartment_borders.push_back(*line); // store compartment border
         }
         if (line) delete line;
      }
   }
   for (int j=0;j<4;j++){ // create outer compartment border lines
      VCPB line;
      int idx=state.nw.compartment_borders.size();
      for(i=1;i<cn;i++){
         if (a[i].acs(j).size()==0){ // an outer border
            line.push_back(CompartmentBorder(i,j));
            state.nw.compartments[i].border_index.acs(j)=idx;
         }
      }
      state.nw.compartment_borders.push_back(line); // store compartment border
   }
   //state.nd.show(); // FIXME this is just for debug; remove!!
   
}
void __move(Layouter &state, double pos, double d, int dir){
   // moves compartment borders within a certain range of pos by d in the direction of what
   int i;
   int cn=state.nw.compartments.size();
   if (dir>=2) dir-=2; // only x or y direction
   VF ps; // all positions
   for(i=1;i<cn;i++){
      if (dir==0) { // x direction
         ps.push_back(state.nw.compartments[i].xmin);
         ps.push_back(state.nw.compartments[i].xmax);
      } else { // y direction
         ps.push_back(state.nw.compartments[i].ymin);
         ps.push_back(state.nw.compartments[i].ymax);
      }
   }
   sort(ps.begin(),ps.end());
   int psn=ps.size() ;
   i=0;
   while (i<psn && ps[i]<pos) i++;
   double pos2=pos+d;
   if (d<0){
      i--;
      while (i>=0 && ps[i]>pos2) { // find all lines in range pos-|d| .. pos; if found, extend range to ps[i]-|d| .. pos
         pos2=ps[i]+d;
         i--;
      }
   } else {
      while (i<psn && ps[i]<pos2) { // same for range pos .. pos +|d|
         pos2=ps[i]+d;
         i++;
      }
   }
   if (pos>pos2) swap(pos,pos2);
   for(i=1;i<cn;i++){ //the 0-th compartment is the infinite plane, so we start from index 1.
      Compartment &cp=state.nw.compartments[i];
      if (dir==0) { // x direction
         if (cp.xmin>=pos && cp.xmin<=pos2) cp.xmin+=d; // move compartment borders in range pos..pos2 by d
         if (cp.xmax>=pos && cp.xmax<=pos2) cp.xmax+=d;
      } else { // y direction
         if (cp.ymin>=pos && cp.ymin<=pos2) cp.ymin+=d;
         if (cp.ymax>=pos && cp.ymax<=pos2) cp.ymax+=d;
      }
   }
}
void __moveall(Layouter &state, double where, double diff, int dir){ // moves everything left or right (dependent on sgn d) by d
   where-=diff/1000; // just to be shure to get also all borders exactly at where
   int cn=state.nw.compartments.size();
   for (int c=1;c<cn;c++){ // shifting all compartment borders on the corresponding side of 'where' to the corresponding side
      Compartment &cp=state.nw.compartments[c];
      if ((cp.acs(dir)-where)*diff>0) cp.acs(dir)+=diff;
      if ((cp.acs((dir+2) % 4)-where)*diff>0) cp.acs((dir +2) % 4)+=diff; // the other border on the same axis
   }
/*   if (dir>=2) dir-=2; // for nodes we only have x,y coordinates (not xmin,ymin,xmay,ymax)
   int n=state.nw.nodes.size();
   for (int i=0;i<n;i++){ // shifting all nodes on the corresponding side of 'where' to the corresponding side
      Node &nd=state.nw.nodes[i];
      if (dir==0){
         if ((nd.x-where)*diff>0) nd.x+=diff;
      } else {
         if ((nd.y-where)*diff>0) nd.y+=diff;
      }
   }*/
   
}
void adjust_compartments_fixed(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug){
   int n=state.nw.nodes.size(),cn=state.nw.compartments.size(),cbn=state.nw.compartment_borders.size();
   int i,c;  
   VCP newpos(cn);
   VCP forces(cn);
   vector<VI> numbers(cn);
   double d=MARGIN; // minimum distance to node boundaries
   for(c=1;c<cn;c++){ //the 0-th compartment is the infinite plane, so we start from index 1.
      for (i=0;i<4;i++){
         newpos[c].acs(i)=state.nw.compartments[c].acs(i);
      }
      numbers[c].resize(4);
   }
   numbers.resize(cn);
   for(i=0;i<n;i++){
      //get forces from nodes outside of their compartments
      c=state.nw.nodes[i].compartment;
      if (c==0) continue;
      Compartment &cpo=state.nw.compartments[c];
      Rect rnode=state.nw.nodes[i].rect();
      rnode.extend(d);
      for (int j=0;j<4;j++){ // loop over all directions
         double size=(j % 2==0 ? state.nw.nodes[i].width/2+d : state.nw.nodes[i].height/2+d);
         if (j<2) size=-size; // left and top direction -> size negative
         double diff=rnode.acs(j)-cpo.acs(j);
         if (j<2 ? diff<0 : diff>0) {
            forces[c].acs(j)+=diff;
            numbers[c][j]++;
            if (j<2 ? newpos[c].acs(j)>cpo.acs(j)+diff : newpos[c].acs(j)<cpo.acs(j)+diff ){
               newpos[c].acs(j)=cpo.acs(j)+diff; // optimal position of border to include all nodes
            }
         }
      }
   }
   for (c=0;c<cbn;c++){ // loop through compartment border lines; adding all forces by nodes on the compartment borders adjacent to this inner comparmtnet boder line
      double shift=0;
      const VCPB &cbs=state.nw.compartment_borders[c];
      int count=0;
      for (i=0;i<(int)cbs.size();i++){
         shift+=forces[cbs[i].compartment].acs(cbs[i].dir);
         count+=numbers[cbs[i].compartment][cbs[i].dir];
      }
      shift/=count; // divide by number of out of compartment nodes for this border
      if (shift!=0.0) __move(state,state.nw.compartments[cbs[0].compartment].acs(cbs[0].dir),shift,cbs[0].dir);
      //state.nd.show(); // FIXME this is just for debug; remove!!
      
   }
   
   // shrink outer boundaries
   
   for (c=cbn-4;c<cbn;c++){ // only outer borders
      int dir=c+4-cbn; // get direction from index order (they are added in exactly this order)
      int sgn=(dir>=2 ? -1 : 1);
      const VCPB &cbs=state.nw.compartment_borders[c];
      for (i=0;i<(int)cbs.size();i++){
         if (cbs[i].dir!=dir) throw "direction error";
         state.nw.compartments[cbs[i].compartment].acs(dir)+=sgn*state.avgsize/4;
         state.nw.compartments[0].acs(dir)=state.nw.compartments[cbs[i].compartment].acs(dir); // set compartment 0 boundaries to network boundaries
      }
   }
/*   double limits[4];
   limits[0]=limits[1]=DBL_MAX;
   limits[2]=limits[3]=-DBL_MAX;
   double &xmin=limits[0];
   double &ymin=limits[1];
   double &xmax=limits[2];
   double &ymax=limits[3];
   
   for(c=1;c<cn;c++){
      Compartment &cpo=state.nw.compartments[c];
      for (i=0;i<4;i++){
         if (i<2 && cpo.acs(i)<limits[i]) limits[i]=cpo.acs(i); // set xmin,ymin
         if (i>=2 && cpo.acs(i)>limits[i]) limits[i]=cpo.acs(i); // set xmax,ymax
      }
   }
   for(c=1;c<cn;c++){
      Compartment &cpo=state.nw.compartments[c];
      Compartment &cpn=newpos[c];
      if (cpo.xmin>cpn.xmin) __move(state, cpo.xmin,(cpn.xmin-cpo.xmin)*factor*scale,dir_LR);
      if (cpo.xmax<cpn.xmax) __move(state, cpo.xmax,(cpn.xmax-cpo.xmax)*factor*scale,dir_LR);
      if (cpo.ymin>cpn.ymin) __move(state, cpo.ymin,(cpn.ymin-cpo.ymin)*factor*scale,dir_TB);
      if (cpo.ymax<cpn.ymax) __move(state, cpo.ymax,(cpn.ymax-cpo.ymax)*factor*scale,dir_TB);
   }
   // clip all compartments to networks bbox (in particular compartment 0)
   for(c=0;c<cn;c++){
      Compartment &cp=state.nw.compartments[c];
      if (cp.xmin<xmin) cp.xmin=xmin;
      if (cp.ymin<ymin) cp.ymin=ymin;
      if (cp.xmax>xmax) cp.xmax=xmax;
      if (cp.ymax>ymax) cp.ymax=ymax;
   }*/
//   fix_compartments(state,pg,scale,iter,temp,debug); // FIXME this is just a hotfix
}
template <typename T>void vassign(vector<T>& v,const vector<T>& v2){
   v.assign(v2.begin(),v2.end());
}
template <typename T>void vappend(vector<T>& v,const vector<T>& v2){
   v.insert(v.end(),v2.begin(),v2.end());
}

void swap_reactants(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug){
   /* this plugin swaps substrates, products or modulators among each other if this reduces the force on these nodes
   */
   int i,j,k,s,e,es,m;
   int n=state.nw.nodes.size();
   VI neigh[2];
   double f1,f2,d;
   for(k=0;k<n;k++){
      if (state.nw.nodes[k].type!=reaction) continue;
      vassign(neigh[0],*(state.nw.getNeighbors(k,substrate))); //substrates
      vassign(neigh[1],*(state.nw.getNeighbors(k,product))); // products
      vassign(neigh[2],*(state.nw.getNeighbors(k,catalyst))); // modulators
      vappend(neigh[2],*(state.nw.getNeighbors(k,inhibitor))); // modulators
      vappend(neigh[2],*(state.nw.getNeighbors(k,activator))); // modulators
      for (m=0;m<2;m++){ // for all three classes of neighbors:
         s=neigh[m].size();
         for (i=0;i<s;i++){
            for (j=i+1;j<s;j++){
               // calc force of the two nodes
               {
                  VI& edges=state.nw.nodes[i].neighbors;
                  es=edges.size();
                  f1=0.0;
                  for (e=0;e<es;e++){
                     d=dist(state.nw.nodes[state.nw.edges[edges[e]].from],state.nw.nodes[state.nw.edges[edges[e]].to]); //length of edge edges[e].
                     f1+=fabs(d-state.dij[edges[e]]);
                  }
                  edges=state.nw.nodes[j].neighbors;
                  es=edges.size();
                  for (e=0;e<es;e++){
                     d=dist(state.nw.nodes[state.nw.edges[edges[e]].from],state.nw.nodes[state.nw.edges[edges[e]].to]); //length of edge edges[e].
                     f1+=fabs(d-state.dij[edges[e]]);
                  }
               }
               // swap node positions
               Point h=state.nw.nodes[i];
               state.nw.nodes[i].setPoint(state.nw.nodes[j]);
               state.nw.nodes[j].setPoint(h);
               // calc force of the two nodes
               {
                  VI& edges=state.nw.nodes[i].neighbors;
                  es=edges.size();
                  f2=0.0;
                  for (e=0;e<es;e++){
                     d=dist(state.nw.nodes[state.nw.edges[edges[e]].from],state.nw.nodes[state.nw.edges[edges[e]].to]); //length of edge edges[e].
                     f2+=fabs(d-state.dij[edges[e]]);
                  }
                  edges=state.nw.nodes[j].neighbors;
                  es=edges.size();
                  for (e=0;e<es;e++){
                     d=dist(state.nw.nodes[state.nw.edges[edges[e]].from],state.nw.nodes[state.nw.edges[edges[e]].to]); //length of edge edges[e].
                     f2+=fabs(d-state.dij[edges[e]]);
                  }
               }
               if (f2>=f1){ // swap back
                  Point h=state.nw.nodes[i];
                  state.nw.nodes[i].setPoint(state.nw.nodes[j]);
                  state.nw.nodes[j].setPoint(h);
               } else {
                  // positions have changed; start all over again
                  i=0;
                  j=0;
               }
            }
         }
      }
   }      
}

void min_edge_crossing(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug){
   int m=state.nw.edges.size();
   int i,j;
   for (i=0;i<m;i++){
      for (j=0;j<m;j++){
         int ni1=state.nw.edges[i].from;
         int ni2=state.nw.edges[i].to;
         int nj1=state.nw.edges[j].from;
         int nj2=state.nw.edges[j].to;
         if (ni1==nj1 || ni1==nj2 || ni2==nj1 || ni2==nj2) continue; // ignore adjacent edges
         ParamEdge pi=ParamEdge(state.nw.nodes[ni1],state.nw.nodes[ni2]);
         ParamEdge pj=ParamEdge(state.nw.nodes[nj1],state.nw.nodes[nj2]);
         pi.extend((state.nw.nodes[ni1].width+state.nw.nodes[ni1].height)/4,(state.nw.nodes[ni2].width+state.nw.nodes[ni2].height)/4); // entend edges a bit to consider nodes sizes
//         pj.extend((state.nw.nodes[nj1].width+state.nw.nodes[nj1].height)/4,(state.nw.nodes[nj2].width+state.nw.nodes[nj2].height)/4);
         if (pi.cross(pj)){
            if (state.deg[ni1]==1){
               double p=pi.cross_param(pj)-pi.start;
               Point vec=pi.unit()*p*factor*scale;
               state.mov[ni1]+=vec;
               state.force[ni1]+=manh(vec);
               state.mov[nj1]-=vec/2;
               state.force[nj1]+=manh(vec)/2;
               state.mov[nj2]-=vec/2;
               state.force[nj2]+=manh(vec)/2;
#ifdef SHOWPROGRESS
               if (debug) state.debug[ni1].push_back(forcevec(vec,debug));
               if (debug) state.debug[nj1].push_back(forcevec(-vec/2,debug));
               if (debug) state.debug[nj2].push_back(forcevec(-vec/2,debug));
#endif
            } else if (state.deg[ni2]==1){
               double p=pi.length()-pi.cross_param(pj)+pi.start;
               Point vec=-pi.unit()*p*factor*scale;
               state.mov[ni1]+=vec;
               state.force[ni1]+=manh(vec);
               state.mov[nj1]-=vec/2;
               state.force[nj1]+=manh(vec)/2;
               state.mov[nj2]-=vec/2;
               state.force[nj2]+=manh(vec)/2;
#ifdef SHOWPROGRESS
               if (debug) state.debug[ni2].push_back(forcevec(vec,debug));
               if (debug) state.debug[nj1].push_back(forcevec(-vec/2,debug));
               if (debug) state.debug[nj2].push_back(forcevec(-vec/2,debug));
#endif
            }
/*            if (state.deg[nj1]==1){
               double p=pj.cross_param(pi);
               Point vec=pj.unit()*p*factor*scale;
               state.mov[nj1]+=vec;
               state.force[nj1]+=manh(vec);
               state.mov[ni1]-=vec/2;
               state.force[ni1]+=manh(vec)/2;
               state.mov[ni2]-=vec/2;
               state.force[ni2]+=manh(vec)/2;
#ifdef SHOWPROGRESS
               if (debug) state.debug[nj1].push_back(forcevec(vec,debug));
               if (debug) state.debug[ni1].push_back(forcevec(-vec/2,debug));
               if (debug) state.debug[ni2].push_back(forcevec(-vec/2,debug));
#endif
            } else if (state.deg[nj2]==1){
               double p=pj.length()-pj.cross_param(pi);
               Point vec=-pj.unit()*p*factor*scale;
               state.mov[nj1]+=vec;
               state.force[nj1]+=manh(vec);
               state.mov[ni1]-=vec/2;
               state.force[ni1]+=manh(vec)/2;
               state.mov[ni2]-=vec/2;
               state.force[ni2]+=manh(vec)/2;
#ifdef SHOWPROGRESS
               if (debug) state.debug[nj2].push_back(forcevec(vec,debug));
               if (debug) state.debug[ni1].push_back(forcevec(-vec/2,debug));
               if (debug) state.debug[ni2].push_back(forcevec(-vec/2,debug));
#endif
            }*/
         }
      }
   }
}
void min_edge_crossing_multi(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug){
   //moves a node over an edge if all its neighbors lay on the other side
   int n=state.nw.nodes.size();
   int m=state.nw.edges.size();
   int i,j,q;
   for (i=0;i<n;i++){ // nodes
      for (j=0;j<m;j++){ // edges;
         ParamEdge pj=ParamEdge(state.nw,state.nw.edges[j]);
         const VI &nb=state.nw.nodes[i].neighbors; // neighboring edges
         bool one_crosses=false; //at least one edge q really crosses edge j
         bool all_cross_line=true; // all edges q cross straight line given by edge j
         int s=nb.size();
         if (s<2) continue; // single connected nodes are dealt with by min_edge_crossing
         Point ext_edge_end;
         for (q=0;q<s;q++){
            if (state.nw.edges[nb[q]].from==state.nw.edges[j].from ||
               state.nw.edges[nb[q]].from==state.nw.edges[j].to ||
               state.nw.edges[nb[q]].to==state.nw.edges[j].from ||
               state.nw.edges[nb[q]].to==state.nw.edges[j].to) continue; // this one does not count as it is adjacent to edge j
            ParamEdge pq=ParamEdge(state.nw,state.nw.edges[nb[q]]);
            pq.extend(state.nw.nodes[state.nw.edges[nb[q]].from].rect().r(),state.nw.nodes[state.nw.edges[nb[q]].to].rect().r()); // extend edge to accomodate extension of nodes
            double kj=pj.cross_param(pq);
            double kq=pq.cross_param(pj);
            if (kj>pj.start && kj<pj.end && kq>pq.start && kq<pq.end){
               one_crosses=true;
               if (i==state.nw.edges[nb[q]].from){
                  ext_edge_end=pq.from();
               } else {
                  ext_edge_end=pq.to();
               }
            }
            if (kq<pq.start || kq>pq.end) all_cross_line=false;
         }
         if (one_crosses && all_cross_line) { // move point i over edge j
            Point vec=pj.dist_vec(ext_edge_end)*factor*scale;
            state.mov[i]+=vec;
            state.mov[state.nw.edges[j].from]-=vec/2;
            state.mov[state.nw.edges[j].to]-=vec/2;
            state.force[i]+=manh(vec);
            state.force[state.nw.edges[j].from]+=manh(vec/2);
            state.force[state.nw.edges[j].to]+=manh(vec/2);
#ifdef SHOWPROGRESS
            if (debug) state.debug[i].push_back(forcevec(vec,debug));
            if (debug) state.debug[state.nw.edges[j].from].push_back(forcevec(-vec/2,debug));
            if (debug) state.debug[state.nw.edges[j].to].push_back(forcevec(-vec/2,debug));
            #endif            
         }
      }
   }
}
         
// helpers
int _find(VI* nd,int idx){
   int n=nd->size();
   int i;
   for (i=0;i<n;i++){
      if ((*nd)[i]==idx) return i;
   }
   return 0;
}
double _getwidths(Network &nw,VI* nd){
   int n=nd->size();
   int i;
   double width=0;
   for (i=0;i<n;i++){
      width+=nw.nodes[(*nd)[i]].width;
   }
   return width;
}
double _getheights(Network &nw,VI* nd){
   int n=nd->size();
   int i;
   double height=0;
   for (i=0;i<n;i++){
      height+=nw.nodes[(*nd)[i]].height;
   }
   return height;
}
#ifdef old

double swap_force(int p1, int p2){
   /*This function calculates the force reduced afer placing node-p1 at node-p2's position.
     When we swap two nodes, the sum of non-adjacent forces almost remain the same. Thus we only compute the adjacent forces reduced.
     The computations are very similar to those in method calc_force_adj(). 
     However, since swap_node() is only used in initialization, we make the angular force 10 times larger than that in calc_force_adj().
     This magnification can increase the hierarchy of the layout.
   */
   int m,i,y,_type=state.nw.nodes[p1].type;
   double force=0.0,i_d,d,alpha, i_alpha, beta, beta1;
   Point vec;
   VI neighbors= *(state.nw.nodes[p1].neighbors); // The neighbor edges of node-p1 (it's a copy).
   m=neighbors.size();
   //distantal force;
   for(i=0;i<m;i++){
      i_d=dij1[neighbors[i]]; //ideal distance.
      if(_type==reaction)y=state.nw.edges[neighbors[i]].to; //node-y is a neighbor node of node-p1 (the other end of a neighbor edge).
      else y=state.nw.edges[neighbors[i]].from;
      d=dist(state.nw.nodes[p1],state.nw.nodes[y]); //distance between node-p1 and node-y.
      force+=((i_d-d)*(i_d-d)); //adding the force induced when node-p1 is at state.nw.nodes[p1].
      d=dist(state.nw.nodes[p2],state.nw.nodes[y]); //distance between node-p2 and node-y.
      force-=((i_d-d)*(i_d-d)); //minus the force induced when node-p1 is moved to state.nw.nodes[p2].
   }
   
   //angular force;
   for(i=0;i<m;i++){
      i_d=dij1[neighbors[i]];
      y=state.nw.edges[neighbors[i]].to;              
      if(_type==reaction)vec=state.nw.nodes[y]-state.nw.nodes[p1]; //the direction of the vector: always from reactions to compouds
      else vec=state.nw.nodes[p1]-state.nw.nodes[y];           
                       
      alpha=angle(vec);
      if(_type==substrate){
         i_alpha=0.5*PI+state.rot[p1];
         beta=lim(i_alpha-alpha);
      }         
      else if(_type==product){
         i_alpha=1.5*PI+state.rot[p1];
         beta=lim(i_alpha-alpha);
      }
      else{ //other compounds, rotating to the nearer side.
         i_alpha=state.rot[p1]; beta=lim(i_alpha-alpha);
         double i_alpha1=PI+state.rot[p1], beta1=lim(i_alpha-alpha);
         if(fabs(beta)>fabs(beta1)){
            beta=beta1;
            i_alpha=i_alpha1;
         }
      }
      force+=(d*d*sin(0.5*fabs(beta))); //adding the angular force (10 time larger than that in calc_force_adj()) when node-p1 is at state.nw.nodes[p1].
      
      if(_type==reaction)vec=state.nw.nodes[y]-state.nw.nodes[p2]; //direction of the vector: always from reactions to compounds.
      else vec=state.nw.nodes[p2]-state.nw.nodes[y];
      alpha=angle(vec);
      if(_type==substrate){
         i_alpha=0.5*PI+state.rot[p1];
         beta=lim(i_alpha-alpha);
      }         
      else if(_type==product){
         i_alpha=1.5*PI+state.rot[p1];
         beta=lim(i_alpha-alpha);
      }
      else{ //other compounds, rotating to the nearer side.
         i_alpha=state.rot[p1]; beta=lim(i_alpha-alpha);
         double i_alpha1=PI+state.rot[p1], beta1=lim(i_alpha-alpha);
         if(fabs(beta)>fabs(beta1)){
            beta=beta1;
            i_alpha=i_alpha1;
         }
      }
      force-=(d*d*sin(0.5*fabs(beta))); //minus the angular force when node-p1 is moved to state.nw.nodes[p2].
   }
   neighbors.clear(); //release memory.
   return force;
}

bool swap_node(){
   /*This function enumerates every nodes (k) and check all neighbors of node-k to see whether a swapping of two neighbors can reduce the system force.
     If 'YES", then we swap them.
     However, checking all pairs of neighbor nodes may be time consuming, thus we only check those "close" neighbors.
     "close" neighbors are: we sort the edges increasingly by angle, then the neighbor node on edge[i] and the neighbor node on edge[i+1] are "close" neighbors.
   */
   int i,j,k,m,n=state.nw.nodes.size(),tem;
   VI *neighbors;
   double f1,f2;
   Point baseNode, temp;
   bool flag=false;
   for(k=0;k<n;k++){
      neighbors= getNeighbors(k); //the neighbor edges of node-k (it is a copy).
      m=neighbors->size();
      if(m==1)continue; //one neighbor only.
      baseNode=state.nw.nodes[k];
      for(i=0;i<m-1;i++) //sorting the edges increasinly by angle.
         for(j=i+1;j<m;j++)
            if(lim(angle(state.nw.nodes[(*neighbors)[j]]-baseNode))<lim(angle(state.nw.nodes[(*neighbors)[i]]-baseNode))){
               tem=(*neighbors)[i];(*neighbors)[i]=(*neighbors)[j];(*neighbors)[j]=tem;
            }
      for(i=0;i<m;i++){
         j=i+1;
         if(j==m)j=0;
         f1=swap_force((*neighbors)[i],(*neighbors)[j]); //force reduced after moving node-p1 to state.nw.nodes[p2].
         f2=swap_force((*neighbors)[j],(*neighbors)[i]); //force reduced after moving node-p2 to state.nw.nodes[p1].
         if(f1+f2>0){ //force reduced after swapping node-p1 and node-p2.
            //if it is positive, we swap the two nodes.
            temp=state.nw.nodes[(*neighbors)[i]];
            state.nw.nodes[(*neighbors)[i]]=state.nw.nodes[(*neighbors)[j]];
            state.nw.nodes[(*neighbors)[j]]=temp;
            flag=true;            
         }
      }
     delete neighbors; // we should delete neighbors in the loop as it is generated in each iteration.
   }
   return flag;
} 
      

   


void post_pro_dist(){
   /*In the post processing step, one of our objective is to make the edges shorter, which is mainly achieved by shorten the ideal edge lengths.
     However, non-adjacent force can also contribute to edge length, especially the force between the nodes with common neighbor.
     Thus, in this procedure, we reduce the minimum distance for non-adjacent node pairs which have common neighbor.
   */
   int n=state.nw.nodes.size(),i,j,n1,n2,nn,m,l;
   vector< vector<bool> >cm; //cm[n1][n2]=true: node-n1 and node-n2 has common neighbor.
   VI *neighbors,*neis;
   cm.resize(n);
   for(n1=0;n1<n;n1++){
      cm[n1].resize(n);
      neighbors=getNeighbors(n1); //neighbors of node-n1.
      m=neighbors->size();
      for(i=0;i<m;i++){
         nn=(*neighbors)[i]; //nn is a neighbor node of node-n1.
         neis=getNeighbors(nn); //the neighbors of node-nn.
         l=neis->size();
         for(j=0;j<l;j++){
            //n2 is a neighbor node of node-nn. Node-nn is a common neighbor for node-n1 and node-n2.
            n2=(*neis)[j];
            cm[n1][n2]=true;
         }
         delete neis; //release memory.
      }
      delete neighbors; //release memory.
   }
   for(n1=0;n1<n;n1++)
      for(n2=n1+1;n2<n;n2++)
         if(cm[n1][n2])dij2[n1][n2]*=0.8; //reduce the minimum distance between nodes with common neighbor.
   for(n1=0;n1<n;n1++)cm[n1].clear(); //release memory.
   cm.clear(); //releas memory.
} 
      
double post_pro(int _round){
   /* This is a post_processing function, which has 2 schemes depending on the argument "_round".
         1. _round=1, we processing the edges (adjacent nodes) only by making the edges shorter.
         2. _round=2, other than making the edges shorter, we also try to remove node-overlapping.
      The force function here is different from those in other functions or procedures. It is a exponetial function:
         force=pow(2.0, 5.0*fabs(i_d-d)).
      In this manner, we can force the overlapping nodes to seperate and can also make the edges to be shorter and fairer.
   */
   int m=state.nw.edges.size(),n=state.nw.nodes.size(),n1,n2,i;
   double d,i_d,force=0.0;
   Point vec;
   
   for(i=0;i<m;i++){
      //dealing with the edges. Here we consider distantal forces only.                  
      n1=state.nw.edges[i].from; //reaction
      n2=state.nw.edges[i].to; //compound;
      if(_round==1 && state.deg[n1]>3 && state.deg[n2]>3)continue; //we do not disturb the edge, both of whose ends have high connections. Otherwise the many nodes will be disturbed.
      vec=state.nw.nodes[n2]-state.nw.nodes[n1];
      i_d=dij1[i]; //ideal length
      if(fabs(vec.y)*1.2>=state.nw.nodes[n1].height+state.nw.nodes[n2].height)i_d*=0.8; //further shrink the edge length if the two nodes are seperated far enough.
      if(fabs(vec.x)*1.2>=state.nw.nodes[n1].width+state.nw.nodes[n2].width)i_d*=0.9;
      d=dist(state.nw.nodes[n1],state.nw.nodes[n2]); //length
      if(d<i_d && d>i_d*0.7)continue; //edge-length acceptable.
      if(_round==1)force+=pow(2.0,(double)5.0*fabs(i_d-d)); //force calculation: an exponential function.
      else force+=pow(2.0,(double)1.0*fabs(i_d-d)); //_round=2: our main objective is to seperate the overlapping nodes, thus the edge length should play a less important role. 
      //distantal movements;
      if(_round==1){
         //we move the nodes faster for _round=1.
         state.mov[n2].x+=(2*vec.x/d*(i_d-d)/n);
         state.mov[n2].y+=(2*vec.y/d*(i_d-d)/n);
         state.mov[n1].x-=(2*vec.x/d*(i_d-d)/n);
         state.mov[n1].y-=(2*vec.y/d*(i_d-d)/n);
      }
      else{      
         state.mov[n2].x+=(vec.x/d*(i_d-d)/n);
         state.mov[n2].y+=(vec.y/d*(i_d-d)/n);
         state.mov[n1].x-=(vec.x/d*(i_d-d)/n);
         state.mov[n1].y-=(vec.y/d*(i_d-d)/n);
      }
   }
   if(_round==1)return force; //exit for _round=1: shrinking the edges only.
   
   for(n1=0;n1<n;n1++)
      for(n2=n1+1;n2<n;n2++){
         if(isadj[n1][n2])i_d=dij2[n1][n2]*0.3; //special treatment for adjacent nodes.
         else i_d=dij2[n1][n2]*0.7;
         d=dist(state.nw.nodes[n1],state.nw.nodes[n2]);
         if(d>=i_d)continue; //include force and move nodes only if they are too close to each other;
         if(fabs(state.nw.nodes[n1].x-state.nw.nodes[n2].x)>state.nw.nodes[n1].width+state.nw.nodes[n2].width)continue; //if they are already seperated.
         if(fabs(state.nw.nodes[n1].y-state.nw.nodes[n2].y)>state.nw.nodes[n1].height+state.nw.nodes[n2].height)continue;
         
         force+=pow(2.0,(double)5.0*fabs(i_d-d)); //force calculation: it is an exponential function.
         vec=state.nw.nodes[n1]-state.nw.nodes[n2];
         if(fabs(d)<zero){
            vec.x=i_d;
            vec.y=0.0;
         }
         else{
            vec.x=2*vec.x*(i_d-d)/d;
            vec.y=3*vec.y*(i_d-d)/d; //we move more in y-direction.
         }
         if(fabs(vec.y)<zero){
            //if they are at the same level, we increase the displacement vector in x-direction.
            vec.y=i_d;
            vec.x*=5;
         }
         state.mov[n1].x+=(vec.x/n);state.mov[n1].y+=(vec.y/n);
         state.mov[n2].x-=(vec.x/n);state.mov[n2].y-=(vec.y/n);
      }
   return force;      
}
  
bool near_swap(){
   /* Similar to swap_node() function, this function swaps the positions of two nodes if the swapping reduces system force.
      The difference is: rather than considering the ends of two adajcent edges, this function considers the nodes which are near to each other.
      Our definition of near is: dist(state.nw.nodes[n1], state.nw.nodes[n2])<=dij2[n1][n2]*0.1 (actually, they are likely to be overlapping each other).
      This function is implemented both in initialization and in post-processing.
   */  
   int n1,n2,n=state.nw.nodes.size();
   double i_d,d,f1,f2;
   bool flag=false;
   Point temp;
   for(n1=0;n1<n;n1++)
      for(n2=n1+1;n2<n;n2++){       
         i_d=dij2[n1][n2]*0.1; //the cut-down distance for "near" pairs.
         d=dist(state.nw.nodes[n1],state.nw.nodes[n2]); //actually distance.
         if(d>=i_d)continue;
         f1=swap_force(n1,n2);
         f2=swap_force(n2,n1);
         if(f1+f2>0){
            temp=state.nw.nodes[n1];state.nw.nodes[n1]=state.nw.nodes[n2];state.nw.nodes[n2]=temp;
            flag=true;            
         }
      }
   return flag;
}  

double min_edge_crossing(int state.nw.degree(1)im){
   /*This function tries to minimize edge crossings:
        1. we find two edges which are crossing each other (by enumeration).
        2. rotate the node which has least connection about the other end of that edge, such that the two edges are parallel to each other.
     However, to avoid disturbing many nodes, we only rotate the nodes with less than "state.nw.degree(1)im" connections.
   */
   int a1,a2,b1,b2,i,j,mindeg;
   int m=state.nw.edges.size();
   double force=0.0;
   Point tem1, tem2;
   for(i=0;i<m;i++)
      for(j=i+1;j<m;j++){                         
         if(!edge_cross(i,j))continue; //whether the two nodes crosses each other.
         //a1 and a2 are two ends of edge-i. b1 and b2 are two ends of edge-j.
         a1=state.nw.edges[i].from;
         a2=state.nw.edges[i].to;
         b1=state.nw.edges[j].from;
         b2=state.nw.edges[j].to;
         if(a1==b1)continue;
         if(a2==b2)continue;
         force+=1.0; //one crossing.
         mindeg=min_four(state.deg[a1],state.deg[a2],state.deg[b1],state.deg[b2]); //the node with minimum connections.
         if(mindeg>state.nw.degree(1)im)continue;
         if(mindeg==state.deg[a1]){ 
            //rotate a1 around a2, such that the two edges are parallel.
            tem1=state.nw.nodes[a2]+state.nw.nodes[b2]-state.nw.nodes[b1];
            tem2=state.nw.nodes[a2]+state.nw.nodes[b1]-state.nw.nodes[b2];
            if(dist(tem1,state.nw.nodes[a1])<dist(tem2,state.nw.nodes[a1]))state.nw.nodes[a1]=tem1;
            else state.nw.nodes[a1]=tem2;
         }
         else if(mindeg==state.deg[a2]){
            tem1=state.nw.nodes[a1]+state.nw.nodes[b2]-state.nw.nodes[b1];
            tem2=state.nw.nodes[a1]+state.nw.nodes[b1]-state.nw.nodes[b2];
            if(dist(tem1,state.nw.nodes[a2])<dist(tem2,state.nw.nodes[a2]))state.nw.nodes[a2]=tem1;
            else state.nw.nodes[a2]=tem2;
         }
         else if(mindeg==state.deg[b1]){
            tem1=state.nw.nodes[b2]+state.nw.nodes[a2]-state.nw.nodes[a1];
            tem2=state.nw.nodes[b2]+state.nw.nodes[a1]-state.nw.nodes[a2];
            if(dist(tem1,state.nw.nodes[b1])<dist(tem2,state.nw.nodes[b1]))state.nw.nodes[b1]=tem1;
            else state.nw.nodes[b1]=tem2;
         }
         else{
            tem1=state.nw.nodes[b1]+state.nw.nodes[a2]-state.nw.nodes[a1];
            tem2=state.nw.nodes[b1]+state.nw.nodes[a1]-state.nw.nodes[a2];
            if(dist(tem1,state.nw.nodes[b2])<dist(tem2,state.nw.nodes[b2]))state.nw.nodes[b2]=tem1;
            else state.nw.nodes[b2]=tem2;
         }
      }
   return force;
}      
   
void brute_force_post_pro(){
   /* This procedure brute-forcely removes the node overlapping.
      Fortunately, it is not implemented.
   */
   int n=state.nw.nodes.size(),n1,n2,k,comp1,comp2;
   double dx,dy;
   VI lnk;
   VP ps;
   Point tem;
   lnk.resize(n);
   ps.resize(n);
   for(n1=0;n1<n;n1++){
      ps[n1]=state.nw.nodes[n1];
      lnk[n1]=n1;
   }
   for(n1=0;n1<n;n1++)
      for(n2=n1+n1;n2<n;n2++)
         if(p_compare(ps[n1],ps[n2])<0){
            tem=ps[n1];ps[n1]=ps[n2];ps[n2]=tem;
            k=lnk[n1];lnk[n1]=lnk[n2];lnk[n2]=k;
         }
   for(n2=1;n2<n;n2++)
      for(n1=0;n1<n2;n1++){
          dx=state.nw.nodes[lnk[n1]].height+state.nw.nodes[lnk[n1]].height;
          dy=state.nw.nodes[lnk[n1]].width+state.nw.nodes[lnk[n1]].width;
          comp1=state.nw.nodes[lnk[n1]].compartment;
          comp2=state.nw.nodes[lnk[n2]].compartment;
          if(fabs(ps[n2].y-ps[n1].y)<0.51*dy && fabs(ps[n2].x-ps[n1].x)<0.51*dx){
             if(ps[n1].y+0.51*dy>state.nw.compartments[comp2].ymax){ //cannot move in y-direaction because of compartment rule.
                ps[n2].x=ps[n1].x+0.51*dx;
                continue;
             }
             if(ps[n2].y>ps[n1].y+zero)ps[n2].y=ps[n1].y+0.51*dy;
             else ps[n2].x=ps[n1].x+0.51*dx;
          }
      }
   for(n1=0;n1<n;n1++)state.nw.nodes[lnk[n1]]=ps[n1];
   lnk.clear();
   ps.clear();
}      
                           
double layout(){       
   /*This function contains the work-flow of the layout algorithm, which is comprised of 4 phase:
        initilization, free-layout, constrained-layout, and post-processing.
   */
   
   //copying coordinates from nodes[] to state.nw.nodes[];   
   int n=state.nw.nodes.size(),i;   
   int progcc=0; // counter for show_progress
   pos.resize(n);
   mov.resize(n);
   movadd.resize(n);
   rot.resize(n);
   mov_dir.resize(n);
   state.tension.resize(n);
   deg.resize(n);
   for(i=0;i<n;i++){
      state.nw.nodes[i].x=state.nw.nodes[i].x;
      state.nw.nodes[i].y=state.nw.nodes[i].y;
      state.mov[i].x=state.mov[i].y=0.0;
      state.rot[i]=state.nw.nodes[i].dir;
      mov_dir[i]=0.0;
      state.deg[i]=(state.nw.nodes[i].neighbors)->size();
      movadd[i]=0.0;
      state.tension[i]=false;
   }   
   bcomp.resize(state.nw.compartments.size());
   
   get_ideal_distance(); //the ideal lengths and minimum distances.

   progress_step=10;
   state.avgsize=avg_sizes();
   double cur_force,min_force,pre_force=inf;  //current system force, and previous system force.
   int k, inc;
 
   //phase 1. initialization
   //step1: a quick initial layout: generate the coordinates according to the edges.
   printf("init layout\n");    
   k=inc=0;
   while(true){
      k++;
      cur_force=init_layout();
      show_progress(progcc);
      printf("%f\r",cur_force);fflush(stdout);
      if(fabs(pre_force-cur_force)<pre_force*err)break; //the system force converges to a minimal.
      if (cur_force<stop) break; //absolute breaking condition
      pre_force=cur_force;
      if(fabs(pre_force)<zero)break;
   }
   printf("number of iteration: %d\n",k);    
   printf("Total force = %0.3f\n",cur_force);fflush(stdout);
   //step2: doing node-swapping to optimize the initial layout.
/*   bool flag=true;
   k=0;
   while(flag){
      flag=swap_node();
      if(k<10)near_swap();
      k++;
      if(k>n)break;
   }*/
   //step3: get the adjacent nodes located in correct relative positions.
//    k=inc=0;
//    pre_force=inf;
//    while(true){
//       k++;
//       cur_force=calc_force_adj();
//       printf("%f\n",cur_force);fflush(stdout);
//       if(k>300)cur_force+=firm_distribution();
//       move_nodes();
//       show_progress(progcc);
//       if(fabs(pre_force-cur_force)<pre_force*err)break;
//       if(cur_force>pre_force)inc++; //number of increases.
//       if(inc>log(1.0*n))break; //quit if number of increases if larger than log(n).
//       pre_force=cur_force;
//       if(fabs(pre_force)<zero)break;
//    }
//    printf("number of iteration: %d\n",k);    
//    printf("Total force = %0.3f\n",cur_force);

   //phase 2: considering the adjacent nodes and nonadjacent nodes. Make the layout spread out.
/*   k=inc=0;
   pre_force=inf;
   while(true){     
      k++;
      cur_force=0.0;
      if(300<k)cur_force+=firm_distribution(); //firmly ditribute edges about a compound;
      cur_force+=calc_force_adj();
      cur_force+=calc_force_nadj();
      printf("%f\n",cur_force);fflush(stdout);
      move_nodes();
      show_progress(progcc);
      if(fabs(pre_force-cur_force)<pre_force*err)break;
      if(cur_force>pre_force)inc++;
      if(inc>log(1.0*n))break;
      pre_force=cur_force;
      if(fabs(pre_force)<zero)break;
   }
   printf("number of iteration: %d\n",k);    
   printf("Total force = %0.3f\n",cur_force);*/
  
   //phase 3: constrained layout: bring in compartments into consideration, and re-layout the nodes such that they obeys compartment rule.
   progress_step=10;
   
   pre_force=inf;  // no compartments, no non-adjacent
   printf("no compartments, no non-adjacent\n");    
   k=inc=0;
   while(true){
      k++;
      cur_force=0.0;
      cur_force+=calc_force_adj();
      cur_force+=firm_distribution();
      cur_force=move_nodes(); // only use this force
      printf("%f\n",cur_force);fflush(stdout);     
      show_progress(progcc);
      //     if(fabs(pre_force-cur_force)<pre_force*err)break;
      if (cur_force!=cur_force) break; // check for nan
      if(cur_force>pre_force)inc++;
      if(inc>10*log(1.0*n))break;
      //      if(inc>log(1.0*n))break;
      if (cur_force<n*state.avgsize/50) break;
      if (k>300) break;
      pre_force=cur_force;
      //      if(fabs(pre_force)<zero)break;    
   }
   printf("number of iteration: %d\n",k);    
   printf("Total force = %0.3f\n",cur_force); 

   pre_force=inf;  // no compartments, non-adjacent
   k=inc=0;
   printf("no compartments, non-adjacent\n");    
   while(true){
      k++;
      cur_force=0.0;
      cur_force+=calc_force_adj();
      cur_force+=firm_distribution();
      cur_force+=calc_force_nadj();
      cur_force=move_nodes(); // only use this force
      printf("%f\n",cur_force);fflush(stdout);     
      show_progress(progcc);
      //     if(fabs(pre_force-cur_force)<pre_force*err)break;
      if(cur_force>pre_force)inc++;
      if(inc>10*log(1.0*n))break;
      //      if(inc>log(1.0*n))break;
      if (cur_force<n*state.avgsize/50) break;
      if (k>300) break;
      pre_force=cur_force;
      //      if(fabs(pre_force)<zero)break;    
   }
   printf("number of iteration: %d\n",k);    
   printf("Total force = %0.3f\n",cur_force); 

   init_compartments(); //step1: initilizing compartments using the coordinates generated from phase2.
   show_progress(progcc);
   
   pre_force=inf;  // compartments, no non-adjacent
   printf("compartments, no non-adjacent\n");    
   k=inc=0;
   while(true){
      k++;
      cur_force=0.0;
      cur_force+=adjust_compartments();
      cur_force+=calc_force_compartments();
      cur_force+=calc_force_adj();
      cur_force+=firm_distribution();
      //cur_force+=calc_force_nadj();
      cur_force=move_nodes(); // only use this force
      printf("%f\n",cur_force);fflush(stdout);     
      if (cur_force!=cur_force) break; // check for nan
      if (cur_force>=inf) break;
      
      show_progress(progcc);
 //     if(fabs(pre_force-cur_force)<pre_force*err)break;
      if(cur_force>pre_force)inc++;
      if(inc>10*log(1.0*n))break;
//      if(inc>log(1.0*n))break;
      if (cur_force<n*state.avgsize/50) break;
      if (k>300) break;
      pre_force=cur_force;
//      if(fabs(pre_force)<zero)break;    
   }
   printf("number of iteration: %d\n",k);    
   printf("Total force = %0.3f\n",cur_force); 

   show_progress(progcc);
   
/*   pre_force=inf;  // compartments, non-adjacent
   printf("compartments, non-adjacent\n");    
   k=inc=0;
   while(true){
      k++;
      cur_force=0.0;
      cur_force+=adjust_compartments();
      cur_force+=calc_force_compartments();
      cur_force+=calc_force_adj();
      cur_force+=firm_distribution();
      cur_force+=calc_force_nadj();
      cur_force=move_nodes(); // only use this force
      if (cur_force!=cur_force) break; // check for nan
         if (cur_force>=inf) break;
      
      printf("%f\n",cur_force);fflush(stdout);     
      show_progress(progcc);
      //     if(fabs(pre_force-cur_force)<pre_force*err)break;
      if(cur_force>pre_force)inc++;
      if(inc>10*log(1.0*n))break;
      //      if(inc>log(1.0*n))break;
      if (cur_force<n*state.avgsize/50) break;
      if (k>300) break;
      pre_force=cur_force;
      //      if(fabs(pre_force)<zero)break;    
   }
   printf("number of iteration: %d\n",k);    
   printf("Total force = %0.3f\n",cur_force); */
   //step2: compartment-constrained layout.
   pre_force=inf;
   min_force=inf;
   
   printf("separate nodes, compartments\n");    
   k=inc=0;
   while(true){
      k++;
      cur_force=0.0;
      cur_force+=calc_force_compartments();
      cur_force+=adjust_compartments(1);
//      cur_force+=calc_force_adj();
//      cur_force+=firm_distribution();
//      cur_force+=calc_force_nadj();
      cur_force+=calc_separate_nodes();
//      cur_force+=min_edge_crossing(1);
      cur_force=move_nodes();
      printf("%f\n",cur_force);fflush(stdout);
      show_progress(progcc);
//      if(fabs(pre_force-cur_force)<pre_force*err)break;
      if (cur_force!=cur_force) break; // check for nan
      if (cur_force>=inf) break;
      if (cur_force<100) break;
      if (k<100) continue;

      if(cur_force>pre_force)inc++;
      if(inc>10*log(1.0*n))break;
//      if(inc>log(1.0*n))break;
      pre_force=cur_force;
      if (min_force>cur_force) min_force=cur_force;
//      if(fabs(pre_force)<zero)break;    
      if (cur_force<n*state.avgsize/500) break;
//      if (cur_force>3*min_force) break;
      state.avgsize-=1.0;
   }
   printf("number of iteration: %d\n",k);    
   printf("Total force = %0.3f\n",cur_force); 
   
   //phase4: post processing. 
   
/*   post_pro_dist();//the post-processing distances: minimum distances between nodes with common neighbor are reduced.
   
   //step1: minimizing edge corssings.
   pre_force=inf;
   while(true){
      cur_force=min_edge_crossing(1);
      show_progress(progcc);
      if(cur_force>=pre_force)break;
      pre_force=cur_force;
      cout<<cur_force<<endl;
      if(fabs(pre_force)<zero)break;
   }
   //step2: shrinking edges lengths (nodes must still conform to compartment rule).
   pre_force=inf;
   k=inc=0;
   while(true){
      k++;
      near_swap();
      cur_force=post_pro(1); //shrink edge lengths.
      move_nodes();
      cur_force+=adjust_compartments();
      cur_force+=calc_force_compartments();
      move_nodes();
      show_progress(progcc);
      if(fabs(pre_force-cur_force)<pre_force*err)break;
      if(cur_force>pre_force||cur_force>=inf)inc++;
      if(inc>log(1.0*n))break;
      pre_force=cur_force;
      if(fabs(pre_force)<zero)break;
   }
   //step3: remove node-overlapping (nodes must still obey compartment rule).
   pre_force=inf;
   k=inc=0;
   while(true){
      k++;
      near_swap();
      cur_force=post_pro(2); //try to remove node-overlapping.
      move_nodes();
      cur_force+=adjust_compartments();
      cur_force+=calc_force_compartments();
      move_nodes();
      show_progress(progcc);
      if(fabs(pre_force-cur_force)<pre_force*err)break;
      if(cur_force>pre_force||cur_force>=inf)inc++;
      if(inc>log(1.0*n))break;
      pre_force=cur_force;
      if(fabs(pre_force)<zero)break;
   } 
   printf("number of iteration: %d\n",k);    
   printf("Total force = %0.3f\n",cur_force); 
 */  
  // brute_force_post_pro();
   
   //output compartment names and y-boundaries.
   cout<<endl;
   for(i=1;i<state.nw.compartments.size();i++){
      cout<<state.nw.compartments[i].name<<endl;
      printf("%0.3f %0.3f\n",state.nw.compartments[i].ymin, state.nw.compartments[i].ymax);
   }
   
   //copying coordinations from state.nw.nodes[] to nodes[];
   for(i=0;i<n;i++){
      state.nw.nodes[i].x=state.nw.nodes[i].x;
      state.nw.nodes[i].y=state.nw.nodes[i].y;
      state.nw.nodes[i].dir=mov_dir[i];
   }
   
   //memory realease. 
   pos.clear();
   mov.clear();
   dij1.clear();
   bcomp.clear();
   for(i=0;i<n;i++){
      dij2[i].clear();
      isadj[i].clear();
   }
   dij2.clear();
   isadj.clear();
   rot.clear();
   mov_dir.clear();
   deg.clear();
   free(above_comp);
   
   return cur_force;
}

void init_layout2(vector<bool>fixinit){
   /*
     initilization for layout_update: only initilize positions for un-fixed nodes.
     this is siliar to init_layout() method.
   */
   
   int n1,n2,i,e,cnt,n=state.nw.nodes.size(),type_n1,type_e;
   double force=0.0,x,y;
   VI neighbors;
   neighbors.clear();
   for(n1=0;n1<n;n1++){
      if(fixinit[n1])continue; //state.nw.nodes[n1] is already fixed.
      neighbors=*(state.nw.nodes[n1].neighbors);
      type_n1=state.nw.nodes[n1].type;
      cnt=neighbors.size();
      x=y=0.0;
      for(i=0;i<cnt;i++){
         e=neighbors[i];
         type_e=state.nw.edges[e].type;
         if(type_n1==reaction)n2=state.nw.edges[e].to;
         else n2=state.nw.edges[e].from;
         if(type_e==substrate){
            if(type_n1==reaction){
               x+=state.nw.nodes[n2].x;
               y+=(state.nw.nodes[n2].y-dij1[e]);
            }
            else{
               x+=state.nw.nodes[n2].x;
               y+=(state.nw.nodes[n2].y+dij1[e]);
            }
         }
         else if(type_e==product){
            if(type_n1==reaction){
               x+=state.nw.nodes[n2].x;
               y+=(state.nw.nodes[n2].y+dij1[e]);
            }
            else{
               x+=state.nw.nodes[n2].x;
               y+=(state.nw.nodes[n2].y-dij1[e]);
            }
         }
         else{
            y+=(state.nw.nodes[n2].y);
            if(fabs(state.nw.nodes[n2].x-dij1[e]-x/(i+1))<fabs(state.nw.nodes[n2].x+dij1[e]-x/(i+1)))x+=(state.nw.nodes[n2].x-dij1[e]);
            else x+=(state.nw.nodes[n2].x+dij1[e]);
         }
         neighbors.clear();
      }
      state.nw.nodes[n1].x=x/cnt;
      state.nw.nodes[n1].y=y/cnt;
   }
}

double layout_update(vector<bool>fixinit){      
   /*This function update the layout if some new nodes are added or some nodes are required to change.
     The vector fixinit contains the information of whether a node's position has been fixed.
     This is similar to the layout() function, except that the second phase(free layout) is deleted.
   */ 
   
   //copying coordinates from nodes[] to state.nw.nodes[];   
   int n=state.nw.nodes.size(),i;   
   pos.resize(n);
   mov.resize(n);
   rot.resize(n);
   mov_dir.resize(n);
   deg.resize(n);
   for(i=0;i<n;i++){
      state.nw.nodes[i].x=state.nw.nodes[i].x;
      state.nw.nodes[i].y=state.nw.nodes[i].y;
      state.mov[i].x=state.mov[i].y=0.0;
      state.rot[i]=state.nw.nodes[i].dir;
      mov_dir[i]=0.0;
      state.deg[i]=(state.nw.nodes[i].neighbors)->size();
   }   
   bcomp.resize(state.nw.compartments.size());
   
   get_ideal_distance(); //the ideal lengths and minimum distances.

   double cur_force,pre_force=inf;  //current system force, and previous system force.
   int k, inc;
 
   //phase 1. initialization
   
   //step1: quick initial layout.
   init_layout2(fixinit);
   
   //step2&3 are skipped.
   //phase2 is skiped.
   
   //phase 3: constrained layout: bring in compartments into consideration, and re-layout the nodes such that they obeys compartment rule.
   
   init_compartments(); //step1: initilizing compartments using the coordinates generated from phase2.
   
   //step2: compartment-constrained layout.
   pre_force=inf;
   k=inc=0;
   while(true){
      k++;
      cur_force=0.0;
      cur_force+=adjust_compartments();
      cur_force+=calc_force_compartments();
      cur_force+=calc_force_adj();
      cur_force+=calc_force_nadj();
      move_nodes();
      if(fabs(pre_force-cur_force)<pre_force*err)break;
      if(cur_force>pre_force)inc++;
      if(inc>log(1.0*n))break;
      pre_force=cur_force;    
   }
   printf("number of iteration: %d\n",k);    
   printf("Total force = %0.3f\n",cur_force); 
   
   //phase4: post processing. 
   
   post_pro_dist();//the post-processing distances: minimum distances between nodes with common neighbor are reduced.
   
   //step1: minimizing edge corssings.
   pre_force=inf;
   while(true){
      cur_force=min_edge_crossing(1);
      if(cur_force>=pre_force)break;
      pre_force=cur_force;
      cout<<cur_force<<endl;
   }
   //step2: shrinking edges lengths (nodes must still conform to compartment rule).
   pre_force=inf;
   k=inc=0;
   while(true){
      k++;
      near_swap();
      cur_force=post_pro(1); //shrink edge lengths.
      move_nodes();
      cur_force+=adjust_compartments();
      cur_force+=calc_force_compartments();
      move_nodes();
      if(fabs(pre_force-cur_force)<pre_force*err)break;
      if(cur_force>pre_force||cur_force>=inf)inc++;
      if(inc>log(1.0*n))break;
      pre_force=cur_force;
   }
   //step3: remove node-overlapping (nodes must still obey compartment rule).
   pre_force=inf;
   k=inc=0;
   while(true){
      k++;
      near_swap();
      cur_force=post_pro(2); //try to remove node-overlapping.
      move_nodes();
      cur_force+=adjust_compartments();
      cur_force+=calc_force_compartments();
      move_nodes();
      if(fabs(pre_force-cur_force)<pre_force*err)break;
      if(cur_force>pre_force||cur_force>=inf)inc++;
      if(inc>log(1.0*n))break;
      pre_force=cur_force;
   } 
   printf("number of iteration: %d\n",k);    
   printf("Total force = %0.3f\n",cur_force); 
   
  // brute_force_post_pro();
   
   //output compartment names and y-boundaries.
   cout<<endl;
   for(i=1;i<state.nw.compartments.size();i++){
      cout<<state.nw.compartments[i].name<<endl;
      printf("%0.3f %0.3f\n",state.nw.compartments[i].ymin, state.nw.compartments[i].ymax);
   }
   
   //copying coordinations from state.nw.nodes[] to nodes[];
   for(i=0;i<n;i++){
      state.nw.nodes[i].x=state.nw.nodes[i].x;
      state.nw.nodes[i].y=state.nw.nodes[i].y;
      state.nw.nodes[i].dir=mov_dir[i];
   }
   
   //memory realease. 
   pos.clear();
   mov.clear();
   dij1.clear();
   bcomp.clear();
   for(i=0;i<n;i++){
      dij2[i].clear();
      isadj[i].clear();
   }
   dij2.clear();
   isadj.clear();
   rot.clear();
   mov_dir.clear();
   deg.clear();
   free(above_comp);
   
   return cur_force;
}
void test_firm_dist(){
   int n=state.nw.nodes.size();   
   int i;
   pos.resize(n);
   mov.resize(n);
   movadd.resize(n);
   rot.resize(n);
   mov_dir.resize(n);
   state.tension.resize(n);
   deg.resize(n);
   for(i=0;i<n;i++){
      state.nw.nodes[i].x=state.nw.nodes[i].x;
      state.nw.nodes[i].y=state.nw.nodes[i].y;
      state.mov[i].x=state.mov[i].y=0.0;
      state.rot[i]=state.nw.nodes[i].dir;
      mov_dir[i]=0.0;
      state.deg[i]=(state.nw.nodes[i].neighbors)->size();
      movadd[i]=0.0;
      state.tension[i]=false;
   }   
   bcomp.resize(state.nw.compartments.size());
   
   get_ideal_distance(); //the ideal lengths and minimum distances.
   state.avgsize=avg_sizes();
   int progcc=0;
   progress_step=1;
   double force;
   for (i=0;i<100;i++){
      force=firm_distribution();
      force=move_nodes();
      show_progress(progcc);
   }
}
bool edge_cross(layout_state &state, int i, int j){ 
   /* whether edge-i and edge-j cross each other.
   a1,a2 are two ends of edge-i, and b1,b2 are two ends of edge-j.
   edge-i and edge-j cross each other only if: 
   1. a1 and a2 are on different sides of b1, which can be judged using vector-products.
   2. a1 and a2 are on different sides of b2.
   */
   int a1,a2,b1,b2;
   a1=state.nw.edges[i].from;
   a2=state.nw.edges[i].to;
   b1=state.nw.edges[j].from;
   b2=state.nw.edges[j].to;
   if((state.pos[a1]-state.pos[b1])*(state.pos[a2]-state.pos[b1])<0 && (state.pos[a1]-state.pos[b2])*(state.pos[a2]-state.pos[b2])<0)return true;
   return false;
}

     #endif
     
