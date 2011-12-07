#ifndef th_paramedge_h
#define th_paramedge_h
#include <float.h>
#include "types.h"
#include "functions.h"
class ParamEdge {
   public:
      ParamEdge(const Point &_p1, const Point &_p2):ref(_p1), start(0){
         dx=_p2.x-_p1.x;
         dy=_p2.y-_p1.y;
         end=sqrt(dx*dx+dy*dy);
         dx/=end; // make unit vector;
         dy/=end;
      }
      bool cross(const ParamEdge &e2){
         const double &dx2=e2.dx;
         const double &dy2=e2.dy;
         const Point &ref2=e2.ref;
         if (dx2*dy==dx*dy2) return false; // parallel
         double p=(dy2*ref.x-dy2*ref2.x-dx2*ref.y+dx2*ref2.y)/(dx2*dy-dx*dy2); // cut point in parametric form
         if (p>start && p < end) return true;
         return false;
      }
      double cross_param(const ParamEdge &e2){
         const double &dx2=e2.dx;
         const double &dy2=e2.dy;
         const Point &ref2=e2.ref;
         if (dx2*dy==dx*dy2) return DBL_MAX; // parallel
         return (dy2*ref.x-dy2*ref2.x-dx2*ref.y+dx2*ref2.y)/(dx2*dy-dx*dy2); // cut point in parametric form
      }
      Point cross_point(const ParamEdge &e2){
         double p=cross_param(e2);
         return Point(ref.x+dx*p,ref.y+dy*p);
      }
      inline double length(){
         return end-start;
      }
      void extend(double startd,double endd){
         start-=startd;
         end+=endd;
         if (start>end){
            start=(start+end)/2;
            end=start;
         }
      }
      inline Point p(double p){ // Point on edge by parameter p
         return ref+Point(dx,dy)*p;
      }
      inline Point from(){
         return p(start);
      }
      inline Point to(){
         return p(end);
      }
      inline Point unit(){
         return Point(dx,dy);
      }
      inline Point vec(){
         return unit()*length();
      }
      const Point ref;
      double dx,dy;
      double start,end,;
};
#endif