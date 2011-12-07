#include "layout.h"
#include "plugins.h"
#include "network.h"

void reactionlayout(Layouter& l){
   l.addStep();
   l.stepAddPlugin(P_init_layout);
   l.stepAddEndCondition(C_maxMovLimit,0.005);
   l.stepLimitMov(false);

   l.addStep();
   l.stepAddPlugins(P_force_adj, P_torque_adj, P_distribute_edges, P_min_edge_crossing);
   //   l.stepAddPlugins(P_force_adj, P_torque_adj, P_distribute_edges, P_adjust_compartments,P_force_compartments);
/*   l.stepAddEndCondition(C_maxMovLimit,0.005);
   l.stepAddEndCondition(C_totForceInc,10);*/
   l.stepAddEndCondition(C_iterations,250); // just one iteration to initialize compartments
   //   l.stepAddEndCondition(C_relForceDiff,0.0005);
   
   l.addStep();
   l.stepAddPlugin(P_adjust_compartments);
   l.stepAddEndCondition(C_iterations,1); // just one iteration to initialize compartments
   
   l.addStep();
   l.stepAddPlugins(P_force_adj, P_torque_adj, P_adjust_compartments,P_force_compartments, P_min_edge_crossing);
//   l.stepAddPlugins(P_force_adj, P_torque_adj, P_distribute_edges, P_adjust_compartments,P_force_compartments);
   l.stepAddEndCondition(C_relForceDiff,0.0005);
   l.stepAddEndCondition(C_temp,10);
   //   l.stepAddEndCondition(C_totForceInc,3);
   
   l.addStep();
   l.stepAddPlugins(P_force_adj, P_torque_adj, P_adjust_compartments,P_force_compartments, P_separate_nodes, P_min_edge_crossing);
   l.stepAddPlugin(P_distribute_edges, 0.25);
   //   l.stepAddPlugins(P_force_adj, P_torque_adj, P_distribute_edges, P_adjust_compartments,P_force_compartments);
   l.stepAddEndCondition(C_relForceDiff,0.005);
   l.stepAddEndCondition(C_totForceInc,3);
   l.stepAddEndCondition(C_temp,10);
   
   //l.addStep();
   /*   l.stepAddPlugins(P_force_adj, P_torque_adj, P_force_nadj, P_adjust_compartments,P_force_compartments, P_separate_nodes);
   l.stepAddPlugin(P_distribute_edges, 0.25);
   //   l.stepAddPlugins(P_force_adj, P_torque_adj, P_distribute_edges, P_adjust_compartments,P_force_compartments);
   l.stepAddEndCondition(C_relForceDiff,0.005);
   l.stepAddEndCondition(C_totForceInc,3);
   l.stepAddEndCondition(C_temp,10);*/

   l.execute();
   
}
