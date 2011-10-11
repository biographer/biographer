#include "layout.h"

void Layouter::stepAddPlugin(int step,enumP pg, double scale){
   initStep(step);
   program[step].actplugins.push_back((int)pg);
   program[step].scales.push_back(scale);
}
void Layouter::stepAddPlugins(int step,enumP pg1, enumP pg2, enumP pg3, enumP pg4, enumP pg5, enumP pg6, enumP pg7, enumP pg8, enumP pg9, enumP pg10){ // this provides a way to add up to 10 enumP at once
   if (pg1) stepAddPlugin(step,pg1);
   if (pg2) stepAddPlugin(step,pg2);
   if (pg3) stepAddPlugin(step,pg3);
   if (pg4) stepAddPlugin(step,pg4);
   if (pg5) stepAddPlugin(step,pg5);
   if (pg6) stepAddPlugin(step,pg6);
   if (pg7) stepAddPlugin(step,pg7);
   if (pg8) stepAddPlugin(step,pg8);
   if (pg9) stepAddPlugin(step,pg9);
   if (pg10) stepAddPlugin(step,pg10);
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
   int prs=program.size();
   for (s=0;s<prs;s++){
      int cc=0;
      bool end=false;
      int pls=program[s].actplugins.size();
      while (!end){
         for (p=0;p<pls;p++){
            int pidx=program[s].actplugins[p];
            plugin &pg=plugins.get(pidx);
            pg_mov.assign(num,Point(0,0));
            pg.pfunc(*this,pg,pg_mov,pg_rot,cc,temp);
            for (i=0;i<num;i++){
               if (pg.mod_mov) {
                  mov[i]+=pg_mov[i]*program[s].actplugins[pidx];
                  movadd[i]+=fabs(pg_mov[i].x*program[s].actplugins[pidx]);
                  movadd[i]+=fabs(pg_mov[i].y*program[s].actplugins[pidx]);
                  if (maxForce<movadd[i]) maxForce=movadd[i];
               }
               if (pg.mod_rot) rot[i]+=pg_rot[i]*program[s].actplugins[pidx];
            }
            
         }
         force=0.0;
         for (i=0;i<num;i++){
            force+=(fabs(mov[i].x)+fabs(mov[i].y));
            force+=rot[i];
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
         if (show_progress && (cc>0 | s>0)) showProgress(cc);
         cc++;
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

void Layouter::showProgress(int cc){ // this is certainly highly system dependent!!!!
#ifdef PROGRESSLINUX
   if (!show_progress) return;
   if (cc%progress_step) return; // show only every progress_step iterations
   char[30] infile
   sprintf(infile,"/tmp/progress%di.dat",getpid());
   nw.write(infile);
   char outfile[30];
   sprintf(outfile,"/tmp/progress%d.dat",getpid());
   nw.dumpNodes(outfile); // dump nodes to outfile
   char pngfile[30];
   sprintf(pngfile,"/tmp/progress%d.png",getpid());
   //infile is Network member
   // generating graph layout
   int cpid;
   if ((cpid=fork())==0) { // child process ; note, this queues up a lot of calls
      execl("/usr/bin/perl","/usr/bin/perl","/local/home/handorf/hg/biographer-layout/perl/visLayout3.pl",infile,outfile,pngfile,NULL);
   }
   waitpid(cpid,NULL,0); // wait for layout to complete
   // forking viewer

   sleep(1); // SLOW DOWN!!!

   if (!forked_viewer){ // this only happens the first time
      forked_viewer=true;
      if (!fork()) { // child process
         // call viewer
         printf("calling viewer..\n");
         execl("/usr/bin/display","/usr/bin/display","-update","1",pngfile,NULL); 
         printf("displaying %s\n",pngfile);
         // this never returns
      }
   }
#endif
}

   
  
