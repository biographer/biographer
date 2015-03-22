# Introduction #

A State Transition Graph represents how a network behaves in different initial states. It is a directed graph that defines the flow of states for the boolean network.

It is normally used to analyse the network and find out attractors or cycles.

# Algortihm #

A very basic and fast algorithm is used to calculate the graph and hence the attractors.
  * First a set of initial random states are generated.
  * For each initial state the successive states are calculated.
  * If at any point a state which has already been visited is found, the iteration for the current state is terminated.
  * If the repeated state was in the current loop instance, then it is assigned as an attractor.

# Display #
The State Transition Graph utilises bui.Graph to display the generated network. The same d3 force layouter is applied to the network. On hovering over a node, the state that the node represents is displayed in an information box. The arrows indicate the next state of the network. Left Clicking a node copies the state represented by the node into the Network graph.