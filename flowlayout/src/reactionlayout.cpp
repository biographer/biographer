#include "layout.h"
#include "plugins.h"
#include "network.h"

void reactionlayout(Layouter& l){
   l.stepAddPlugin(0,P_init_layout);
   l.stepAddEndCondition(0,C_maxMovLimit,0.005);
   l.stepLimitMov(0,false);

   l.stepAddPlugins(1,P_force_adj, P_torque_adj, P_distribute_edges);
   //   l.stepAddPlugins(2,P_force_adj, P_torque_adj, P_distribute_edges, P_adjust_compartments,P_force_compartments);
/*   l.stepAddEndCondition(1,C_maxMovLimit,0.005);
   l.stepAddEndCondition(1,C_totForceInc,10);*/
   l.stepAddEndCondition(1,C_iterations,250); // just one iteration to initialize compartments
   //   l.stepAddEndCondition(1,C_relForceDiff,0.0005);
   
   l.stepAddPlugin(2,P_adjust_compartments);
   l.stepAddEndCondition(2,C_iterations,1); // just one iteration to initialize compartments
   
   l.stepAddPlugins(3,P_force_adj, P_torque_adj, P_adjust_compartments,P_force_compartments);
//   l.stepAddPlugins(2,P_force_adj, P_torque_adj, P_distribute_edges, P_adjust_compartments,P_force_compartments);
   l.stepAddEndCondition(3,C_relForceDiff,0.0005);
   l.stepAddEndCondition(3,C_temp,10);
   //   l.stepAddEndCondition(3,C_totForceInc,3);
   
   l.stepAddPlugins(4,P_force_adj, P_torque_adj, P_adjust_compartments,P_force_compartments, P_separate_nodes);
   l.stepAddPlugin(4,P_distribute_edges, 0.25);
   //   l.stepAddPlugins(2,P_force_adj, P_torque_adj, P_distribute_edges, P_adjust_compartments,P_force_compartments);
   l.stepAddEndCondition(4,C_relForceDiff,0.005);
   l.stepAddEndCondition(4,C_totForceInc,3);
   l.stepAddEndCondition(4,C_temp,10);
   
/*   l.stepAddPlugins(5,P_force_adj, P_torque_adj, P_force_nadj, P_adjust_compartments,P_force_compartments, P_separate_nodes);
   l.stepAddPlugin(5,P_distribute_edges, 0.25);
   //   l.stepAddPlugins(2,P_force_adj, P_torque_adj, P_distribute_edges, P_adjust_compartments,P_force_compartments);
   l.stepAddEndCondition(5,C_relForceDiff,0.005);
   l.stepAddEndCondition(5,C_totForceInc,3);
   l.stepAddEndCondition(5,C_temp,10);*/
   l.execute();
   
}
