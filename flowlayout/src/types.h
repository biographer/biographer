#ifndef th_headers_h
#define th_headers_h

#include <iostream>
#include <fstream>
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
#include <algorithm>
#include <sys/wait.h>
#include <unistd.h>

#define VI vector<int>
#define VN vector<Node>
#define VE vector<Edge>
#define VP vector<Point>
#define VR vector<Rect>
#define VCP vector<Compartment>
#define VF vector<double>
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

class Point{
   public: 
      Point():x(0), y(0){}
      Point(double _x, double _y):x(_x), y(_y){}
      //A point or a vector in a 2-dimensional plane.
      double x,y;
};
class Rect{
   public:
      Rect():  xmin(0), ymin(0), xmax(0), ymax(0){}
      Rect(double _xmin, double _ymin, double _xmax, double _ymax):  xmin(_xmin), ymin(_ymin), xmax(_xmax), ymax(_ymax){}
      double xmin, ymin, xmax, ymax;

};

class Compartment : public Rect{
public:
   Compartment():name(string()){
      //default compartment constructor.            
   }
   Compartment(string _name):name(_name){
      //construct a compartment with a specified name (preferred in the algorithm).
   }
   Compartment(double _xmin, double _ymin, double _xmax, double _ymax, string _name):Rect(_xmin,_ymin,_ymax,_ymax), name(_name){
      //construct a compartment with all attributes given.
   }
   string name; //name of the node.
};

class Edge {
   public:
      Edge(){
         from=0;
         to=0;
         type=directed;
      }
      Edge(int _from, int _to, Edgetype _type){   
         from=_from;
         to=_to;
         type=_type;
      }       
      int from,to; //the "from" attribute is a reaction node, and the "to" attribute is a compound node.
      Edgetype type;
};
class Node: public Point{
   public:
      Node():type(none){
         //default node constructor.
      }
      Node(Nodetype _type):type(_type){
         //node constructor with a specified node type.
      }
      Node(Nodetype _type, string _name, float _width, float _height, float _x, float _y, float _dir):Point(_x,_y), type(_type), name(_name), width(_width), height(_height), dir(_dir), compartment(0){
         
      }
      Node(Nodetype _type, string _name, float _width, float _height, float _x, float _y, float _dir, int _comp):Point(_x,_y), type(_type), name(_name), width(_width), height(_height), dir(_dir), compartment(_comp){
         //constructing a node with all node properties given (preferred in the algorithm).
      }       
      
      VI neighbors; //the edges incident on the node.
      Nodetype type; //type of node.
      string name; //name of the node.
      double width, height;  //horizontal and vertical sizes of the node.
      double dir; // default direction of node (in particular for reactions) - direction in which substrates should point to
      int compartment; //the compartment that the node belongs to (eg. Cytosol).
};

#endif
