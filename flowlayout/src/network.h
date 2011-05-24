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
   void addNode(int index,Nodetype type); //add in a Node with specified index and type.     
   void addReaction(int index, const VI* substrates, const VI* products, const VI* catalysts, const VI* activators, const VI* inhibitors);   
   VI* getNeighbors(int nodeIndex, Edgetype type); //get the neigbors of a node.
   
   double layout();
   
protected:
   VP a,b;
   VI *neighbors;
   
   double get_dij(int i, int j); //the ideal distance between node-i and node-j;
   double get_dis(int i, int j); //the distance betwen node-i and node-j;
   double calc_force(); //calculating the force of the system;
   double get_new_pos(); //calculating pos(t+1) according to pos(t);
         
};
   
#endif
