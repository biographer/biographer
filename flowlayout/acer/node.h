#ifndef th_node_h
#define th_node_h
#include "headers.h"

class Node{
public:
   Node(){
      //default node constructor.
      neighbors=new VI(); //no edges has been added.
      pts.type=none; //default node type is "none", which means unknown.
      pts.compartment=0; //default compartment is 0, which is the whole 2-dimension plane.
   }
   Node(Nodetype _type){
      //node constructor with a specified node type.
      neighbors=new VI();
      pts.type=_type;
      pts.compartment=0;
   }
   Node(Nodetype _type, string _name, float _width, float _height, float _x, float _y, float _dir){
      neighbors=new VI();
      pts.type=_type;
      pts.width=_width;
      pts.height=_height;
      pts.name=_name;
      pts.x=_x;
      pts.y=_y;
      pts.dir=_dir;
      pts.compartment=0;
   }
   Node(Nodetype _type, string _name, float _width, float _height, float _x, float _y, float _dir, int _comp){
      //constructing a node with all node properties given (preferred in the algorithm).
      neighbors=new VI();
      pts.type=_type;
      pts.width=_width;
      pts.height=_height;
      pts.name=_name;
      pts.x=_x;
      pts.y=_y;
      pts.dir=_dir;
      pts.compartment=_comp;
   }       
   
   VI* neighbors; //the edges incident on the node.
   Nodeproperties pts;
};

#endif

