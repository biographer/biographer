# Introduction #

The GINML format has been designed as part of the GINsim computer tool for the modeling and simulation of genetic regulatory networks. It is an XML format based on GXL(Graph eXchange Language).

# Details #

The XML file has the elements node and edge. These can be used to get the list of nodes and the edge connections. The type of edge can be determined from the sign attribute of the edge element, it can have the values positive or negative. If not specified the influence type is set to unknown.

To find the update rule the parameter subelement of node has to be parsed. It consists of the attribute idActiveInteractions identifying the interacting edges which result in a active node.

The parser implemented in biographer uses the jQuery XML parser and utilises the jQuery find function. This greatly simplifies the code and results in a small parser.

Example file : Boolean Mammalian cell cycle.

Note : Only GINML files with nodes having maxval=1 (Boolean nodes) can be simulated using the biographer simulator.