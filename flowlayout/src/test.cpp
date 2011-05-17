#include "headers.h"
#include "network.h"

int main(){
  int i,j,k,x,y,R,Q;
  int index;
  char s[20];
  char names[][20]={"substrate", "product", "catalyst", "activator", "inhibitor"};
  Network nw=Network();
  vector<int>subs;
  vector<int>prod;
  vector<int>cat;
  vector<int>act;
  vector<int>inhi;
  freopen("data.txt","r",stdin);
  freopen("summary.txt","w",stdout);
  scanf("%d%d",&R,&Q);
  while(R--){
     gets(s);
     gets(s);
     gets(s);
     scanf("%d",&index);
     scanf("%d:",&k);
     subs.clear();
     while(k--){
       scanf("%d",&x);
       subs.push_back(x);
     }
     scanf("%d:",&k);
     prod.clear();
     while(k--){
       scanf("%d",&x);
       prod.push_back(x);
     }
     scanf("%d:",&k);
     cat.clear();
     while(k--){
       scanf("%d",&x);
       cat.push_back(x);
     }
     scanf("%d:",&k);
     act.clear();
     while(k--){
       scanf("%d",&x);
       act.push_back(x);
     }
     scanf("%d:",&k);
     inhi.clear();
     while(k--){
       scanf("%d",&x);
       inhi.push_back(x);
     }      
     nw.addReaction(index,&subs,&prod,&cat,&act,&inhi);
  }
  VI *a;
  while(Q--){
     scanf("%d%d",&x,&y);
     printf("Reaction #%d, %s\n",x,names[y]);
     a=nw.getNeighbors(x,(Edgetype)(y+2));
     for(i=0;i<a->size();i++)printf("%d ",(*a)[i]);
     printf("\n\n");
     a->clear();
     free(a);
  }                          
  return 0;
}
  
