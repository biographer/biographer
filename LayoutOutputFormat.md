# Introduction #

This file is produced by the layout algorithm. It is similar to the input format, but
compartment positions and spline info is inlcuded.

# Output Format #

```
input =
         nodelist
         compartmentlist
         "///"
         edgelist
compartmentlist =
         compartment
         [compartmentlist]
nodelist =
         node
         [nodelist]
edgelist =
         edge
         [edgelist]
compartment =
         compartment index
         compartment type
         compartment id/name
         "0"
         compartment x           # left
         compartment y           # top
         compartment width
         compartment height
         "0.000"
node =
         node index
         node type
         node id/name
         node compartment index
         node x                  # center
         node y                  # center
         node width
         node height
         node direction
edge =
         edge type " " source index " " target index " " control vectors " " support points

control vectors =
         x position "," y postions ["," control vectors]

support points =
         x position "," y postions ["," support points]

node index = '0'..n # consecutive numbering
compartment index = '0'..n # consecutive numbering, compartment '0' is the undefined compartment
```

# Splines #

B-splines are define by a start support point, an end support point and two control vectors which
start from the two support points. A spline edge can contain more than one
B-spline segment. The first and the last support point are considered the postions of
the source and the target node. Visualizations may calculate different first points
depending on the node bouindaries and the edge direct given by the first and last control
vectors.

The first spline segment of an edge starts at the sorce node with the first control vector.
It ends at the first control point OR at the target node (if only one segment) with the
second control vector.

The second spline segement starts at the first support point and uses the negative second
control vector and ends at either support point 2 OR the target with support vector 3.

This continues for all other segments. There exists always two more control vectors than support points
(as source and target positions are not included)