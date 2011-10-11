#include "layout.h"
#include "plugins.h"
#include "network.h"

void reactionlayout(Layouter& l){
   l.stepAddPlugin(0,P_init_layout);
   l.stepAddEndCondition(0,relForceDiff,0.0005);
   l.stepLimitMov(0,false);
   l.execute();
}
