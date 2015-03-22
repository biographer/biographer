# Console Howto #

It is also possible to use the biographer without a graphical interface or browser. You have 2 options to do that:

  * use nodejs to run the UI without the browser and generate the usual SBGN-conform dynamic SVG
  * or choose to use graphviz, which generates a much more simple, static SVG

The middleware class works without web2py.

There is a standalone executable, located in [server:/class/standalone/](http://code.google.com/p/biographer/source/browse?repo=server#hg%2Fclass%2Fstandalone).

It allows to make use of all import and export features of the graph and associated python libraries of this project.

Layouting is done by a console executable anyway.