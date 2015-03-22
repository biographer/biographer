## graphviz SVGs ##

The simplest solution.

Server get's the network (jSBGN format), inputs it to graphviz, which in turn makes a nice, already layouted SVG, that is returned to the simulator.

The simulator loads it as a dynamic SVG (no static image include).

Actually the SVG is slightly modified by the server before being returned, in order to allow the simulator node recognition for dynamic access.

## Example ##
![http://simulator.biographer.googlecode.com/hg/demo/Glucose.png](http://simulator.biographer.googlecode.com/hg/demo/Glucose.png)

## Disadvantages ##

  1. all nodes are equal (ellipse shape)
  1. all edges/arrows are equal: subtrates, catalysts and inhibitors are not differentiated
  1. reaction nodes are not shown, every reaction can have only one output

Some of these disadvantages could actually be fixed, see also http://www.graphviz.org/doc/info/attrs.html#k:arrowType, but we are currently focussing on integrating the biographer UI, which will offer us SBGN-conform presentation.