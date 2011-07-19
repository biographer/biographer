#ifndef th_function_h
#define th_function_h
#include "headers.h"

Point operator+(const Point p1, const Point p2); 
Point operator-(const Point p1, const Point p2);  //in order to get the vector from p2 to p1;
float operator*(const Point p1, const Point p2);  //cross-product of two vectors.
Point to_left(const Point p0, const float beta);  //rotating the vector "p0" "beta" degrees to the left;

float norm(const Point p); //norm of a vector;
float angle(const Point p); // angle of a vector (w.r.t +x axis) [-0.5PI, 1.5PI];
float dist(const Point p1, const Point p2);
float lim(float beta); //limit the rotating angle to [-PI, PI]

int min_four(int a1,int a2,int a3,int a4);

#endif

