# Simulating kinetics #

Additionally to a basic Boole'an simulation of networks,
also "real" kinetics shall be simulatable,
allowing for discrete compound concentrations/activities, .

## Simple linear kinetics ##
Development has already started to simulate and visualize linear kinetics of the involved species.
The central simplification is the **reduction of concentrations to percentages** (representing compound concentrations as numbers between 0% and 100%).
Calculation will be carried out in timed steps,
rather than by exact calculations (differential equations).
This procedure represents a mathematical approximation,
which can be justified, since we deal not with a mathematical problem
but a real scenario, in which slight deviations of the precise
math may also be expected from the in vivo system.

## Discriminating orders of magnitude ##
Whenever no detailed information about kinetic constants and math respectively, is known, at least a discrimination of **protein-protein interactions** against **gen-expression** is possible.

States may also be kineticly approximated according to the experimentators experience. E.g. a macroscopic state like "starvation" would have a comparably slow kinetic, since many proteins and genes
are involved in it's recognition, signal transduction
and consequent actions.

## More sophisticated kinetics ##
  1. linear
  1. exponential
  1. Michaelis-Menten
  1. Hill

At first, only linear kinetics will be implemented (in JS), see above.

## Visualization ##
Kinetics require compound concentrations/activities to be calculated
time-dependendly, therefore time-graphs, showing the development of a
compound concentration/activity versus time become possible and useful.

## Import / Export ##
Kinetics are usually simulated using open source tool **Copasi**.
Therefore it would be useful to implement a Copasi importer and exporter.