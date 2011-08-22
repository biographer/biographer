/*
 * Copyright (c) 2011, Wei Jing, Thomas Handorf, The Biographer Community
 * 
 * This file is part of Biographer.
 * Biographer is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Biographer is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public License
 * along with Biographer.  If not, see <http://www.gnu.org/licenses/>.
 */

#ifndef th_edge_h
#define th_edge_h
#include "headers.h"

class Edge {
public:
   Edge(int _from, int _to, Edgetype _type){   
       from=_from;
       to=_to;
       pts.type=_type;
   }       
   
   int from,to; //the "from" attribute is a reaction node, and the "to" attribute is a compound node.
   Edgeproperties pts;
   
};

#endif






     
      
