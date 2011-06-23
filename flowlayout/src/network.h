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
   void addNode(int index); //add in a Node.
   void addNode(int index, Nodetype _type); //add in a Node of specified type.
   void addNode(int index, Nodetype _type, string _name, float _width, float _height, float _x, float _y, float _dir); //add in a Node with explict information  
   void addNode(int index, Nodetype _type, string _name, float _width, float _height, float _x, float _y, float _dir, int _comp);
   void addCompartment(int index, string _name);   
   void addCompartment(int index, float _xmin, float _xmax, float _ymin, float _ymax, string _name);
   void addReaction(int index, const VI* substrates, const VI* products, const VI* catalysts, const VI* activators, const VI* inhibitors);   
   VI* getNeighbors(int nodeIndex, Edgetype type); //get the compounds of a specified type of a reaction
   VI* getNeighbors(int nodeIndex);  //get the reactions associated with a compound.
   
   float layout();
      
protected:
     
   float get_dij1(int i, int j); //the ideal distance between adjacent nodes;
   float get_dij2(int i, int j); //the minimum distance between non-adjacent nodes;
   void get_ideal_distance();
   float init_layout();
   float calc_force_adj(); //calculating the force resulted from edges;
   float calc_force_nadj(); //calculating the force resulted from non-adjacent nodes;
   float calc_force_compartments(); //calculating force obeying compartments;
   float firm_distribution(); //firmly distribute the edges around a compound.
   float post_pro();
   void move_nodes(); //move the nodes to a new position.
   void init_compartments(); //initialize the compartment boundaries;
   void adjust_compartments(); //adjusting the boundaries of compartments.
   
   VP pos, mov;
   struct rect{
      float xmin, xmax, ymin, ymax;
   };
   vector<rect>bcomp; //compartment boundaries;
   vector<float>dij1; //adjacent nodes;
   vector< vector<float> >dij2; //non-adjacent nodes;
   vector< vector<bool> >isadj;
   vector<float>pts_dir;
   vector<float>mov_dir;
   VI cnt;
   int * above_comp;
};
   
#endif
