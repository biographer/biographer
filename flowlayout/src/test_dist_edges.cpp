#include "network.h"
#include "netdisplay.h"
#include "layout.h"
#include "plugins.h"
#include <stdio.h>
int main(int argc,char *argv[]){
   Network nw=Network();
   nw.addCompartment(0,"unknown");
   nw.addNode(00, compound , "c1", 100 , 100 , 00, 00 , 00,00);     
   nw.addNode(1, compound , "c2", 100 , 100 , 300, 00 , 00,00);     
   nw.addNode(2, compound , "c3", 100 , 100 , 300, 300 , 00,00);     
   nw.addEdge(0,1,undirected);
   nw.addEdge(2,1,undirected);
   nw.dump();
   Plugins& pgs=register_plugins();
   Layouter l(nw,pgs);
   l.stepAddPlugins(0,P_distribute_edges);
   l.stepAddEndCondition(0,C_relForceDiff,0.005);
   l.execute();
   nw.addNode(3, compound , "c4", 100 , 100 , 00, 300 , 00,00);     
   nw.addNode(4, compound , "c5", 100 , 100 , 200, 300 , 00,00);     
   nw.addNode(5, compound , "c6", 100 , 100 , 400, 300 , 00,00);     
   nw.addEdge(3,1,undirected);
   nw.addEdge(3,4,undirected);
   nw.addEdge(3,5,undirected);
   l.execute();
   printf("finished. [press key]\n");
   getc(stdin);
   return 0;
}
 