#include "network.h"

int main(int argc,char *argv[]){
   clock_t start_time, end_time;
   start_time=clock();
   Network nw=Network();
   nw.addCompartment(0,"unknown");
   nw.addNode(00, compound , "c1", 100 , 100 , 00, 00 , 00,00);     
   nw.addNode(1, compound , "c2", 100 , 100 , 300, 00 , 00,00);     
   nw.addNode(2, compound , "c3", 100 , 100 , 300, 300 , 00,00);     
   nw.addEdge(0,1,undirected);
   nw.addEdge(2,1,undirected);
   nw.showProgress=true;
   nw.dump();
   nw.test_firm_dist();
   return 0;
}
 