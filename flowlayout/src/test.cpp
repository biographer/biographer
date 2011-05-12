#include "headers.h"
#include "network.h"

int main(){
  int i,j,k,x,y;
  Network nw=Network();
  vector<int>subs;subs.clear();
  vector<int>prod;prod.clear();
  vector<int>inhi;inhi.clear();
  vector<int>cat;cat.clear();
  vector<int>act;act.clear();
  subs.push_back(2);subs.push_back(3);
  prod.push_back(8);prod.push_back(9); 
  cat.push_back(3);
  inhi.push_back(6);
  act.push_back(4);
  nw.addReaction(0,&subs,&prod,&cat,&act,&inhi);
  VI* a = nw.getNeighbors(0,catalyst);
  cout<<nw.nodes->size()<<endl;
  cout<<nw.edges->size()<<endl;
  for(i=0;i<a->size();i++)cout<<(*a)[i]<<' ';
  cout<<endl;
  free(a);
  system("pause");
  
  return 0;
}
  
