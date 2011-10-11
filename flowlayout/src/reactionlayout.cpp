#include "layout.h"
#include "plugins.h"
#include "network.h"

void reactionlayout(Network& nw){
   Plugins& pgs=register_plugins();
   Layouter l(nw,pgs);
   l.stepAddPlugin(0,P_init_layout);
   l.addEndCondition(0,relForceDiff,0.004);
   
   l.execute();
}
