#ifndef th_plugins_h
#define th_plugins_h
#include "types.h"

enum enumP {
   P_force_adj=1, P_torque_adj, P_force_nadj, P_separate_nodes, P_force_compartments, P_distribute_edges, 
   P_adjust_compartments, P_init_layout, P_min_edge_crossing, P_min_edge_crossing_multi,
   P_count // Note: P_count is just for retrieving the number of plugins; must be the last one
};

class Layouter;

struct plugin;
typedef void (*plugin_func_ptr)(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug); // for callback of the plugins
struct plugin{
   plugin_func_ptr pfunc;
   //   VP last;
   void* persist;
   bool modpos;
   string name;
};
class Plugins{
   public:
      Plugins(){} 
      void registerPlugin(enumP pgn, string name, plugin_func_ptr pfunc, bool modpos=false, void* persist=NULL);
      size_t size();
      plugin& get(int idx);
   private:
      vector<plugin> pluginlist;
};

Plugins& register_plugins();
void force_adj(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void torque_adj(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void force_nadj(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void separate_nodes(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void force_compartments(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void distribute_edges(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void adjust_compartments(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void init_layout(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void swap_reactants(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void min_edge_crossing(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void min_edge_crossing_multi(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
#endif