#include "layout.h"
#include "plugins.h"
#include "network.h"

void reactionlayout(Layouter& l){
   l.addStep();
   l.addPlugins(P_init_layout, P_limit_mov);
   l.addEndCondition(C_maxMovLimit,0.005);
   l.addEndCondition(C_iterations,1550);
    
   l.addStep();
//   l.addPlugins(P_force_adj, P_torque_adj, P_distribute_edges, P_limit_mov);
   l.addPlugins(P_force_adj, P_torque_adj, P_limit_mov);
   l.addEndCondition(C_avgMovLimit,0.005);
   l.addEndCondition(C_iterations,1550);
   
   l.addStep();
   l.addPlugins(P_force_adj, P_expand, P_limit_mov);
   l.pluginScale(P_force_adj, 10);
   l.pluginScale(P_expand, 1.0/l.nw.nodes.size());
   l.addEndCondition(C_avgMovLimit,0.05);
   l.addEndCondition(C_relForceDiff,0.005);
   l.addEndCondition(C_iterations,500);
   
   l.addStep();
//   l.addPlugins(P_force_adj, P_torque_adj, P_distribute_edges, P_min_edge_crossing_multi, P_limit_mov);
   l.addPlugins(P_force_adj, P_torque_adj, P_limit_mov);
   l.addEndCondition(C_avgMovLimit,0.005);
//   l.pluginScale(P_min_edge_crossing_multi, 0.1);
   l.addEndCondition(C_iterations,1550);

   l.addStep();
   l.addPlugins(P_rotate);
   l.addEndCondition(C_iterations,1);
   
   l.addStep();
   l.addPlugins(P_adjust_compartments, P_rotate);
   l.addEndCondition(C_iterations,1);

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
   l.addEndCondition(C_avgMovLimit,0.05);
   l.addEndCondition(C_temp,3);
   l.addEndCondition(C_iterations,100);

  
   l.addStep();
   l.addPlugins(P_force_compartments);
   l.fixPluginTemp(P_force_compartments,0);
   l.addEndCondition(C_iterations,1);
   
   l.addStep();
   l.addPlugins(P_force_adj, P_force_nadj, P_torque_adj, P_distribute_edges, P_min_edge_crossing_multi, P_adjust_compartments_fixed, 
                    P_force_compartments, P_limit_mov);
   l.addEndCondition(C_relForceDiff,0.005);
   l.addEndCondition(C_temp,10);
   //l.pluginScale(P_min_edge_crossing_multi, 0.1);
   //l.pluginScale(P_force_compartments, 10);
   l.addEndCondition(C_iterations,550);
   
   l.addStep();
   l.addPlugins(P_force_adj, P_force_nadj, P_torque_adj, P_distribute_edges, P_min_edge_crossing_multi, P_adjust_compartments_fixed, 
                    P_force_compartments, P_limit_mov, P_node_collision);
   //l.pluginScale(P_min_edge_crossing_multi, 0.1);
   //l.pluginScale(P_force_compartments, 10);
   l.addEndCondition(C_maxMovLimit,0.005);
   l.addEndCondition(C_iterations,550);

   
   l.addStep();
   l.addPlugins(P_force_adj, P_force_nadj, P_torque_adj, P_distribute_edges, P_min_edge_crossing_multi, 
                P_force_compartments, P_compartment_collision, P_node_collision);
   //l.pluginScale(P_min_edge_crossing_multi, 0.1);
   l.addEndCondition(C_maxMovLimit,0.005);
   l.pluginScale(P_force_adj, 0.5);
   l.fixPluginTemp(P_force_compartments,0);
   //l.pluginScale(P_force_compartments, 10);
   l.addEndCondition(C_iterations,550);

   l.addStep();
   l.addPlugins(P_route_edges);
   l.addEndCondition(C_iterations,1);
  
   l.execute();
   
}
