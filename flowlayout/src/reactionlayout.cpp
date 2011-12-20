#include "layout.h"
#include "plugins.h"
#include "network.h"

void reactionlayout(Layouter& l){
   l.addStep();
   l.stepAddPlugins(P_init_layout, P_limit_mov);
   l.stepAddEndCondition(C_maxMovLimit,0.005);
   
   /*   l.addStep();
   l.stepAddPlugins(P_force_adj, P_distribute_edges);
   l.stepAddEndCondition(C_iterations,5550); // just one iteration to initialize compartments*/
   
   l.addStep();
   l.stepAddPlugins(P_force_adj, P_torque_adj, P_distribute_edges, P_limit_mov);
   l.stepAddEndCondition(C_iterations,1550);
   
   l.addStep();
   l.stepAddPlugins(P_force_adj, P_torque_adj, P_distribute_edges, P_min_edge_crossing, P_min_edge_crossing_multi, P_limit_mov);
   l.stepPluginScale(P_min_edge_crossing, 0.1);
   l.stepPluginScale(P_min_edge_crossing_multi, 0.1);
   l.stepAddEndCondition(C_iterations,1550);
   
   l.addStep();
   l.stepAddPlugins(P_force_adj, P_adjust_compartments, P_force_compartments, P_limit_mov);
   l.stepAddEndCondition(C_relForceDiff,0.005);
   l.stepAddEndCondition(C_temp,10);
   
   l.addStep();
   l.stepAddPlugins(P_fix_compartments);
   l.stepAddEndCondition(C_iterations,1);
   
   l.addStep();
   l.stepAddPlugins(P_force_adj, P_torque_adj, P_distribute_edges, P_min_edge_crossing, P_min_edge_crossing_multi, P_adjust_compartments_fixed, P_force_compartments, P_limit_mov);
   l.stepPluginScale(P_min_edge_crossing, 0.1);
   l.stepPluginScale(P_min_edge_crossing_multi, 0.1);
   l.stepAddEndCondition(C_iterations,1550);
   
   l.addStep();
   l.stepAddPlugins(P_force_adj, P_torque_adj, P_distribute_edges, P_min_edge_crossing, P_min_edge_crossing_multi, P_adjust_compartments_fixed, 
                    P_force_compartments, P_separate_nodes, P_limit_mov, P_node_collision);
   l.stepPluginScale(P_min_edge_crossing, 0.1);
   l.stepPluginScale(P_min_edge_crossing_multi, 0.1);
   l.stepAddEndCondition(C_iterations,1550);
                    
   l.execute();
   
}
