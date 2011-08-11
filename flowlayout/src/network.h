#ifndef th_network_h
#define th_network_h
#include "edge.h"
#include "node.h"
#include "headers.h"

#ifdef USEJSON 
#include <stdlib.h>
#include <glib-object.h>
#include <json-glib/json-glib.h>
#endif USEJSON

#ifdef USEJSON   
class JSONcontext{
   public: 
      JSONcontext(){
         nodeidx=new VI();
      }
      JsonNode* root;
      VI* nodeidx;
};

class Network{
      
public:
   Network();
   ~Network();
   
   VN * nodes;
   VE * edges;
   VCP * compartments;
     
   void addEdge(int from, int to, Edgetype type); //add in an edge "from"-->"to" of type "type".
   void addNode(int index); //add in a Node.
   void addNode(int index, Nodetype _type); //add in a Node of specified type.
   void addNode(int index, Nodetype _type, string _name, float _width, float _height, float _x, float _y, float _dir);  
   void addNode(int index, Nodetype _type, string _name, float _width, float _height, float _x, float _y, float _dir, int _comp); //add in a node with all properties given (preferred in the algorithm).
   void addCompartment(int index, string _name);  //add in a compartment with specified index and name (preferred in the algorithm).
   void addCompartment(int index, float _xmin, float _xmax, float _ymin, float _ymax, string _name); //add in a compartment with all properties given.
   void addReaction(int index, const VI* substrates, const VI* products, const VI* catalysts, const VI* activators, const VI* inhibitors); //add in a reaction. (implemented yet not used in the algorithm).  
   VI* getNeighbors(int nodeIndex, Edgetype type); //find a specified type (eg. substrates) of neighbor nodes of a node.
   VI* getNeighbors(int nodeIndex);  //find the neighbor nodes of a node.

   void read(const char * file=NULL); // read network from file
   void dumpNodes(const char* file); // write nodes with properties
   
#ifdef USEJSON   
   JSONcontext* readJSON(const char * file=NULL);
#endif USEJSON
   
   
   float layout(); //run the layout algorithm to obtain the coordinates of nodes.
      
protected:
     
   float get_dij1(int i, int j); //the ideal distance between adjacent nodes;
   float get_dij2(int i, int j); //the minimum distance between non-adjacent nodes;
   void get_ideal_distance(); //get the ideal distances or minimum distances between the nodes.
   float init_layout(); //a quick initial layout.
   float calc_force_adj(); //calculating the force resulted from edges (adjacent nodes).
   float calc_force_nadj(); //calculating the force resulted from non-adjacent nodes (node-overlapping in particular).
   float calc_force_compartments(); //make sure that the nodes obey compartment rule;
   float firm_distribution(); //firmly distribute the edges around a compound.
   float post_pro(int _round); //post-processing method: to make the layout more compacted and remove node-overlapping.
   void move_nodes(); //move the nodes to a new position.
   void init_compartments(); //initialize the compartment boundaries.
   void adjust_compartments(); //adjusting the boundaries of compartments.
   bool swap_node(); //swap two compounds if: they are connected to the same reaction and the swapping reduces system force. 
   bool near_swap(); //swap two nodes if: they are close to each other and the swapping reduces system force.
   float swap_force(int p1, int p2); //the force reduced afer placing node-p1 at node-p2's position.
   bool edge_cross(int i, int j); //whether edge-i and egde-j cross each other.
   float min_edge_crossing(int deglim); //tries to minimize edge-edge crossing.
   void post_pro_dist();
   void brute_force_post_pro();
      
   VP pos, mov; //positions and dispalcements of nodes.
   struct rect{
      float xmin, xmax, ymin, ymax;
   };
   vector<rect>bcomp; //compartment boundaries;
   vector<float>dij1; //ideal length of edge (ieal distance btween adjacent nodes).
   vector< vector<float> >dij2; //minimum distance between non-adjacent nodes.
   vector< vector<bool> >isadj; //whether the two nodes are adjacent to each other.
   vector<float>pts_dir; //pts_dir[i]==(*node)[i].pts.dir.
   vector<float>mov_dir; //adopted for ajusting pts_dir[i].
   VI deg;  //number of edges incident on a node.
   int * above_comp;  //the compartment (index) in above.
};
   
#endif
#endif