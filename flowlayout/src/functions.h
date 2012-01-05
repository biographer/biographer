#ifndef th_function_h
#define th_function_h
#include "types.h"

Point operator+(const Point& p1, const Point& p2);  //addition of two vectors.
Point operator-(const Point& p1, const Point& p2);  //vector p1 minus p2.
Point operator-(const Point& p1);
Point& operator+=(Point& p1, const Point& p2);  //addition of two vectors (inplace).
Point& operator-=(Point& p1, const Point& p2);  //substration of two vectors (inplace).
//double operator*(const Point& p1, const Point& p2);  //cross-product (vector product) of two vectors.
Point operator*(const Point& p1, const double scalar); //scale vector
Point operator/(const Point& p1, const double scalar); //scale vector
Point& operator*=(Point& p1, const double scalar);
Point& operator/=(Point& p1, const double scalar);
bool operator==(const Point& p1, const Point& p2);
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
#endif

