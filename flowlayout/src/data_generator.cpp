#include "headers.h"
#include "network.h"

int main(){
    FILE *fout=fopen("data.txt","w");
    int R,Q,n; //number of reactions, queries, total number of nodes;
    bool isreaction [1000]; //whether a node is a reaction.
    memset(isreaction,false,sizeof(isreaction));
    while(true){
       printf("Input three integers: R, Q n. Number of reactions, queries, and total number of nodes. Make sure R<n/2\n");
       scanf("%d%d%d",&R,&Q,&n);
       if(R<n/2)break;
       else printf("R should be less than n/2");
    }
    
    fprintf(fout,"%d %d\n\n",R,Q);
    
    int x,y,k,index,m=20;
    if (m>n/2)m=n/2;
    srand(time(0));
    for(int tr=1;tr<=R;tr++){
       fprintf(fout,"Reaction #%d:\n",tr);
       while(true){
          index=rand()%n;
          if(!isreaction[index]){
            isreaction[index]=true;
            break;
          }
       }
       fprintf(fout,"%d\n",index);
       for(int i=0;i<5;i++){
          k=rand()%m;
          fprintf(fout,"%d: ",k);
          while(k--){
             while(true){
                x=rand()%n;
                if(!isreaction[x])break;
              }
            fprintf(fout,"%d ",x);
          }
          fprintf(fout,"\n");
       }
       fprintf(fout,"\n");
    }
   fprintf(fout,"\n\n");
   for(int tq=1;tq<=Q;tq++){
      //fprintf(fout, "Query #%d:  ",tq);
      while(true){
         x=rand()%n;
         if(isreaction[x])break;
      }
      y=rand()%5;
      fprintf(fout, "%d %d\n",x,y);
   }
   return 0;
}
   
                 
       
       
      
      
      
      
    
