#ifndef th_edge_h
#define th_edge_h
#include "headers.h"

class Edge {
public:
   Edge(){
      from=0;
      to=0;
      pts.type=directed;
   }
   Edge(int _from, int _to, Edgetype _type){   
       from=_from;
       to=_to;
       pts.type=_type;
   }       
   
   int from,to; //the "from" attribute is a reaction node, and the "to" attribute is a compound node.
   Edgeproperties pts;
   
};

#endif






     
      
