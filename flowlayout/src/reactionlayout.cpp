#include "layout.h"
#include "plugins.h"
#include "network.h"

void reactionlayout(Layouter& l){
   l.stepAddPlugin(0,P_init_layout);
   l.stepAddEndCondition(0,C_maxMovLimit,0.005);
   l.stepLimitMov(0,false);

   l.stepAddPlugin(1,P_adjust_compartments);
   l.stepAddEndCondition(1,C_iterations,1); // just one iteration to initialize compartments
   
   l.stepAddPlugins(2,P_force_adj, P_torque_adj, P_adjust_compartments,P_force_compartments);
//   l.stepAddPlugins(2,P_force_adj, P_torque_adj, P_distribute_edges, P_adjust_compartments,P_force_compartments);
   l.stepAddEndCondition(2,C_relForceDiff,0.005);

   l.stepAddPlugins(3,P_force_adj, P_torque_adj, P_force_nadj, P_adjust_compartments,P_force_compartments);
   l.stepAddPlugin(3,P_distribute_edges, 0.25);
   //   l.stepAddPlugins(2,P_force_adj, P_torque_adj, P_distribute_edges, P_adjust_compartments,P_force_compartments);
   l.stepAddEndCondition(3,C_relForceDiff,0.005);
   l.stepAddEndCondition(3,C_totForceInc,3);
   l.stepAddEndCondition(3,C_temp,10);

   l.execute();
   
}
