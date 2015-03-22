## Further Layouter Development ##

  * edge routing / splines
    * using graphviz to create splines for layouted network
  * google native client support
    * this will reduce load on server
  * improvements in layout for generic graphs
  * code clean up
    * probably plugin style calls of different functions from the main layout function
    * one main loop which calls the different plugins
    * metaprogram == list of modes in which a certain subset of plugins are called
      * modes are run through consecutively
      * mode switch dependent on relaxation or number of steps
    * helper array which are currently in network.h should go in context objects
      * one global context object (node positions, direction etc)
      * plugin contexts (force of plugin, last force, etc)
  * improvements for the network inspection during relaxation
  * stable json import/export
    * get rid of this glib-json -> which library is better?
  * ....