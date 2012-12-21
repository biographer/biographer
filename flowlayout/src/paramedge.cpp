#ifndef th_paramedge_h
#define th_paramedge_h
#include "types.h"

#include "network.h"
class ParamEdge {
   public:
      ParamEdge(const Point &_p1, const Point &_p2):ref(_p1), start(0){
         dx=_p2.x-_p1.x;
         dy=_p2.y-_p1.y;
         end=sqrt(dx*dx+dy*dy);
         dx/=end; // make unit vector;
         dy/=end;
      }
      ParamEdge(Network &nw,Edge &e):ref(nw.nodes[e.from]),start(0){
         dx=nw.nodes[e.to].x-ref.x;
         dy=nw.nodes[e.to].y-ref.y;
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
         double p2=(dy*ref2.x-dy*ref.x-dx*ref2.y+dx*ref.y)/(dx*dy2-dx2*dy); // cut point in parametric form
         if (p>start && p < end && p2>e2.start && p2 < e2.end) return true;
         return false;
      }
      double cross_param(const ParamEdge &e2){ // does not check start and end points of edges
         const double &dx2=e2.dx;
         const double &dy2=e2.dy;
         const Point &ref2=e2.ref;
         if (dx2*dy==dx*dy2) return DBL_MAX; // parallel
         return (dy2*ref.x-dy2*ref2.x-dx2*ref.y+dx2*ref2.y)/(dx2*dy-dx*dy2); // cut point in parametric form
      }
      Point cross_point(const ParamEdge &e2){ // does not check start and end points of edges
         double p=cross_param(e2);
         return Point(ref.x+dx*p,ref.y+dy*p);
      }
      bool cross(const Rect &r){
         if (cross(ParamEdge(r.TL(),r.TR()))) return true;
         if (cross(ParamEdge(r.TR(),r.BR()))) return true;
         if (cross(ParamEdge(r.BR(),r.BL()))) return true;
         if (cross(ParamEdge(r.BL(),r.TL()))) return true;
         return false;
      }
      double cross_param_smallest(const Rect &re){
         ParamEdge t(re.TL(),re.TR());
         ParamEdge r(re.TR(),re.BR());
         ParamEdge b(re.BR(),re.BL());
         ParamEdge l(re.BL(),re.TL());
         double p=DBL_MAX,minp=DBL_MAX;
         if (cross(t)) p=cross_param(t);
         if (p<minp) minp=p;
         if (cross(r)) p=cross_param(r);
         if (p<minp) minp=p;
         if (cross(b)) p=cross_param(b);
         if (p<minp) minp=p;
         if (cross(l)) p=cross_param(l);
         if (p<minp) minp=p;
         return minp;
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
      void re_ref(const Point &p){
         ref=p;
      }
      Point dist_vec(const Point &p){ // points from p to nearst point on line defined by edge
         return (ref-p)-(unit()*scalar(ref-p,unit()));
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
      Point ref;
      double dx,dy;
      double start,end;
};
#endif