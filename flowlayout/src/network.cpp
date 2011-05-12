#include "network.h"

Network::Network(){
   nodes = new VN();
   edges = new VE();
}

Network::~Network(){
   int i,n=nodes->size();
   for(i=0;i<n;i++)(*nodes)[i].neighbors->clear();
   nodes->clear();
   edges->clear();
   delete nodes;
   delete edges;
}

VI * Network::getNeighbors(int nodeIndex, Edgetype type){
   VI *arr=new VI();
   arr->clear();
   int i,n=(*nodes)[nodeIndex].neighbors->size();
   for(i=0;i<n;i++)
      if((*edges)[(*(*nodes)[nodeIndex].neighbors)[i]].pts.type==type)
         arr->push_back((*edges)[(*(*nodes)[nodeIndex].neighbors)[i]].to);
   return arr;
}

void Network::addEdge(int from, int to , Edgetype type){
   edges->push_back(Edge(from, to, type));
   int index=edges->size()-1;
   (*nodes)[from].neighbors->push_back(index);
   (*nodes)[to].neighbors->push_back(index);
}

void Network::upto(int _size, Nodetype _type){
   int n=nodes->size();
   for(int i=n;i<_size;i++)nodes->push_back(Node(_type));
}

void Network::addReaction(int index, const VI* substrates,const VI* products, const VI* catalysts, const VI* activators, const VI* inhibitors){
   int i,n;
   if(index>=nodes->size())upto(index,none);
   upto(index+1,reaction);
   n=substrates->size();
   for(i=0;i<n;i++){
      if((*substrates)[i]>=nodes->size())upto((*substrates)[i],none);
      upto((*substrates)[i]+1,compound);
      addEdge(index,(*substrates)[i],substrate);
   }
   n=products->size();
   for(i=0;i<n;i++){
      if((*products)[i]>=nodes->size())upto((*products)[i],none);
      upto((*products)[i]+1,compound);
      addEdge(index, (*products)[i],product);
   }
   n=catalysts->size();
   for(i=0;i<n;i++){
      if((*catalysts)[i]>=nodes->size())upto((*catalysts)[i],none);
      upto((*catalysts)[i]+1,compound);
      addEdge(index, (*catalysts)[i], catalyst);
   }
   n=activators->size();
   for(i=0;i<n;i++){
      if((*activators)[i]>=nodes->size())upto((*activators)[i],none);
      upto((*activators)[i]+1,compound);
      addEdge(index, (*activators)[i], activator);
   }
   n=inhibitors->size();
   for(i=0;i<n;i++){
      if((*inhibitors)[i]>=nodes->size())upto((*inhibitors)[i],none);
      upto((*inhibitors)[i]+1,compound);
      addEdge(index, (*inhibitors)[i], inhibitor);
   }
}
  
