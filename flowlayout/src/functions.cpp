#include "functions.h"
#include "defines.h"

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
Point operator-(const Point& p1){
   //vector -p1
   return Point(-p1.x,-p1.y);
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
Point& operator*=(Point& p1, const double scalar){
   //vector p1 minus vector p2 (inplace)
   p1.x*=scalar;
   p1.y*=scalar;
   return p1;   
}
Point& operator/=(Point& p1, const double scalar){
   //vector p1 minus vector p2 (inplace)
   p1.x/=scalar;
   p1.y/=scalar;
   return p1;   
}

double scalar(const Point& p1, const Point& p2){
   return p1.x*p2.x+p1.y*p2.y;
}
/*double operator*(const Point& p1, const Point& p2){
   //vector product of two vectors
   return p1.x*p2.y-p1.y*p2.x;
}*/
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
double manh(const Point& p){
   // manhattan norm of p
   return fabs(p.x)+fabs(p.y);
}

double angle(const Point& p){ // angle of vector p 0 is x-axis
   return atan2(p.y,p.x); //in range [-PI, PI].
}

double dist(const Point& p1, const Point& p2){
   //the distance between point p1 and p2.
   return norm(p1-p2);
}

double lim(double beta){
   //make an angle to fit in range (-PI, PI].
   while (beta<=-PI) {
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
      
  
/*int bitpos(unsigned long val){
   int scan=1;
   int pos=0;
   while (val & scan==0){
      pos++;
      scan=scan<<1;
   }
   return pos;
}*/
