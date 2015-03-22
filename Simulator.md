# Simulator #

The simulator extends the biographer visualizer to also simulate the displayed networks.

The simulator should run independently of any server. For the simulation of SBML files the biographer server is required. The simulator uses a lot of HTML5 technologies to help make the application offline. So please use the latest version of Chrome/Firefox or any other standards compliant browser. It utilises the jQuery, jQuery UI, biographer-ui and libSBGN.js libraries.

A downloadable offline version of the simulator can be found in the [Download section](http://code.google.com/p/biographer/downloads/list).

A public server for the simulator is up at http://rumo.biologie.hu-berlin.de/simulator.

## Code ##
... can be found in the [simulator repository](http://code.google.com/p/biographer/source/browse?repo=simulator). To build and install the software yourself please go through the README file in the root folder of the repository

## Workflow ##
  1. The user imports a model from any of the supported formats
  1. A default layout is generated
  1. The user assigns initial states by clicking the nodes
  1. The user can modify the layout of the graph by dragging the nodes/edges
  1. Simulation is started and can be stopped / resumed any time

## Requirements ##

| **OS** | **Browser** | **Can run this simulator** |
|:-------|:------------|:---------------------------|
| Linux/Windows | Chromium, recent versions | Yes |
| Linux | Chromium 6.0 | Yes, except arrows & moving nodes |
| Linux | Iceweasel (Firefox) 3.5.16 | No |
| Windows | Firefox 1.5.0.12 | Yes? |
| Windows | Internet Explorer 6.0.29 | No |