#ifndef th_node_h
#define th_node_h
#include "headers.h"

class Node{
public:
   Node(){
      neighbors=new VI();
      pts.type=none; //set "compound" as the default node type, since most nodes are compounds.
      pts.compartment=0;
   }
   Node(Nodetype _type){
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
   
   VI* neighbors;
   Nodeproperties pts;
};

#endif

