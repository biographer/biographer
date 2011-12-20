#include "network.h"
#include "netdisplay.h"
#include "layout.h"
#include "plugins.h"
#include <stdio.h>
int main(int argc,char *argv[]){
   Network nw=Network();
   nw.addCompartment(0,"unknown");
   nw.addCompartment(1,"ex");
   nw.addCompartment(2,"pm");
   nw.addCompartment(3,"cy");
   nw.addNode(0, reaction , "R", 100 , 100 , 00, 00 ,0,2);     
   nw.addNode(1, compound , "c1", 100 , 100 , 300, 00 , 00,1);     
   nw.addNode(2, compound , "c2", 100 , 100 , 300, 300 , 00,1);     
   nw.addNode(3, compound , "c3", 100 , 100 , 00, 300 , 00,2);     
   nw.addNode(4, compound , "c4", 100 , 100 , 200, 300 , 00,2);     
   nw.addNode(5, compound , "c5", 100 , 100 , 400, 300 , 00,3);     
   nw.addEdge(0,1,substrate);
   nw.addEdge(0,2,substrate);
   nw.addEdge(0,3,product);
   nw.addEdge(0,4,inhibitor);
   nw.addEdge(0,5,catalyst);
   nw.dump();
   Plugins& pgs=register_plugins();
   Layouter l(nw,pgs);
   l.stepAddPlugins(0,P_force_adj,  P_torque_adj, P_distribute_edges, P_adjust_compartments, P_force_compartments);
   l.stepAddEndCondition(0,C_relForceDiff,0.0005);
   l.stepAddEndCondition(0,C_temp,10);
   l.stepAddPlugins(1,P_fix_compartments);
   l.stepAddEndCondition(1,C_iterations,1);
   l.stepAddPlugins(2,P_force_adj,  P_torque_adj,P_force_nadj, P_distribute_edges, P_adjust_compartments_fixed, P_force_compartments);
   l.stepAddEndCondition(2,C_relForceDiff,0.0005);
   l.stepAddEndCondition(2,C_temp,10);
   l.execute();
   printf("finished. [press key]\n");
   getc(stdin);
   return 0;
}
 