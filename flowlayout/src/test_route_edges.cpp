#include "network.h"
#include "netdisplay.h"
#include "layout.h"
#include "plugins.h"
#include <stdio.h>
int main(int argc,char *argv[]){
   Network nw=Network();
   nw.addCompartment(0,"unknown");
   nw.addNode(0, reaction , "R", 100 , 100 , 00, 00 , 00,00);     
   nw.addNode(1, compound , "c1", 100 , 100 , 300, 00 , 00,00);     
   nw.addNode(2, compound , "c2", 100 , 100 , 300, 300 , 00,00);     
   nw.addNode(3, compound , "c3", 100 , 100 , 00, 300 , 00,00);     
   nw.addNode(4, compound , "c4", 100 , 100 , 200, 300 , 00,00);     
   nw.addNode(5, compound , "c5", 100 , 100 , 400, 300 , 00,00);     
   nw.addEdge(0,1,substrate);
   nw.addEdge(0,2,substrate);
   nw.addEdge(0,3,product);
   nw.addEdge(0,4,inhibitor);
   nw.addEdge(0,5,catalyst);
   nw.addEdge(1,5,undirected);
   nw.dump();
   Plugins& pgs=register_plugins();
   Layouter l(nw,pgs);
   l.stepAddPlugins(0,P_force_adj,  P_torque_adj, P_distribute_edges,P_force_nadj);
   l.stepAddEndCondition(0,C_relForceDiff,0.05);
   l.stepAddPlugins(1,P_route_edges);
   l.stepAddEndCondition(1,C_iterations,1);
   l.execute();
   l.show_network();
   l.show_network(true);
   printf("finished. [press key]\n");
   getc(stdin);
   return 0;
}
 