#ifndef th_plugins_h
#define th_plugins_h
#include "types.h"

#define inf 1e50
#define zero 1e-12
#define err 1e-4
#define stop 1
#define factor (1/10)
enum enumP {
   //   init=1<<0,init_swap=1<<1,init_wComp=1<<2,adjForce=1<<3,nadjForc=1<<4,adjTorque=1<<5,checkCompartment=1<<6,adjustCompartment=1<<7,avoidOverlap=1<<8
   P_force_adj=1, P_torque_adj, P_force_nadj, P_separate_nodes, P_force_compartments, P_distribute_edges, P_adjust_compartments, P_init_layout
};

class Layouter;

struct plugin;
typedef void (*plugin_func_ptr)(Layouter &state,plugin& pg, double scale, int iter, double temp); // for callback of the plugins
struct plugin{
   plugin_func_ptr pfunc;
   //   VP last;
   void* persist;
   bool mod_mov,mod_rot;
};
class Plugins{
   public:
      Plugins(){} 
      void registerPlugin(enumP pgn, plugin_func_ptr pfunc, void* persist=NULL);
      size_t size();
      plugin& get(int idx);
   private:
      vector<plugin> pluginlist;
};

Plugins& register_plugins();
void force_adj(Layouter &state,plugin& pg, double scale, int iter, double temp);
void torque_adj(Layouter &state,plugin& pg, double scale, int iter, double temp);
void force_nadj(Layouter &state,plugin& pg, double scale, int iter, double temp);
void separate_nodes(Layouter &state,plugin& pg, double scale, int iter, double temp);
void force_compartments(Layouter &state,plugin& pg, double scale, int iter, double temp);
void distribute_edges(Layouter &state,plugin& pg, double scale, int iter, double temp);
void adjust_compartments(Layouter &state,plugin& pg, double scale, int iter, double temp);
void init_layout(Layouter &state,plugin& pg, double scale, int iter, double temp);
void swap_reactants(Layouter &state,plugin& pg, double scale, int iter, double temp);
#endif