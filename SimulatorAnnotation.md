# 1. Node annotations #

The simulator shall provide the possibility to annotate parts of your simulated network. Proteins may link to a database entry, edges may link to a paper, explaining the relationship.

## Implementation ##

Annotation is a task, that has been professionally addressed before. SBML supports model annotation. You may do it e.g. using [semanticsSBML "Annotate your model"](http://www.semanticsbml.org/aym/).

Annotation import has not yet been addressed in the python class.
SBML annotations are ignored right now.
This feature will be implemented later
and we also expect SBML to become the central format for the simulator,
since also the math may be loaded from and saved to it later (LRG, see Boolean Networks chapter).

## BooleNet annotations ##

Since BooleNet models consist only of a single Python file, a special solution for annotations has been created for them, see **Boolean Networks**.

# 2. SBGN Labels #

![http://simulator.biographer.googlecode.com/hg/doc/annotation.png](http://simulator.biographer.googlecode.com/hg/doc/annotation.png)

not implemented yet