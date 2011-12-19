#ifndef th_netdisplay_h
#define th_netdisplay_h
#include<X11/Xlib.h>
#include<cairo/cairo.h>
#include<cairo/cairo-xlib.h>

#include<stdio.h>
#include<stdlib.h>
#include<string.h>

#include "network.h"

class forcevec{
   public:
      forcevec(const Point &v): vec(v), col(0){};
      forcevec(const Point &v, int c): vec(v), col(c){};
      Point vec;
      int col;
};

class NetDisplay{
   public:
      NetDisplay(const Network &n);
      NetDisplay(const Network &n, vector<vector<forcevec> > &f);
      ~NetDisplay();
      int show();
      bool waitKeyPress;
   protected:
      const Network &net;
      Display *dpy;
      Window rootwin;
      Window win;
      XEvent e;
      int stepnum;
      int scr;
      int sizeX,sizeY;
      const vector<vector<forcevec> > &forces;
      bool hasforces;
      cairo_surface_t *cs;
      double grid;
      void init();
      void processEvents();
      void draw();
};
void debugline(double x1,double y1, double x2, double y2, int r, int g, int b);
#endif