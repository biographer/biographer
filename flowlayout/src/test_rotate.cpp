#include "network.h"
#include "netdisplay.h"
#include "layout.h"
#include "plugins.h"
#include <stdio.h>
int main(int argc,char *argv[]){
   Network nw=Network();
   nw.addCompartment(0,"unknown");
   nw.addNode(0, reaction , "R1", 100 , 100 , -00, -00 , 00,00);     
   nw.addNode(1, compound , "c1", 100 , 100 , -300, -00 , 00,00);     
   nw.addNode(2, compound , "c2", 100 , 100 , -300, -300 , 00,00);     
   nw.addNode(3, reaction , "R2", 100 , 100 , -00, -00 , 00,00);     
   nw.addNode(4, compound , "c3", 100 , 100 , -300, -300 , 00,00);     
   nw.addNode(5, reaction , "R3", 100 , 100 , -00, -00 , 00,00);     
   nw.addNode(6, compound , "c4", 100 , 100 , -300, -300 , 00,00);     
   nw.addNode(7, reaction , "R4", 100 , 100 , -00, -00 , 00,00);     
   nw.addNode(8, compound , "c5", 100 , 100 , -300, -300 , 00,00);     
   nw.addEdge(0,1,substrate);
   nw.addEdge(0,2,product);
   nw.addEdge(3,2,substrate);
   nw.addEdge(3,4,product);
   nw.addEdge(5,2,substrate);
   nw.addEdge(5,6,product);
   nw.addEdge(7,4,substrate);
   nw.addEdge(7,6,substrate);
   nw.addEdge(7,8,product);
   
   nw.dump();
   Plugins& pgs=register_plugins();
   Layouter l(nw,pgs);
   l.stepAddPlugins(0,P_force_adj,  P_torque_adj, P_distribute_edges);
   l.stepAddEndCondition(0,C_maxMovLimit,0.0005);

   l.stepAddPlugins(1,P_rotate);
   l.stepAddEndCondition(1,C_iterations,1);
   l.execute();
   printf("finished. [press key]\n");
   getc(stdin);
   return 0;
}
 