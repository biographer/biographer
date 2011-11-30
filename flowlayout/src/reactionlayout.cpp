#include "layout.h"
#include "plugins.h"
#include "network.h"

void reactionlayout(Layouter& l){
   l.stepAddPlugin(0,P_init_layout);
   l.stepAddEndCondition(0,C_relForceDiff,0.0005);
   l.stepLimitMov(0,false);

   l.stepAddPlugin(1,P_adjust_compartments);
   l.stepAddEndCondition(1,C_iterations,1); // just one iteration to initialize compartments
   
   l.stepAddPlugins(2,P_force_adj, P_torque_adj, P_distribute_edges, P_adjust_compartments,P_force_compartments);
   l.stepAddEndCondition(1,C_relForceDiff,0.005);
   l.execute();
   
}
