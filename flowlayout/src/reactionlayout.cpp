#include "layout.h"
#include "plugins.h"
#include "network.h"

void reactionlayout(Layouter& l){
   l.stepAddPlugin(0,P_init_layout);
   l.addEndCondition(0,relForceDiff,0.004);
   
   l.execute();
}
