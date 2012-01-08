#include "layout.h"
#include "plugins.h"
#include "network.h"

void reactionlayout(Layouter& l){
   l.addStep();
   l.addPlugins(P_init_layout, P_limit_mov);
   l.addEndCondition(C_maxMovLimit,0.005);

/*   l.addStep();
   l.addPlugins(P_force_adj, P_distribute_edges);
   l.addEndCondition(C_iterations,5550); // just one iteration to initialize compartments*/
   
   l.addStep();
   l.addPlugins(P_force_adj, P_torque_adj, P_distribute_edges, P_limit_mov);
   l.addEndCondition(C_iterations,1550);
   
   l.addStep();
   l.addPlugins(P_force_adj, P_expand, P_limit_mov);
   l.pluginScale(P_force_adj, 10);
   l.pluginScale(P_expand, 1.0/l.nw.nodes.size());
   l.addEndCondition(C_iterations,50);
   
   l.addStep();
   l.addPlugins(P_force_adj, P_torque_adj, P_distribute_edges, P_min_edge_crossing, P_min_edge_crossing_multi, P_limit_mov);
   l.pluginScale(P_min_edge_crossing, 0.1);
   l.pluginScale(P_min_edge_crossing_multi, 0.1);
   l.addEndCondition(C_iterations,1550);
   
   l.addStep();
   l.addPlugins(P_force_adj, P_adjust_compartments, P_force_compartments, P_limit_mov);
   l.addEndCondition(C_relForceDiff,0.005);
   l.addEndCondition(C_temp,10);
   l.addEndCondition(C_iterations,1550);
   
   l.addStep();
   l.addPlugins(P_fix_compartments);
   l.addEndCondition(C_iterations,1);
   
   l.addStep();
   l.addPlugins(P_force_adj, P_adjust_compartments_fixed, P_force_compartments, P_expand, P_limit_mov);
   l.pluginScale(P_force_adj, 10);
   l.fixPluginTemp(P_force_compartments,0);
   l.pluginScale(P_expand, 1.0/l.nw.nodes.size());
   l.addEndCondition(C_iterations,50);

   l.addStep();
   l.addPlugins(P_force_compartments);
   l.fixPluginTemp(P_force_compartments,0);
   l.addEndCondition(C_iterations,1);
   
   l.addStep();
   l.addPlugins(P_force_adj, P_force_nadj, P_torque_adj, P_distribute_edges, P_min_edge_crossing, P_min_edge_crossing_multi, P_adjust_compartments_fixed, 
                    P_force_compartments, P_limit_mov, P_node_collision);
   l.pluginScale(P_min_edge_crossing, 0.1);
   l.pluginScale(P_min_edge_crossing_multi, 0.1);
   //l.pluginScale(P_force_compartments, 10);
   l.addEndCondition(C_iterations,550);

   l.addStep();
   l.addPlugins(P_force_adj, P_force_nadj, P_torque_adj, P_distribute_edges, P_min_edge_crossing, P_min_edge_crossing_multi, P_adjust_compartments_fixed, 
                    P_compartment_collision, P_node_collision);
   l.pluginScale(P_min_edge_crossing, 0.1);
   l.pluginScale(P_min_edge_crossing_multi, 0.1);
   //l.pluginScale(P_force_compartments, 10);
   l.addEndCondition(C_iterations,550);

   l.addStep();
   l.addPlugins(P_route_edges);
   l.addEndCondition(C_iterations,1);
  
   l.execute();
   
}
