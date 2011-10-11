#include "functions.h"
#define zero 1e-12

Point operator+(const Point& p1, const Point& p2){
   //addition of two vectors
   Point p;
   p.x=p1.x+p2.x;
   p.y=p1.y+p2.y;
   return p;
}

Point operator-(const Point& p1, const Point& p2){
   //vector p1 minus vector p2
   Point p;
   p.x=p1.x-p2.x;
   p.y=p1.y-p2.y;
   return p;   
}
Point& operator+=(Point& p1, const Point& p2){
   //vector p1 plus vector p2 (inplace)
   p1.x+=p2.x;
   p1.y+=p2.y;
   return p1;   
}
Point& operator-=(Point& p1, const Point& p2){
   //vector p1 minus vector p2 (inplace)
   p1.x-=p2.x;
   p1.y-=p2.y;
   return p1;   
}


double operator*(const Point& p1, const Point& p2){
   //vector product of two vectors
   return p1.x*p2.y-p1.y*p2.x;
}
Point operator*(const Point& p1, const double scalar){
   //scale vector
   Point p;
   p.x=p1.x*scalar;
   p.y=p1.y*scalar;
   return p;
}
Point operator/(const Point& p1, const double scalar){
   //scale vector
   Point p;
   p.x=p1.x/scalar;
   p.y=p1.y/scalar;
   return p;
}
Point unit(const Point& p1){
   double len=norm(p1);
   Point p=p1;
   return p*(1/len);
}

Point to_left(const Point& p0, const double beta){
   //rotating the vector "p0" "beta" degrees to the left.
   double alpha=angle(p0), d=norm(p0);
   Point p;
   p.x=d*cos(alpha+beta);
   p.y=d*sin(alpha+beta);
   return p;
}

double norm(const Point& p){
   //norm (length) of a vector.
   return sqrt(p.x*p.x+p.y*p.y);
}

double angle(const Point& p){
   // angle of a vector (w.r.t +x axis), within range [0.5PI, 1.5PI].
   return atan2(p.y,p.x);
/*   if(p.x==0){
      if(p.y>=0)return 0.5*PI;
      else return -0.5*PI;
   }
   double alpha=atan(p.y/p.x);
   if(p.x<0)alpha+=PI; //make sure it fit in range [0.5PI, 1.5PI].
   return alpha;*/
}

double dist(const Point& p1, const Point& p2){
   //the distance between point p1 and p2.
   return norm(p1-p2);
}

double lim(double beta){
   //make an angle to fit in range [-PI, PI].
   while (beta<-PI) {
      beta+=(2*PI);
   }
   while (beta>PI) {
      beta-=(2*PI);
   }
   return beta;
}

int p_compare(const Point& p1, const Point& p2){
   //comparing two points (y-dominated).
   if(fabs(p1.y-p2.y)>zero){
      if(p1.y>p2.y)return 1;
      else return -1;
   }
   if(fabs(p1.x-p2.x)>zero){
      if(p1.x>p2.x)return 1;
      else return -1;
   }
   return 0;
}

int min_four(int a1,int a2,int a3,int a4){
   //get the minimum among four integers.
   if(a2<a1)a1=a2;
   if(a3<a1)a1=a3;
   if(a4<a1)a1=a4;
   return a1;
}
      
  
int bitpos(unsigned long val){
   int scan=1;
   int pos=0;
   while (val & scan==0){
      pos++;
      scan=scan<<1;
   }
   return pos;
}
double get_dij(Network &nw,int i, int j){ 
   //ideal distance between adjacent nodes;
   double x=nw.nodes[i].width * nw.nodes[i].width + nw.nodes[i].height * nw.nodes[i].height;
   double y=nw.nodes[j].width * nw.nodes[j].width + nw.nodes[j].height * nw.nodes[j].height;
   return (sqrt(x)+sqrt(y))*0.3*log(1+degree(i)+degree(j));
}
void get_ideal_distances(Network &nw,VF &dij){
   /* This procedure computes the ideal lengths of edges (the ideal distances between adjacent nodes): dij[i],
   */
   int n=nw.nodes.size(), m=nw.edges.size(), i,n1,n2;
   dij.resize(m);
   
   for(i=0;i<m;i++){
      //ideal length of edge-i.
      n1=nw.edges[i].from;
      n2=nw.edges[i].to;
      dij[i]=get_dij(n1,n2);
   }
   
}
void get_degrees(Network &nw,VI &deg){
   int n=nw.nodes.size(),i;
   dij.resize(n);
   
   for(i=0;i<n;i++){
      deg[i]=nw.degree(i);
   }
      
}
double get_dij2(Network &nw,int i, int j){ 
   /*minimum distance between non-adjacent nw.nodes.
   it should be much larger than the distance between adjacent nw.nodes.
   */
   double x=nw.nodes[i].width * nw.nodes[i].width + nw.nodes[i].height * nw.nodes[i].height;
   double y=nw.nodes[j].width * nw.nodes[j].width + nw.nodes[j].height * nw.nodes[j].height;
   return 1.8*(sqrt(x)+sqrt(y));
}
double avg_sizes(Network &nw){
   int i,n;
   n=nw.nodes->size();
   double size=0;
   for(i=0;i<n;i++){
      size+=nw.nodes[i].width;
      size+=nw.nodes[i].height;
   }
   return size/(2*n);
}
bool edge_cross(layout_state &state, int i, int j){ 
   /* whether edge-i and edge-j cross each other.
   a1,a2 are two ends of edge-i, and b1,b2 are two ends of edge-j.
   edge-i and edge-j cross each other only if: 
   1. a1 and a2 are on different sides of b1, which can be judged using vector-products.
   2. a1 and a2 are on different sides of b2.
   */
   int a1,a2,b1,b2;
   a1=state.nw.edges[i].from;
   a2=state.nw.edges[i].to;
   b1=state.nw.edges[j].from;
   b2=state.nw.edges[j].to;
   if((state.pos[a1]-state.pos[b1])*(state.pos[a2]-state.pos[b1])<0 && (state.pos[a1]-state.pos[b2])*(state.pos[a2]-state.pos[b2])<0)return true;
   return false;
}
  
