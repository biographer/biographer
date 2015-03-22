# Activity Flow #
Loading a Boolean network with the BoolNet or BooleNet importer gives a [SBGN-AF](http://www.sbgn.org/Image:Refcard-AF.png), which we want to extend to visualize the logical operators between nodes. In a later step, this should be integrated into the editor to edit the logical operators of the Boolean network and directly simulate this new topology.

# Process Description #
Loading an SBML file with the SBML importer gives a [SBGN-PD](http://www.sbgn.org/Image:Refcard-PD.png) which can be simulated using the libScopes wrapper. In PD, there is no need to represent the logical operators, since all substrates are needed for a reaction (AND) and catalysators as well.

## The marriage of Boolean Networks and Process Description ##

This undertaking is a bit tricky, since Boolean networks are of the nature "Activity Flow". Therefore importing Boolean networks as "Process Description" graphs, requires some magic, respectively a clever algorithm:

**Edges (arrows)**: How to decide, of which type a node on a rule's right side is (first rough guess, confirmation below):
  * **catalyzer**: name has 3 chars + 1 digit (=protein name) or name suffix is _-ase_ (=enzyme name)
  * **inhibitor**: _not_ operator preceeding
  * **educt**: the rest = all compounds, consumed by a process
Transcription factors are shown as "catalyzers" of gene expression.
Decision on edges can lateron be confirmed by update rule analysis: _Consumption_ = Process node activity disables input node (_not_ preceeding, see also below), _Catalyzation_ = Input node is not disabled by process activity.

**Nodes**: How to decide about the creation of process nodes:
  * one _update rule_ corresponds to _one process node_ (default)
  * if the right side of an update rules is equivalent with another rule's right side, the left sides are _two products_ of the _same process node_
  * whenever a rule contains a logic _or_, the two operator arguments represent educts/catalyzer of distinct reactions and therefore _two process nodes_
  * _consumption_: if a rule's left side is a process node, e.g. _processA_, referenced in another rule's right side with a _not_ prefix, like  _B = not processA_, then _B_ is to be treated as being _consumed_ by the process _processA_

The _or_-thing needs more attention, thinking of a product being produced by two or more distinct reactions, but so far the above is a starting point ...

### Handling naive Boolean networks ###

The creators of Boolean networks don't necessarily have SBGN Process Description rules in mind. The importer can not expect the editor to have corrently introduced process nodes, if at all. Therefore update rules need to be checked automatically upon import and be adjusted as far as needed, of course without changing the logic of the model.

Clever algorithms need to be implemented addressing the above problems, e.g. detecting whether a certain reaction logic was explicitly used several times (in different update rules) while the intention was to reference only one physical reaction.

## Problems with Process Nodes ##
This should be only one reaction/process node:

![http://simulator.biographer.googlecode.com/hg/doc/PD%20problem%20NAD.png](http://simulator.biographer.googlecode.com/hg/doc/PD%20problem%20NAD.png)

This should be only two reactions, both producing ATP:

![http://simulator.biographer.googlecode.com/hg/doc/PD%20problem%20ATP.png](http://simulator.biographer.googlecode.com/hg/doc/PD%20problem%20ATP.png)