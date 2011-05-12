#ifndef th_node_h
#define th_node_h
#include "headers.h"

struct Node{
public:
   Node(){
      neighbors=new VI();
      pts.type=none; //set "compound" as the default node type, since most nodes are compounds.
   }
   Node(Nodetype _type){
      neighbors=new VI();
      pts.type=_type;
   }
   Node(Nodetype _type, string _name){
      neighbors=new VI();
      pts.type=_type;
      pts.name=_name;      
   }
   Node(Nodetype _type, float _width, float _height){
      neighbors=new VI();
      pts.type=_type;
      pts.width=_width;
      pts.height=_height;
   }
   Node(Nodetype _type, string _name, float _width, float _height){
      neighbors=new VI();
      pts.type=_type;
      pts.width=_width;
      pts.height=_height;
      pts.name=_name;
   }     
   
   VI* neighbors;
   Nodeproperties pts;
};

#endif

