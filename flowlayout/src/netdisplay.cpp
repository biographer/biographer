#include <float.h>
#include "netdisplay.h"
#define SIZEX 640
#define SIZEY 480
static const vector<vector<forcevec> > dummy;
static const double fstretch=2;
class dbgline{
   public:
      dbgline(double _x1,double _y1, double _x2, double _y2, int _r, int _g, int _b, int _d):x1(_x1),y1(_y1),x2(_x2),y2(_y2),r(_r),g(_g),b(_b),dotted(_d){};
      double x1,y1,x2,y2;
      int r,g,b;
      bool dotted;
};
static vector<dbgline> dbglines;

void debugline(double x1,double y1, double x2, double y2, int r, int g, int b, bool dotted){
   dbglines.push_back(dbgline(x1,y1,x2,y2,r,g,b,dotted));
}
void debugline(Point p1, Point p2, int r, int g, int b, bool dotted){
   dbglines.push_back(dbgline(p1.x,p1.y,p2.x,p2.y,r,g,b,dotted));
}
void debugrect(Rect re, int r, int g, int b, bool dotted){
   dbglines.push_back(dbgline(re.xmin,re.ymin,re.xmax,re.ymin,r,g,b,dotted));
   dbglines.push_back(dbgline(re.xmax,re.ymin,re.xmax,re.ymax,r,g,b,dotted));
   dbglines.push_back(dbgline(re.xmax,re.ymax,re.xmin,re.ymax,r,g,b,dotted));
   dbglines.push_back(dbgline(re.xmin,re.ymax,re.xmin,re.ymin,r,g,b,dotted));
}
void debugpoint(Point p, double size,int r, int g, int b, bool dotted){
   debugrect(Rect(p.x-size/2,p.y-size/2,p.x+size/2,p.y+size/2),r,g,b,dotted);
}
NetDisplay::NetDisplay(const Network &n): waitKeyPress(false), net(n),sizeX(SIZEX),sizeY(SIZEY),forces(dummy),hasforces(false){
   init();
}
NetDisplay::NetDisplay(const Network &n, vector<vector<forcevec> > &f): waitKeyPress(false), net(n),sizeX(SIZEX),sizeY(SIZEY),forces(f),hasforces(true){
   init();
}
void NetDisplay::init(){
   if(!(dpy=XOpenDisplay(NULL))) {
      fprintf(stderr, "ERROR: Could not open display\n");
      exit(1);
   }
   scr=DefaultScreen(dpy);
   rootwin=RootWindow(dpy, scr);

   win=XCreateSimpleWindow(dpy, rootwin, 1, 1, sizeX, sizeY, 0, 
         BlackPixel(dpy, scr), BlackPixel(dpy, scr));

   XStoreName(dpy, win, "biographer-layout");
   XSelectInput(dpy, win, ExposureMask|ButtonPressMask|KeyPressMask|StructureNotifyMask);
   XMapWindow(dpy, win);
   cs=cairo_xlib_surface_create(dpy, win, DefaultVisual(dpy, 0), sizeX, sizeY);
   stepnum=1;
   grid=0;
   processEvents();
}
NetDisplay::~NetDisplay(){
	cairo_surface_destroy(cs);
	XCloseDisplay(dpy);
}
void NetDisplay::processEvents(){
   XEvent e;
   //if (!waitKeyPress) usleep(100000);
   //XFlush(dpy);
   XSync(dpy,false);
   bool cont=false;
   while((!cont && waitKeyPress) || XCheckWindowEvent(dpy,win,ExposureMask|ButtonPressMask|KeyPressMask|StructureNotifyMask,&e)) {
      if (!cont && waitKeyPress) XNextEvent(dpy, &e);
      if(e.type==Expose && e.xexpose.count<1) {
         draw();
      } else if (e.type==ConfigureNotify){
         int sx=e.xconfigure.width;
         int sy=e.xconfigure.height;
         if (sx!=sizeX || sy!=sizeY){
            sizeX=sx;
            sizeY=sy;
            cairo_xlib_surface_set_size( cs , sx , sy );
         }
      } else if(e.type==ButtonPress) {
         if (e.xbutton.button==Button2 || e.xbutton.button==Button3) waitKeyPress=!waitKeyPress;
         cont=true;
      } else if(e.type==KeyPress){
         char* key=(XKeysymToString(XLookupKeysym(&e.xkey,0)));
         //printf("key pressed: %c\n",key[0]);
         if ((key[0]>='0') && (key[0]<='9')){
            stepnum=atoi(key);
            if (stepnum==0) stepnum=10;
            cont=true;
         }
      }
   }
//   XSync(dpy,true);
}
int NetDisplay::show(){
   draw();
   processEvents();
   dbglines.clear();
   if (stepnum>1) printf("progressing %i steps\n",stepnum);
   return stepnum;
}
const unsigned short ccols[10][3]={{0,0,1},{0,1,0},{1,0,0},{1,1,0},{0,1,1},{1,0,1},{0.5,0,1},{0.5,0.5,0},{0,0.5,1},{0,1,0.5}};
const unsigned short fcols[10][3]={{0,0,1},{0,1,0},{1,0,0},{1,1,0},{0,1,1},{1,0,1},{0.5,0,1},{0.5,0.5,0},{0,0.5,1},{0,1,0.5}};
void NetDisplay::draw(){
   printf(".");
   cairo_t *c;
   int i,j;
   int sc=net.compartments.size();
   int sn=net.nodes.size();
   int se=net.edges.size();
   double xmin=DBL_MAX;
   double ymin=DBL_MAX;
   double xmax=-DBL_MAX;
   double ymax=-DBL_MAX;
   c=cairo_create(cs); // cairo context
	cairo_set_source_rgb (c, 255, 255, 255); 
	cairo_paint (c); // clear screen
   // calculate bbox
   for (i=1;i<sc;i++){
      const Compartment &cp=net.compartments[i];
      if (xmin>cp.xmin) xmin=cp.xmin;
      if (ymin>cp.ymin) ymin=cp.ymin;
      if (xmax<cp.xmax) xmax=cp.xmax;
      if (ymax<cp.ymax) ymax=cp.ymax;
   }
   for (i=0;i<sn;i++){
      const Node &n=net.nodes[i];
      if (xmin>n.x-n.width/2) xmin=n.x-n.width/2;
      if (ymin>n.y-n.height/2) ymin=n.y-n.height/2;
      if (xmax<n.x+n.width/2) xmax=n.x+n.width/2;
      if (ymax<n.y+n.height/2) ymax=n.y+n.height/2;
   }
   xmin-=(xmax-xmin)*0.05;
   xmax+=(xmax-xmin)*0.05;
   ymin-=(ymax-ymin)*0.05;
   ymax+=(ymax-ymin)*0.05;
   //   printf("bbox (%f,%f) - (%f,%f)\n",xmin,ymin,xmax,ymax);
   // set tranforms according to bbox
   double scale= ((double) sizeX)/(xmax-xmin);
   if (((double) sizeY)/(ymax-ymin)<scale) scale=((double) sizeY)/(ymax-ymin);
//   printf("dpy: (%d,%d); user: (%f,%f); scale %f\n",sizeX,sizeY,xmax-xmin,ymax-ymin,scale);
   cairo_scale(c,scale,scale);
   cairo_translate(c,-xmin,-ymin);
   //draw grid
   double ngrid=(xmax-xmin)/10;
   if (ngrid<(ymax-ymin)/10) ngrid=(ymax-ymin)/10;
   ngrid=round(ngrid/5)*5;
   if (grid==0) grid=ngrid;
   if (grid>=5*ngrid) grid/=5; // auto grid scaling
   if (grid<=ngrid/5) grid*=5;// auto grid scaling
   cairo_set_source_rgb (c, 0.5,0.5,0.5); 
   cairo_set_line_width(c,0.5/scale);
   cairo_set_dash (c,(double[2]){3/scale,3/scale},2,0);
   double l=grid*floor(xmin/grid);
   while (l<=xmax){
      cairo_set_source_rgb (c, 0.5,0.5,0.5); 
      if (l==0) cairo_set_source_rgb (c, 0,0,0); 
      cairo_move_to(c,l,ymin);
      cairo_line_to(c,l,ymax);
      l+=grid;
   }
   l=grid*floor(ymin/grid);
   while (l<=ymax){
      cairo_set_source_rgb (c, 0.5,0.5,0.5); 
      if (l==0) cairo_set_source_rgb (c, 0,0,0); 
      cairo_move_to(c,xmin,l);
      cairo_line_to(c,xmax,l);
      l+=grid;
   }
   cairo_stroke(c);
   cairo_set_dash (c,NULL,0,0);
   cairo_set_line_width (c, 1/scale);
   // draw compartments
   for (i=1;i<sc;i++){
      const Compartment &cp=net.compartments[i];
      if (i<10) cairo_set_source_rgba(c,ccols[i][0],ccols[i][1],ccols[i][2],0.2);
      cairo_rectangle(c,cp.xmin,cp.ymin,cp.xmax-cp.xmin,cp.ymax-cp.ymin);
      cairo_fill(c);
//      printf("Compartment %s: (%f,%f - %f,%f) (org)\n",cp.name.c_str(),cp.xmin,cp.ymin,cp.xmax,cp.ymax);
   }
   // draw nodes
   for (i=0;i<sn;i++){
      const Node &n=net.nodes[i];
      double x=n.x;
      double y=n.y;
      cairo_user_to_device(c,&x,&y);
//      printf("Node %s: %f,%f (%f,%f) -> %f,%f\n",n.name.c_str(),n.x,n.y,n.width,n.height,x,y);
      cairo_set_source_rgb (c, 0,0,0); 
      cairo_rectangle(c,n.x-n.width/2,n.y-n.height/2,n.width,n.height);
      cairo_stroke(c);
      cairo_set_source_rgb(c,ccols[(int) n.type][0],ccols[(int) n.type][1],ccols[(int) n.type][2]);
      cairo_rectangle(c,n.x-n.width/2+1,n.y-n.height/2+1,n.width-2,n.height-2);
      cairo_stroke(c);
      cairo_move_to(c,n.x-n.width/2,n.y-n.height/2);
      cairo_show_text(c,n.name.c_str());
      cairo_set_source_rgb (c, 0,0,0); 
      cairo_set_dash (c,(double[2]){3/scale,3/scale},2,0);
      cairo_move_to(c,n.x,n.y);
      cairo_line_to(c,n.x+n.width/2*cos(n.dir),n.y+n.width/2*sin(n.dir));
      cairo_stroke(c);
      cairo_set_dash (c,NULL,0,0);
      if (hasforces){
         for (j=0;j<forces[i].size();j++){
            int col=forces[i][j].col;
            const Point &v=forces[i][j].vec;
            cairo_set_source_rgb(c,fcols[col][0],fcols[col][1],fcols[col][2]);
            cairo_move_to(c,n.x,n.y);
            cairo_line_to(c,n.x+v.x*fstretch,n.y+v.y*fstretch);
            cairo_stroke(c);
         }
      }
   }
   cairo_set_source_rgb (c, 0,0,0); 
   for (i=0;i<se;i++){
      const Edge &e=net.edges[i];
      const Node &n1=net.nodes[(e.type==catalyst || e.type==activator || e.type==inhibitor || e.type==substrate ? e.to : e.from)];
      const Node &n2=net.nodes[(e.type==catalyst || e.type==activator || e.type==inhibitor || e.type==substrate ? e.from : e.to)];;
      cairo_set_dash (c,NULL,0,0);
      cairo_set_line_width(c,1/scale);
      if (e.type==catalyst || e.type==activator || e.type==inhibitor) cairo_set_dash (c,(double[2]){3/scale,3/scale},2,0);
      if (e.type==substrate) cairo_set_line_width(c,2/scale);
      if (e.splinehandles.size()){ // spline edge
         // calc first point of edge on boundary of first node
         double x1=n1.x;
         double y1=n1.y;
         double dx=e.splinehandles[0].x;
         double dy=e.splinehandles[0].y;
         double alpha1=fabs(n1.width/(2*dx));
         double alpha_h=fabs(n1.height/(2*dy));
         if (alpha_h<alpha1) alpha1=alpha_h;
         x1+=dx*alpha1;
         y1+=dy*alpha1;
         // calc last point of edge on boundary of second node
         double x2=n2.x;
         double y2=n2.y;
         dx=e.splinehandles.back().x;
         dy=e.splinehandles.back().y;
         alpha1=fabs(n2.width/(2*dx));
         alpha_h=fabs(n2.height/(2*dy));
         if (alpha_h<alpha1) alpha1=alpha_h;
         x2+=dx*alpha1;
         y2+=dy*alpha1;
         double x_2,y_2;
         // is last point of first spline segment a spline point or the second node of edge?
         if (e.splinepoints.size()){
            x_2=e.splinepoints[0].x;
            y_2=e.splinepoints[0].y;
         } else {
            x_2=x2;
            y_2=y2;
         }
         // draw first spline segment
         cairo_move_to(c,x1,y1);
         cairo_curve_to(c,x1+e.splinehandles[0].x,y1+e.splinehandles[0].y,x_2+e.splinehandles[1].x,y_2+e.splinehandles[1].y,x_2,y_2);
         // all other segments (if any)
         for (int j=0,jl=e.splinepoints.size();j<jl;j++){
            const Point &fst=e.splinepoints[j];
            const Point &lst=(j+1<jl ? e.splinepoints[j+1] : Point(x2,y2));
            Point h1=-e.splinehandles[j+1];
            const Point &h2=e.splinehandles[j+2];
            cairo_curve_to(c,fst.x+h1.x,fst.y+h1.y,lst.x+h2.x,lst.y+h2.y,lst.x,lst.y);
         }
         cairo_stroke(c);
      } else { // straight edge
         double x1=n1.x;
         double y1=n1.y;
         double x2=n2.x;
         double y2=n2.y;
         double dx=x2-x1;
         double dy=y2-y1;
         double alpha1; // fraction of the line which is covered by node 1
         double alpha2; // fraction of the line which is covered by node 2
         double alpha_h;
         alpha1=fabs(n1.width/(2*dx));
         alpha_h=fabs(n1.height/(2*dy));
         if (alpha_h<alpha1) alpha1=alpha_h;
         alpha2=fabs(n2.width/(2*dx));
         alpha_h=fabs(n2.height/(2*dy));
         if (alpha_h<alpha2) alpha2=alpha_h;
         if (alpha1+alpha2>=1.0){
   //         printf("edge completely covered\n");
         } else {
            x1+=dx*alpha1;
            y1+=dy*alpha1;
            x2-=dx*alpha2;
            y2-=dy*alpha2;
            cairo_move_to(c,x1,y1);
            cairo_line_to(c,x2,y2);
            cairo_stroke(c);
         }
      }
   }
   for (i=0;i<dbglines.size();i++){
      dbgline &d=dbglines[i];
      cairo_set_dash (c,NULL,0,0);
      if (d.dotted) cairo_set_dash (c,(double[6]){2/scale,2/scale,4/scale,4/scale,6/scale,6/scale},6,0);
      cairo_set_source_rgb(c,(double)d.r/255,(double)d.g/255,(double)d.b/255);
      cairo_move_to(c,d.x1,d.y1);
      cairo_line_to(c,d.x2,d.y2);
      cairo_stroke(c);
   }
   cairo_show_page(c);
   cairo_surface_flush(cs);
   cairo_destroy(c);
}