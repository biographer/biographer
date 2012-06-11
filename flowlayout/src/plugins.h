#ifndef th_plugins_h
#define th_plugins_h
#include "types.h"

enum enumP {
   P_force_adj=1, P_force_adj_strong, P_torque_adj, P_force_nadj, P_expand, P_separate_nodes, P_force_compartments, P_fix_compartments, P_distribute_edges, 
   P_adjust_compartments, P_adjust_compartments_fixed, P_push_components, P_init_layout, P_min_edge_crossing, P_min_edge_crossing_multi, P_limit_mov, 
   P_node_collision, P_compartment_collision, P_rotate, P_stack_rotate, P_unfix_all, 
   P_route_edges,P_route_edges2,
   P_count // Note: P_count is just for retrieving the number of plugins; must be the last one
};
enum enumPT {
   T_mov=1, T_pos, T_limit,
   T_count
};
class Layouter;

struct plugin;
typedef void (*plugin_func_ptr)(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug); // for callback of the plugins
struct plugin{
   plugin_func_ptr pfunc;
   //   VP last;
   void* persist;
   enumPT type;
   string name;
};
class Plugins{
   public:
      Plugins(){} 
      void registerPlugin(enumP pgn, string name, plugin_func_ptr pfunc, enumPT type=T_mov, void* persist=NULL);
      size_t size();
      plugin& get(int idx);
   private:
      vector<plugin> pluginlist;
};

Plugins& register_plugins();
void force_adj(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void force_adj_strong(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void torque_adj(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void force_nadj(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void separate_nodes(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void force_compartments(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void distribute_edges(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void adjust_compartments(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void fix_compartments(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void adjust_compartments_fixed(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void init_layout(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void push_components(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void swap_reactants(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void min_edge_crossing(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void min_edge_crossing_multi(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void limit_mov(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void node_collision(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void compartment_collision(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void route_edges(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void route_edges2(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void expand(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void rotate(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void stack_rotate(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
void unfix_all(Layouter &state,plugin& pg, double scale, int iter, double temp, int debug);
#endif