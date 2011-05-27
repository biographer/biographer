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
   VCP * compartments;
     
   void addEdge(int from, int to, Edgetype type); //add in an edge "from"-->"to" of type "type".
   void addNode(int index, Nodetype type); //add in a Node with specified index and type.   
   void addNode(int index, Nodetype _type, string _name, float _width, float _height, float _x, float _y, float _dir); //add in a Node with explict information  
   void addReaction(int index, const VI* substrates, const VI* products, const VI* catalysts, const VI* activators, const VI* inhibitors);   
   VI* getNeighbors(int nodeIndex, Edgetype type); //get the compounds of a specified type of a reaction
   VI* getNeighbors(int nodeInxex);  //get the reactions associated with a compound.
   
   float layout();
   
protected:
   VP pos, mov;
   
   float get_dij1(int i, int j); //the ideal distance between adjacent nodes;
   float get_dij2(int i, int j); //the minimum distance between non-adjacent nodes;
   float calc_force_adj(); //calculating the force resulted from edges;
   float calc_force_nadj(); //calculating the force resulted from non-adjacent nodes;
   void move_nodes(); //move the nodes to a new position.
         
};
   
#endif
