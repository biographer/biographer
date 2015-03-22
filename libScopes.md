#summary SBML simulation using libScopes

# Introduction #

Many a times it so happens that a Boolean Network is not available for a particular set of biochemical reactions. libScopes provides a method of simulating reaction pathways defined in the SBML format.

# libScopes #

This library assigns a state to each chemical, the ones which are relevant to our simulator are present and depleted, some of the additional states like blocking are not yet supported.

Currently only a subset of features of the libScopes library are supported in the simulator.

  * Importing SBML files
  * Applying a Guess Seed
  * Step Simulation
  * Attractor search

Only simple simulations of SBML files are supported, there is no inhibition/activation support, nor any time series insertions/deletions.

The libScopes library has been written in C/C++, hence it had to be run on a server. The interfacing in web2py was done using SWIG for Python. Hence while developing this particular feature there was a side benefit to the libScopes library of getting a Python wrapper.