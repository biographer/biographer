#include "functions.h"

Point operator+(const Point p1, const Point p2){
   //addition of two vectors
   Point p;
   p.x=p1.x+p2.x;
   p.y=p1.y+p2.y;
   return p;
}

Point operator-(const Point p1, const Point p2){
   //vector p1 minus vector p2
   Point p;
   p.x=p1.x-p2.x;
   p.y=p1.y-p2.y;
   return p;   
}

float operator*(const Point p1, const Point p2){
   //vector product of two vectors
   return p1.x*p2.y-p1.y*p2.x;
}

Point to_left(const Point p0, const float beta){
   //rotating the vector "p0" "beta" degrees to the left.
   float alpha=angle(p0), d=norm(p0);
   Point p;
   p.x=d*cos(alpha+beta);
   p.y=d*sin(alpha+beta);
   return p;
}

float norm(const Point p){
   //norm (length) of a vector.
   return sqrt(p.x*p.x+p.y*p.y);
}

float angle(const Point p){
   // angle of a vector (w.r.t +x axis), within range [0.5PI, 1.5PI].
   if(p.x==0){
      if(p.y>=0)return 0.5*PI;
      else return 1.5*PI;
   }
   float alpha=atan(p.y/p.x);
   if(p.x<0)alpha+=PI; //make sure it fit in range [0.5PI, 1.5PI].
   return alpha;
}

float dist(const Point p1, const Point p2){
   //the distance between point p1 and p2.
   return norm(p1-p2);
}

float lim(float beta){
   //make an angle to fit in range [-PI, PI].
   if(beta<-PI)beta+=(2*PI);
   if(beta>PI)beta-=(2*PI);
   return beta;
}

int min_four(int a1,int a2,int a3,int a4){
   //get the minimum among four integers.
   if(a2<a1)a1=a2;
   if(a3<a1)a1=a3;
   if(a4<a1)a1=a4;
   return a1;
}
      
  
  
