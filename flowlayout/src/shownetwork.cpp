#include<cairo.h>
#include<cairo-pdf.h>
#include<cairo-ps.h>
#include<cairo-xlib.h>
#include<X11/Xlib.h>

#include<stdio.h>
#include<stdlib.h>
#include<string.h>

class NetDisplay{
	public:
		NetDisplay();
		~NetDisplay();
		show(Network &net);
	protected:
		Display *dpy;
		Window rootwin;
		Window win;
		XEvent e;
		int scr;
		cairo_surface_t *cs;
};
#define SIZEX 100
#define SIZEY  50
NetDisplay::NetDisplay(){
	if(!(dpy=XOpenDisplay(NULL))) {
		fprintf(stderr, "ERROR: Could not open display\n");
		exit(1);
	}
	scr=DefaultScreen(dpy);
	rootwin=RootWindow(dpy, scr);

	win=XCreateSimpleWindow(dpy, rootwin, 1, 1, SIZEX, SIZEY, 0, 
			BlackPixel(dpy, scr), BlackPixel(dpy, scr));

	XStoreName(dpy, win, "hello");
	XSelectInput(dpy, win, ExposureMask|ButtonPressMask);
	XMapWindow(dpy, win);
	cs=cairo_xlib_surface_create(dpy, win, DefaultVisual(dpy, 0), SIZEX, SIZEY);

	while(1) {
		XNextEvent(dpy, &e);
		if(e.type==Expose && e.xexpose.count<1) {
			paint(cs);
		} else if(e.type==ButtonPress) break;
	}
}
NetDisplay::~NetDisplay(){
	cairo_surface_destroy(cs);
	XCloseDisplay(dpy);
}
NetDisplay::show(Network &net){
	cairo_set_source_rgb (cr, 255, 255, 255);
	cairo_paint (cr);
	
}