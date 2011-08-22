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

#ifndef th_headers_h
#define th_headers_h

#include <iostream>
#include <cstdlib>
#include <cmath>
#include <ctime>
#include <cstdio>
#include <cstring>
#include <algorithm>
#include <vector>
#include <string>
#include <queue>
#include <set>

#define VI vector<int>
#define VN vector<Node>
#define VE vector<Edge>
#define VP vector<Point>
#define VCP vector<Compartment>
#define PI 3.14159265

using namespace std;

enum Edgetype{
     //five types of edges.
     directed,undirected,substrate,product,catalyst,activator,inhibitor
};

enum Nodetype {
     //four types of nodes.
     none,reaction,compound,other
};

struct Edgeproperties{
   Edgetype type;
};

class Compartment{
public:
   Compartment(){
      //default compartment constructor.            
   }
   Compartment(string _name){
      //construct a compartment with a specified name (preferred in the algorithm).
      name=_name;
   }
   Compartment(float _xmin, float _xmax, float _ymin, float _ymax, string _name){
      //construct a compartment with all attributes given.
      xmin=_xmin;
      xmax=_xmax;
      ymin=_ymin;
      ymax=_ymax;
      name=_name;
   }
   float xmin, xmax, ymin, ymax;
   string name; //name of the node.
};

struct Nodeproperties{ 
   //properties of nodes.
   Nodetype type; //type of node.
   string name; //name of the node.
   float x,y;  //coordinates of the node.
   float width, height;  //horizontal and vertical sizes of the node.
   float dir; // default direction of node (in particular for reactions) - direction in which substrates should point to
   int compartment; //the compartment that the node belongs to (eg. Cytosol).
};

struct Point{
   //A point or a vector in a 2-dimensional plane.
   float x,y;
};

#endif
