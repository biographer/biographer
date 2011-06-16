#include "headers.h"
#include "network.h"
   int rea[1000],comp[1000];
   int nr,nc;
int main(){
   printf("input three integers cn n m : number of compartments, nodes and edges\n");
   freopen("data.txt","w",stdout);
   int cn,n,m;
   int i,j,k,x,y,lnk;
   char t_edge[][10]={"Substrate", "Product", "Catalyst", "Activator", "Inhibitor"};
   srand(time(0));
   scanf("%d",&cn);
   printf("%d\n",cn);
   for(i=0;i<cn;i++)
      printf("%d Compartment-%d\n",i,i);
   printf("///\n");
   scanf("%d",&n);
   printf("%d\n",n);
   nr=nc=0;
   for(i=0;i<n;i++){
      printf("%d\n",i);
      lnk=rand()%10;
      if(lnk==0)lnk=0;
      else if(lnk<7)lnk=1;
      else lnk=2;
      if(lnk==0)printf("Other\nNodes-%d\n",i);
      else if(lnk==1)printf("Compound\nCompound-%d\n",i);
      else printf("Reaction\nReaction-%d\n",i);
      if(lnk==1)comp[nc++]=i;
      else if(lnk==2)rea[nr++]=i;
      printf("%d\n",rand()%cn);
      printf("%0.2f\n",0.0+rand()%3);
      printf("%0.2f\n",0.0+rand()%3);
      printf("%0.2f\n",1.0+rand()%5);
      printf("%0.2f\n",1.0+rand()%5);
      printf("0.00\n");
   }
   scanf("%d",&m);
   printf("///\n");
   printf("%d\n",m);
   while(m--){
      lnk=rand()%5;
      x=rand()%nr;
      y=rand()%nc;
      printf("%s %d %d\n",t_edge[lnk],rea[x],comp[y]);
   }
   return 0;
}
   
                 
       
       
      
      
      
      
    
