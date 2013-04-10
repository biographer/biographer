#include "network.h"
#include "netdisplay.h"
#include "layout.h"
#include "plugins.h"
#include <stdio.h>
int main(int argc,char *argv[]){
   Network nw=Network();
   nw.addCompartment(0,"unknown");
   nw.addNode(0, reaction , "R1", 100 , 100 , 00, 00 , 00,00);     
   nw.addNode(1, compound , "c1", 100 , 100 , 300, 00 , 00,00);     
   nw.addNode(2, compound , "c2", 100 , 100 , 300, 300 , 00,00);     
   nw.addNode(3, compound , "c3", 100 , 100 , 00, 300 , 00,00);     
   nw.addNode(4, compound , "c4", 100 , 100 , 200, 300 , 00,00);     
   nw.addNode(5, compound , "c5", 100 , 100 , 400, 300 , 00,00);     
   nw.addNode(6, reaction , "R2", 100 , 100 , 300, -300 , 00,00);     
   nw.addNode(7, compound , "c6", 100 , 100 , 500, -300 , 00,00);     
   nw.addNode(8, compound , "c7", 100 , 100 , 500, 00 , 00,00);     
   nw.addNode(9, compound , "c8", 100 , 100 , 500, 200 , 00,00);     
   nw.addNode(10, compound , "c9", 100 , 100 , 300, 200 , 00,00);     
   
   nw.addEdge(0,1,substrate);
   nw.addEdge(0,2,substrate);
   nw.addEdge(0,3,product);
   nw.addEdge(0,4,inhibitor);
   nw.addEdge(0,5,catalyst);
   nw.addEdge(6,1,product);
   nw.addEdge(6,7,substrate);
   
   nw.addEdge(8,9,directed);
   nw.addEdge(9,10,directed);
   
   nw.dump();
   Plugins& pgs=register_plugins();
   Layouter l(nw,pgs);
   l.stepAddPlugins(0,P_force_adj,  P_torque_adj, P_distribute_edges, P_force_nadj, P_limit_mov);
   l.stepAddEndCondition(0,C_relForceDiff,0.0005);
   l.execute();
   printf("finished. [press key]\n");
   getc(stdin);
   return 0;
}
 