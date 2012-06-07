#ifndef th_headers_h
#define th_headers_h
#define _USE_MATH_DEFINES
#include <math.h>
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

class Point;
class Rect;

Point operator+(const Point& p1, const Point& p2);  //addition of two vectors.
Point operator-(const Point& p1, const Point& p2);  //vector p1 minus p2.
Point operator-(const Point& p1);
Point operator+(const Point& p1, const double d);
Point& operator+=(Point& p1, const Point& p2);  //addition of two vectors (inplace).
Point& operator-=(Point& p1, const Point& p2);  //substration of two vectors (inplace).
Point& operator+=(Point& p1, const double d);
//double operator*(const Point& p1, const Point& p2);  //cross-product (vector product) of two vectors.
Point operator*(const Point& p1, const double scalar); //scale vector
Point operator/(const Point& p1, const double scalar); //scale vector
Point& operator*=(Point& p1, const double scalar);
Point& operator/=(Point& p1, const double scalar);
bool operator==(const Point& p1, const Point& p2);
bool operator!=(const Point& p1, const Point& p2);
double scalar(const Point& p1, const Point& p2); // scalar product
double prod(const Point& p1, const Point& p2); // vector product 2d
Point unit(const Point& p1); // unit vector
Point to_left(const Point& p0, const double beta);  //rotating the vector "p0" "beta" degrees to the left.

double norm(const Point& p); //norm (length) of a vector.
double manh(const Point& p);
double angle(const Point& p); // angle of a vector (w.r.t +x axis), within range [0.5PI, 1.5PI].
double dist(const Point& p1, const Point& p2); //the distance between point p1 and p2.
double lim(double beta); //make an angle to fit in range [-PI, PI]

int p_compare(const Point& p1, const Point& p2);//comparing two points (y-dominated).
int min_four(int a1,int a2,int a3,int a4); //get the minimum among four integers.



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
      Rect():  xmin(0), ymin(0), xmax(0), ymax(0),left(xmin),top(ymin),right(xmax),bottom(ymax){}
      Rect(double _xmin, double _ymin, double _xmax, double _ymax):  xmin(_xmin), ymin(_ymin), xmax(_xmax), ymax(_ymax),left(xmin),top(ymin),right(xmax),bottom(ymax){}
      Rect(const Rect &cp): xmin(cp.xmin), ymin(cp.ymin), xmax(cp.xmax), ymax(cp.ymax),left(xmin),top(ymin),right(xmax),bottom(ymax){}
      Rect& operator=(const Rect &cp){
         xmin=cp.xmin;
         ymin=cp.ymin;
         xmax=cp.xmax;
         ymax=cp.ymax;
         return *this;
      }
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
      inline Point TL() const {
         return Point(xmin,ymin);
      }
      inline Point TR() const {
         return Point(xmax,ymin);
      }
      inline Point BL() const {
         return Point(xmin,ymax);
      }
      inline Point BR() const {
         return Point(xmax,ymax);
      }
      Point border_vec(Point vec){
         vec=unit(vec);
         double w=fabs(xmax-xmin);
         double h=fabs(ymax-ymin);
         if (w/fabs(vec.x)<h/fabs(vec.y)){
            vec*=(w/2)/fabs(vec.x);
         } else {
            vec*=(h/2)/fabs(vec.y);
         }
         return vec;
      }
      bool contains(const Point &p){
         return xmin<p.x && xmax>p.x && ymin<p.y && ymax>p.y;
      }
      double xmin, ymin, xmax, ymax; // WARNING never change order
      double &left,&top,&right,&bottom; // aliases for xmin...ymax
      double& acs(int index){
         switch (index) {
            case 0: return xmin;
            case 1: return ymin;
            case 2: return xmax;
            case 3: return ymax;
            default: abort();
         }
      } // array accession of xmin,ymin,xmax,ymax

};
class CompartmentBorderIndexes{ // contains indexes to compartmentborders of the network (if common border with other compartment) or -1 if on edge of network
   public:
      CompartmentBorderIndexes():left(-1),top(-1),right(-1),bottom(-1){}
      int& acs(int index){
         switch (index) {
            case 0: return left;
            case 1: return top;
            case 2: return right;
            case 3: return bottom;
            default: abort();
         }
      } // array accession of xmin,ymin,xmax,ymax
      int left,top,right,bottom;
};

class Compartment : public Rect{
public:
   Compartment():name(string()),fixed(false){
      //default compartment constructor.            
   }
   Compartment(string _name):name(_name),fixed(false){
      //construct a compartment with a specified name (preferred in the algorithm).
   }
   Compartment(double _xmin, double _ymin, double _xmax, double _ymax, string _name, bool _fx=false):Rect(_xmin,_ymin,_xmax,_ymax), name(_name),fixed(_fx){   
   //construct a compartment with all attributes given.
   }
   void print();
   string name; //name of the node.
   bool fixed;
   CompartmentBorderIndexes border_index;
};

class CompartmentBorder{
   public:
      CompartmentBorder():compartment(0),dir(0){}
      CompartmentBorder(int cp, int d): compartment(cp), dir(d){}
      int compartment;
      int dir;
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
      Node():type(none),fixed(false){
         //default node constructor.
      }
      Node(Nodetype _type):type(_type),fixed(false){
         //node constructor with a specified node type.
      }
      Node(Nodetype _type, string _name, float _width=0, float _height=0, float _x=0, float _y=0, float _dir=0, int _comp=0, bool _fx=false):Point(_x,_y), type(_type), name(_name), width(_width), height(_height), dir(_dir), compartment(_comp),fixed(_fx){
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
      bool fixed;
};
typedef vector<Node> VN;
typedef vector<Edge> VE;
typedef vector<Rect> VR;
typedef vector<Compartment> VCP;
typedef vector<CompartmentBorder> VCPB;
typedef vector<VI> VVI;
inline double sign(double x){
   return (x < 0) ? -1 : (x > 0);
}

#endif
