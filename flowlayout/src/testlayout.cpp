#include "layout.h"
#include "plugins.h"
#include "network.h"
#include "netdisplay.h"
#include <stdio.h>

int main(int argc,char *argv[]){
   //freopen("newdata.txt","r",stdin);
   //freopen("summary.txt","w",stdout);
   Network nw=Network();
   int shiftcmd=0;
   bool showProgress=false;
   if (!strcmp(argv[1],"-p")){ // parameter for showing progress
      shiftcmd++;
      showProgress=true;
   }
   if (argc>=2+shiftcmd){
      nw.read(argv[1+shiftcmd]);
   } else {
      nw.read();
   }   
   nw.dump();
   Plugins& pgs=register_plugins();
   Layouter l(nw,pgs);

   l.addStep();
   l.stepAddPlugins(P_init_layout, P_limit_mov);
   l.stepAddEndCondition(C_maxMovLimit,0.005);

/*   l.addStep();
   l.stepAddPlugins(P_force_adj, P_distribute_edges);
   l.stepAddEndCondition(C_iterations,5550); // just one iteration to initialize compartments*/
   
   l.addStep();
   l.stepAddPlugins(P_force_adj, P_torque_adj, P_distribute_edges, P_limit_mov);
   l.stepAddEndCondition(C_iterations,1550); // just one iteration to initialize compartments

   l.addStep();
   l.stepAddPlugins(P_force_adj, P_torque_adj, P_distribute_edges, P_min_edge_crossing, P_min_edge_crossing_multi, P_limit_mov);
   l.stepPluginScale(P_min_edge_crossing, 0.1);
   l.stepPluginScale(P_min_edge_crossing_multi, 0.1);
   l.stepAddEndCondition(C_iterations,1550); // just one iteration to initialize compartments

   
   l.addStep();
   l.stepAddPlugins(P_force_adj, P_torque_adj, P_distribute_edges, P_min_edge_crossing, P_min_edge_crossing_multi, P_force_nadj, P_limit_mov);
   l.stepPluginScale(P_min_edge_crossing, 0.1);
   l.stepPluginScale(P_min_edge_crossing_multi, 0.1);
   l.stepAddEndCondition(C_iterations,1550); // just one iteration to initialize compartments
   
   l.addStep();
   l.stepAddPlugins(P_force_adj, P_torque_adj, P_distribute_edges, P_min_edge_crossing, P_min_edge_crossing_multi, P_separate_nodes, P_limit_mov, P_node_collision);
   l.stepPluginScale(P_min_edge_crossing, 0.1);
   l.stepPluginScale(P_min_edge_crossing_multi, 0.1);
   l.stepAddEndCondition(C_iterations,1550); // just one iteration to initialize compartments

   l.addStep();
   l.stepAddPlugins(P_force_adj, P_torque_adj, P_distribute_edges, P_min_edge_crossing, P_min_edge_crossing_multi, P_limit_mov, P_node_collision);
   l.stepPluginScale(P_min_edge_crossing, 0.1);
   l.stepPluginScale(P_min_edge_crossing_multi, 0.1);
   l.stepAddEndCondition(C_iterations,1550); // just one iteration to initialize compartments

   /*   l.addStep();
   l.stepAddPlugin(P_adjust_compartments);
   l.stepAddEndCondition(C_iterations,1); // just one iteration to initialize compartments
   
   l.addStep();
   l.stepAddPlugins(P_force_adj, P_torque_adj, P_min_edge_crossing);
//   l.stepAddPlugins(P_force_adj, P_torque_adj, P_adjust_compartments,P_force_compartments, P_min_edge_crossing);
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
   l.stepAddEndCondition(C_temp,10);*/
   
   //l.addStep();
   /*   l.stepAddPlugins(P_force_adj, P_torque_adj, P_force_nadj, P_adjust_compartments,P_force_compartments, P_separate_nodes);
   l.stepAddPlugin(P_distribute_edges, 0.25);
   //   l.stepAddPlugins(P_force_adj, P_torque_adj, P_distribute_edges, P_adjust_compartments,P_force_compartments);
   l.stepAddEndCondition(C_relForceDiff,0.005);
   l.stepAddEndCondition(C_totForceInc,3);
   l.stepAddEndCondition(C_temp,10);*/

   l.execute();

   printf("finished. [press key]\n");
   getc(stdin);
   
   return 0;
   
}
