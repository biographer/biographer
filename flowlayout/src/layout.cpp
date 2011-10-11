#include "layout.h"

void Plugins::registerPlugin(unsigned long pgn, plugin_func_ptr pfunc){
   int idx=bitpos(pgn);
   if ((int) pluginlist.size()<idx+1) pluginlist.resize(idx+1);
   pluginlist[idx].pfunc=pfunc;
}
size_t Plugins::size(){
   return pluginlist.size();
}
plugin& Plugins::get(int idx){
   return pluginlist[idx];
}

void Layouter::setStep(int step,unsigned long bitplugins){
   initStep(step);
   int i;
   for (i=0;i<(int) plugins.size();i++){
      if (bitplugins & (1<<i)){
         program[step].actplugins[i]=1.0;
      }
   }
}
void Layouter::initStep(int step){
   if ((int) program.size()<step+1) program.resize(step+1);
   if (program[step].actplugins.size()<plugins.size()) program[step].actplugins.resize(plugins.size());
}
void Layouter::addEndCondition(int step, conditions cond, double param){ // warning: cond should code for only one condition
   initStep(step);
   program[step].end=program[step].end | cond;
   if (cond==iterations){
      program[step].c_iterations=(int) param;
   } else if (cond==relForceDiff){
      program[step].c_relForceDiff=param;
   }
}
void Layouter::execute(){
   int i,s,p;
   int num=nw.nodes.size();
   VP pg_mov;
   VF pg_rot;
   double temp=1.0; // some notion of temperature 1=hot;0=cold; should go rather linear from 1 to 0, which is of course difficult to achieve
   double force,lastForce=-1;
   mov.resize(num);
   int prs=program.size(),pls=plugins.size();
   for (s=0;s<prs;s++){
      int cc=0;
      bool end=false;
      while (!end){
         for (p=0;p<pls;p++){
            pg_mov.assign(num,Point(0,0));
            if (program[s].actplugins[p]==0.0) continue;
            plugins.get(p).pfunc(*this,plugins.get(p),pg_mov,pg_rot,cc,temp);
            for (i=0;i<num;i++){
               mov[i]+=pg_mov[i]*program[s].actplugins[p];
               rot[i]+=pg_rot[i]*program[s].actplugins[p];
               movadd[i]+=fabs(pg_mov[i].x*program[s].actplugins[p]);
               movadd[i]+=fabs(pg_mov[i].y*program[s].actplugins[p]);
               if (maxForce<movadd[i]) maxForce=movadd[i];
            }
            
         }
         force=0.0;
         for (i=0;i<num;i++){
            force+=(fabs(mov[i].x)+fabs(mov[i].y));
            tension[i]=false;
            if (movadd[i]>0.8*maxForce){ // high relative force on node
               if ((fabs(mov[i].x)+fabs(mov[i].y))/movadd[i]<0.1){ // effective force is low compared to added up force (force equilibrium)
                  tension[i]=true;
               }
            }
         }
         if (lastForce<0) lastForce=2*force; //workaround for first loop where lastForce is not yet defined
         if (force!=force) break; // emergency break
         if (force==0) break; // immidiate break
         if (program[s].end & iterations) end=(cc>=program[s].c_iterations);
         if (program[s].end & relForceDiff) end=(fabs(lastForce-force)/force<program[s].c_relForceDiff);
         lastForce=force;
         moveNodes();
      }
   }
}

void Layouter::moveNodes(){
   /*The function moves the nodes to a new position according the the movements (dispalcement vectors)computed, and then set all displacement vectors to 0.
   It also adjustes the default direction of reaction nodes.
   */
   int n=nw.nodes.size();
   for(int i=0;i<n;i++){
      double length=norm(mov[i]);
      if (length>avgsize) mov[i]=mov[i]*(avgsize/length); // limit movement to average node size
         
      nw.nodes[i].x+=mov[i].x; //update position
      nw.nodes[i].y+=mov[i].y; //update position
      mov[i].x=mov[i].y=0.0; //set to zero.
      
      if (rot[i]>0.25*PI) rot[i]=0.25*PI;  // limit rotation
      if (rot[i]<-0.25*PI) rot[i]=-0.25*PI;
      nw.nodes[i].dir=lim(nw.nodes[i].dir+rot[i]); //adjustes default direction.
      rot[i]=0.0; //set to zero.
   }
   
}


   
  
