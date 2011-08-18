#ifndef th_function_h
#define th_function_h
#include "headers.h"

Point operator+(const Point p1, const Point p2);  //addition of two vectors.
Point operator-(const Point p1, const Point p2);  //vector p1 minus p2.
float operator*(const Point p1, const Point p2);  //cross-product (vector product) of two vectors.
Point to_left(const Point p0, const float beta);  //rotating the vector "p0" "beta" degrees to the left.

float norm(const Point p); //norm (length) of a vector.
float angle(const Point p); // angle of a vector (w.r.t +x axis), within range [0.5PI, 1.5PI].
float dist(const Point p1, const Point p2); //the distance between point p1 and p2.
float lim(float beta); //make an angle to fit in range [-PI, PI]

int p_compare(const Point p1, const Point p2);//comparing two points (y-dominated).
int min_four(int a1,int a2,int a3,int a4); //get the minimum among four integers.

#endif

