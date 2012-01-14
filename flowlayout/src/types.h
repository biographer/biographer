#ifndef th_headers_h
#define th_headers_h

#include <iostream>
#include <fstream>
#include <sstream>
#include <cstdlib>
#include <cmath>
#include <ctime>
#include <cstdio>
#include <cstring>
#include <algorithm>
#include <vector>
#include <string>
#include <map>
#include <queue>
#include <set>
#include <algorithm>
#include <sys/wait.h>
#include <unistd.h>
#include <float.h>


using namespace std;

typedef vector<int> VI; 
typedef vector<double> VF;

enum Edgetype{
     //five types of edges.
     directed,undirected,substrate,product,catalyst,activator,inhibitor
};
const char edgetypes[][20]={"Directed", "Undirected", "Substrate", "Product", "Catalyst", "Activator", "Inhibitor"}; //for the convenience of input and output.

enum Nodetype {
     //four types of nodes.
     none,reaction,compound,other
};
const char nodetypes[][20]={"None", "Reaction", "Compound","Other"}; //for the convenience of input and output in order of enum Nodetype.

class Point{
   public: 
      Point():x(0), y(0){}
      Point(double _x, double _y):x(_x), y(_y){}
      Point(double alpha):x(cos(alpha)), y(sin(alpha)){}
      bool is_null(){return x==0 && y==0;}
      //A point or a vector in a 2-dimensional plane.
      double x,y;
};
typedef vector<Point> VP;

class Rect{
   public:
      Rect():  xmin(0), ymin(0), xmax(0), ymax(0){}
      Rect(double _xmin, double _ymin, double _xmax, double _ymax):  xmin(_xmin), ymin(_ymin), xmax(_xmax), ymax(_ymax){}
      void translate(double x,double y){
         xmin+=x;
         xmax+=x;
         ymin+=y;
         ymax+=y;
      }
      Point center() const{
         return Point((xmax+xmin)/2,(ymax+ymin)/2);
      }
      Point size() const{
         return Point(fabs(xmax-xmin),fabs(ymax-ymin));
      }
      void extend(double val){
         extend(val,val,val,val);
      }
      void extend(double x, double y){
         extend(x,y,x,y);
      }
      void extend(double _xmin, double _ymin, double _xmax, double _ymax){
         xmin-=_xmin;
         ymin-=_ymin;
         xmax+=_xmax;
         ymax+=_ymax;
      }
      double r(){ // radius of the smallest surrounding circle
         return sqrt((xmax-xmin)*(xmax-xmin)+(ymax-ymin)*(ymax-ymin));
      }
      inline Point TL(){
         return Point(xmin,ymin);
      }
      inline Point TR(){
         return Point(xmax,ymin);
      }
      inline Point BL(){
         return Point(xmin,ymax);
      }
      inline Point BR(){
         return Point(xmax,ymax);
      }
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
   Compartment(double _xmin, double _ymin, double _xmax, double _ymax, string _name):Rect(_xmin,_ymin,_xmax,_ymax), name(_name){
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
      Edge(int _from, int _to, Edgetype _type, double length){   
         from=_from;
         to=_to;
         type=_type;
         len=length;
      }       
      int from,to; //the "from" attribute is a reaction node, and the "to" attribute is a compound node.
      Edgetype type;
      double len;
      VP splinehandles;
      VP splinepoints;
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
      void setPoint(const Point& pt){
         x=pt.x;
         y=pt.y;
      }
      Rect rect(){
         return Rect(x-width/2,y-height/2,x+width/2,y+height/2);
      }
      VI neighbors; //the edges incident on the node.
      Nodetype type; //type of node.
      string name; //name of the node.
      double width, height;  //horizontal and vertical sizes of the node.
      double dir; // default direction of node (in particular for reactions) - direction in which substrates should point to
      int compartment; //the compartment that the node belongs to (eg. Cytosol).
};
typedef vector<Node> VN;
typedef vector<Edge> VE;
typedef vector<Rect> VR;
typedef vector<Compartment> VCP;
inline double sign(double x){
   return (x < 0) ? -1 : (x > 0);
}

#endif
