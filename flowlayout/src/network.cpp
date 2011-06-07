#include "network.h"

Network::Network(){
   nodes = new VN(); nodes->clear();
   edges = new VE(); edges->clear();
   compartments = new VCP(); compartments->clear();
}

Network::~Network(){
   int i,n=nodes->size();
   for(i=0;i<n;i++)(*nodes)[i].neighbors->clear();
   nodes->clear();
   edges->clear();
   compartments->clear();
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

VI * Network::getNeighbors(int nodeIndex){
   VI *arr=new VI();
   arr->clear();
   int i,n=(*nodes)[nodeIndex].neighbors->size();
   for(i=0;i<n;i++)
      arr->push_back((*edges)[(*(*nodes)[nodeIndex].neighbors)[i]].to);
   return arr;
}

int * Network::getNeighbors_arr(int nodeIndex){
   int i,n=(*nodes)[nodeIndex].neighbors->size();
   int *arr=(int *)malloc(sizeof(int)*n);
   for(i=0;i<n;i++)
      arr[i]=((*edges)[(*(*nodes)[nodeIndex].neighbors)[i]].to);
   return arr;
}

void Network::addEdge(int from, int to , Edgetype type){
   edges->push_back(Edge(from, to, type));
   int index=edges->size()-1;
   (*nodes)[from].neighbors->push_back(index);
   (*nodes)[to].neighbors->push_back(index);
}

void Network::addNode(int index, Nodetype type){
   if(index>=nodes->size())nodes->resize(index+1);
   (*nodes)[index]=Node(type);
}

void Network::addNode(int index, Nodetype _type, string _name, float _width, float _height, float _x, float _y, float _dir){
   if(index>=nodes->size())nodes->resize(index+1);
   (*nodes)[index]=Node(_type, _name, _width, _height, _x, _y, _dir);
}

void Network::addReaction(int index, const VI* substrates,const VI* products, const VI* catalysts, const VI* activators, const VI* inhibitors){
   int i,n;
   addNode(index, reaction);
   n=substrates->size();
   for(i=0;i<n;i++){
      addNode((*substrates)[i],compound);
      addEdge(index,(*substrates)[i],substrate);
   }
   n=products->size();
   for(i=0;i<n;i++){
      addNode((*products)[i],compound);
      addEdge(index, (*products)[i],product);
   }
   n=catalysts->size();
   for(i=0;i<n;i++){
      addNode((*catalysts)[i],compound);
      addEdge(index, (*catalysts)[i], catalyst);
   }
   n=activators->size();
   for(i=0;i<n;i++){
      addNode((*activators)[i],compound);
      addEdge(index, (*activators)[i], activator);
   }
   n=inhibitors->size();
   for(i=0;i<n;i++){
      addNode((*inhibitors)[i],compound);
      addEdge(index, (*inhibitors)[i], inhibitor);
   }
}
  
