# The Font issue #

Currently server and layouter do not know, what size the nodes will
actually have on the client side, since different OSes and browsers
will be used.
Knowing this is essential, since the labels need to be properly
fitted into their bounding boxes.

## UI ##
  * **Verdana**
  * **14px**

## graphviz ##

[graphviz defaults](http://www.graphviz.org/doc/info/attrs.html):
  * **Times-Roman**
  * **14.0**

Maybe biographer should use this as default too. Would allow also for comparable pictures.