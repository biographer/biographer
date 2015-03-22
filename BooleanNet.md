# Boolean Networks #

The biographer simulator extension supports the import of Boolean Networks. A network is loaded from file and node state changes are simulated inside your browser. You can change every node's state (from True to False and vice-versa) by clicking it. The node rules can also be edited by right clicking a node.
A real-time simulation (written in JS) will take place, in which you can watch the propagation of subsequent state changes throughout the network.

## Import ##

The simulator controls are self-explanatory.
At first you need to import a Boolean Network from a supported format.
You can try any one of the demo networks in the repository.
Supported file formats:
  1. [Python BooleanNet](http://code.google.com/p/booleannet/)
  1. [R BoolNet ](http://cran.r-project.org/web/packages/BoolNet/index.html)
  1. [GINML ](http://gin.univ-mrs.fr/GINsim/ginml.html)
  1. SBML

The Boolean Network is first imported into a SBGN-like object as defined by the libSBGN.js project by Duan Lian. It is then exported to a jSBGN object for use in the simulator.

The simulator translates the network update rules to JS, which allows your browser efficient and also offline simulation.

## Export ##
The Graph(Network or State Transition) can be currently exported to any of the following formats.
  * SVG
  * SBGN
  * jSBGN
The Update Rules of a network can also be exported to either Python BooleanNet or R BoolNet format.
The exported graph/file will appear as a data URI. Chrome users please download the latest version released after April 27, 2012. The download via data URI option has been fixed on that date.