#ifndef th_network_h
#define th_network_h
#include "types.h"

#ifdef USEJSON 
#include <stdlib.h>
#include <glib-object.h>
#include <json-glib/json-glib.h>

class JSONcontext{
   public: 
      JSONcontext(){
         nodeidx=new VI();
         cpidx=new VI();
      }
      JsonNode* root;
      VI* nodeidx;
      VI* cpidx;
};

#endif

class Network{
      
public:
   Network();
   
   VN nodes;
   VE edges;
   VCP compartments;
   vector<VCPB> compartment_borders;
   bool hasfixed; // note this only consitently updated if addNode is used with the _fx parameter
     
   void addEdge(int from, int to, Edgetype type); //add in an edge "from"-->"to" of type "type".
   void addNode(int index); //add in a Node.
   void addNode(int index, Nodetype _type); //add in a Node of specified type.
   void addNode(int index, Nodetype _type, string _name, double _width=0, double _height=0, double _x=0, double _y=0, double _dir=0, int _comp=0, bool _fx=false); //add in a node with all properties given (preferred in the algorithm).
   void addCompartment(int index, string _name);  //add in a compartment with specified index and name (preferred in the algorithm).
   void addCompartment(int index, double _xmin, double _xmax, double _ymin, double _ymax, string _name, bool _fx=false); //add in a compartment with all properties given.
   void addReaction(int index, const VI* substrates, const VI* products, const VI* catalysts, const VI* activators, const VI* inhibitors); //add in a reaction. (implemented yet not used in the algorithm).  
   VI* getNeighbors(int nodeIndex, Edgetype type); //find a specified type (eg. substrates) of neighbor nodes of a node.
   VI* getNeighbors(int nodeIndex);  //find the neighbor nodes of a node.
   bool isNeighbor(int node1, int node2);
   int degree(int nodeIndex);
   void dump();
   void read(const char * file=NULL); // read network from file
   void write(const char * file=NULL);
   void dumpNodes(FILE * out); // write nodes with properties
   void dumpEdges(FILE * out); // write nodes with properties
   Rect getBB(bool includeCompartments=false); // get bounding box
   void calcEdgeLengths();
   void unfixAll();
   int  edgeCycles(int edge);
#ifdef USEJSON   
   JSONcontext* readJSON(const char * file=NULL);
   void writeJSON(JSONcontext* ctx,const char* file=NULL);
#endif
   
protected:
   char* infile; // the filename the network is read from (only for the text input format)
   void edgeCyclesRec(int node, int target, VI &visited, int &found);
};
   
#endif
