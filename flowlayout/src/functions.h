/*
 * Copyright (c) 2011, Wei Jing, Thomas Handorf, The Biographer Community
 * 
 * This file is part of Biographer.
 * Biographer is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Biographer is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public License
 * along with Biographer.  If not, see <http://www.gnu.org/licenses/>.
 */

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

