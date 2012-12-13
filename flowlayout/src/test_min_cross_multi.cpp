#include "network.h"
#include "netdisplay.h"
#include "layout.h"
#include "plugins.h"
#include <stdio.h>
int main(int argc,char *argv[]){
   Network nw=Network();
   nw.addCompartment(0,"unknown");
   nw.addNode(0, reaction , "c0", 100 , 100 , 00, 150 , 00,00);     
   nw.addNode(1, compound , "c1", 100 , 100 , 300, 300 , 00,00);     
   nw.addNode(2, compound , "c2", 100 , 100 , 300, 000 , 00,00);     
   nw.addNode(3, compound , "c3", 100 , 100 , 600, 300 , 00,00);     
   nw.addNode(4, compound , "c4", 100 , 100 , 600, 00 , 00,00);     
   nw.addEdge(1,2,directed);
   nw.addEdge(0,3,directed);
   nw.addEdge(0,4,directed);
   nw.dump();
   Plugins& pgs=register_plugins();
   Layouter l(nw,pgs);
   l.stepAddPlugins(0,P_force_adj, P_min_edge_crossing_multi);
   l.stepAddEndCondition(0,C_maxMovLimit,0.05);
   l.stepAddEndCondition(0,C_totForceInc,3);
   l.execute();
   printf("finished. [press key]\n");
   getc(stdin);
   return 0;
}
 