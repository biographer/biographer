#ifndef th_netdisplay_h
#define th_netdisplay_h
#include<X11/Xlib.h>
#include<cairo/cairo.h>
#include<cairo/cairo-xlib.h>

#include<stdio.h>
#include<stdlib.h>
#include<string.h>

#include "network.h"

class NetDisplay{
   public:
      NetDisplay(const Network &n);
      ~NetDisplay();
      void show();
      bool waitKeyPress;
   protected:
      const Network &net;
      Display *dpy;
      Window rootwin;
      Window win;
      XEvent e;
      int scr;
      int sizeX,sizeY;
      cairo_surface_t *cs;
      void processEvents();
      
};
#endif