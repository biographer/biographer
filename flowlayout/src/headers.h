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
#define PI 3.14159265

using namespace std;

enum Edgetype{
     directed,undirected,substrate,product,catalyst,activator,inhibitor
};

enum Nodetype {
     none,reaction,compound,other
};

struct Edgeproperties{
   Edgetype type;
};


struct Nodeproperties{ 
   Nodetype type; 
   string name; //name of the node.
   float x,y;  //coordinates of the node.
   float width, height;  //size of the node.
   float dir; // default direction of node (in particular for reactions) - direction in which substrates should point to
};

struct Point{
   float x,y;
};

#endif
