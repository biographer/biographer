#include "network.h"
#include "reactionlayout.cpp"

int main(int argc,char *argv[]){
   clock_t start_time, end_time;
   start_time=clock();
   //freopen("newdata.txt","r",stdin);
   //freopen("summary.txt","w",stdout);
   Network nw=Network();
   int shiftcmd=0;
   bool showProgress=false;
   if (!strcmp(argv[1],"-p")){ // parameter for showing progress
      shiftcmd++;
      showProgress=true;
   }
   if (argc>=2+shiftcmd){
      nw.read(argv[1+shiftcmd]);
   } else {
      nw.read();
   }   
   nw.dump();
   Plugins& pgs=register_plugins();
   Layouter l(nw,pgs);
   if (showProgress) l.show_progress=true;
   l.progress_step=10;
   reactionlayout(l);
   end_time=clock();
   double dif=difftime(end_time,start_time);
   printf("time used: %0.3lf seconds\n\n",dif/1000);
   if (argc>=3+shiftcmd){
      nw.dumpNodes(argv[2+shiftcmd]);
   } else {
      nw.dumpNodes("summary.txt");
      nw.dumpNodes((char*) 0 );
   }
   return 0;
}
