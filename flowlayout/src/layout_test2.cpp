#include "network.h"

int main(int argc,char *argv[]){
   int i
   clock_t start_time, end_time;
   start_time=clock();
//    freopen("data2.txt","r",stdin);
//    freopen("summary.txt","w",stdout);
   Network nw=Network();
   if (argc>=2){
      nw.read(argv[1]);
   } else {
      nw.read("data2.txt");
   }   
   double _force=nw.layout();
   end_time=clock();
   double dif=difftime(end_time,start_time);
   printf("time used: %0.3lf seconds\n\n",dif/1000);
   if (argc>=3){
      nw.dumpNodes(argv[2]);
   } else {
      nw.dumpNodes("summary.txt");
   }
   return 0;
}
