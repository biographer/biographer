#ifndef th_network_h
#define th_network_h
#include "edge.h"
#include "node.h"
#include "headers.h"

class Network{
public:
   Network();
   ~Network();
   
   VN * nodes;
   VE * edges;
     
   void addEdge(int from, int to, Edgetype type); //add in an edge "from"-->"to" of type "type".
   void upto(int _size, Nodetype _type); //add in nodes, such that the number of nodes in the network reaches _size;      
   void addReaction(int index, const VI* substrates, const VI* products, const VI* catalysts, const VI* activators, const VI* inhibitors);   
   VI* getNeighbors(int nodeIndex, Edgetype type); //get the neigbors of a node.
   
      
};
   
#endif
