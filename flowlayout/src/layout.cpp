#include "layout.h"
#include "defines.h"

double avg_sizes(Layouter &l);
void get_ideal_distances(Layouter &l,VF &dij);
void get_degrees(Layouter &l,VI &deg);
void domanual(Layouter &l,bool &manual_cont, int &s);
#ifdef SHOWPROGRESS
Layouter::Layouter(Network& _nw,Plugins& _pgs):nw(_nw), debug(vector<vector<forcevec> >(nw.nodes.size())), plugins(_pgs), nd(NetDisplay(_nw,debug)){
#else
Layouter::Layouter(Network& _nw,Plugins& _pgs):nw(_nw), plugins(_pgs){
#endif
/* create a Layouter object */
   show_progress=false;
   progress_step=1;
   forked_viewer=false;
   int i;
#ifdef SHOWPROGRESS
   nd.waitKeyPress=true;
   for (i=0;i<P_count-1;i++){
      dodebug[i]=true;
   }
#else
   for (i=0;i<P_count-1;i++){
      dodebug[i]=false;
   }
#endif
}
void Layouter::init(){
//   rot.resize(nw.nodes.size());
   tension.resize(nw.nodes.size());
   mov.resize(nw.nodes.size());
   force.resize(nw.nodes.size());
#ifdef SHOWPROGRESS
   debug.resize(nw.nodes.size());
#endif 
   avgsize=avg_sizes(*this);
   get_ideal_distances(*this,dij);
   get_degrees(*this,deg);
}
void Layouter::addStep(){ // adds one more step to the program
   initStep(program.size());
}
void Layouter::addPlugin(enumP pg, double scale){
   stepAddPlugin(program.size()-1,pg,scale);
}
void Layouter::stepAddPlugin(int step,enumP pg, double scale){
   /* adds a plugin to a step of the layout algorithm */
   initStep(step);
   program[step].actplugins.push_back((int)pg);
   program[step].scales.push_back(scale);
   program[step].temps.push_back(-1);
   
}
void Layouter::addPlugins(enumP pg1, enumP pg2, enumP pg3, enumP pg4, enumP pg5, enumP pg6, enumP pg7, enumP pg8, enumP pg9, 
                          enumP pg10, enumP pg11, enumP pg12, enumP pg13, enumP pg14, enumP pg15){ // this provides a way to add up to 10 enumP at once
stepAddPlugins(program.size()-1,pg1,pg2,pg3,pg4,pg5,pg6,pg7,pg8,pg9,pg10, pg11, pg12, pg13, pg14, pg15); 
}
void Layouter::stepAddPlugins(int step,enumP pg1, enumP pg2, enumP pg3, enumP pg4, enumP pg5, enumP pg6, enumP pg7, enumP pg8, enumP pg9, enumP pg10, enumP pg11, enumP pg12, enumP pg13, enumP pg14, enumP pg15){ // this provides a way to add up to 10 enumP at once
   /* can add several plugins at once (if no scale parameter is needed */
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
   if (pg11) stepAddPlugin(step,pg11);
   if (pg12) stepAddPlugin(step,pg12);
   if (pg13) stepAddPlugin(step,pg13);
   if (pg14) stepAddPlugin(step,pg14);
   if (pg15) stepAddPlugin(step,pg15);
}
void Layouter::initStep(int step){
   /* initializes data structure for new step */
   if ((int) program.size()<step+1) program.resize(step+1);
   
}
void Layouter::pluginScale(enumP pg,double scale){
   stepPluginScale(program.size()-1,pg,scale);
}
void Layouter::stepPluginScale(int step, enumP pg,double scale){
   initStep(step);
   const VI &pgns=program[step].actplugins;
   int pos=find(pgns.begin(),pgns.end(),pg)-pgns.begin();
   if (pos==pgns.size()) throw "plugin not found";
   program[step].scales[pos]=scale; // does only find the first plugin (but each one should there only be once)
}
void Layouter::fixPluginTemp(enumP pg,double temp){
   stepFixPluginTemp(program.size()-1,pg,temp);
}
void Layouter::stepFixPluginTemp(int step, enumP pg,double temp){
   initStep(step);
   const VI &pgns=program[step].actplugins;
   int pos=find(pgns.begin(),pgns.end(),pg)-pgns.begin();
   if (pos==pgns.size()) throw "plugin not found";
   program[step].temps[pos]=temp; // does only find the first plugin (but each one should there only be once)
}
void Layouter::addEndCondition(conditions cond, double param, double param2){ // warning: cond should code for only one condition
   stepAddEndCondition(program.size()-1,cond,param,param2);
}
void Layouter::stepAddEndCondition(int step, conditions cond, double param, double param2){ // warning: cond should code for only one condition
   /* adds an end condition for a algorithm step */
   initStep(step);
   program[step].endc=program[step].endc | cond;
   if (cond==C_iterations){ // end condition for a constant number of iterations
      program[step].c_iterations=(int) param;
   } else if (cond==C_relForceDiff){ // end condition for a certain relative change in total force
      program[step].c_relForceDiff=param;
   } else if (cond==C_avgMovLimit){ // end condition for avg movement smaller than avg node size * param1
      program[step].c_avgMovLimit=param;
   } else if (cond==C_maxMovLimit){ // end condition for max movement smaller than avg node size * param1
      program[step].c_maxMovLimit=param;
   } else if (cond==C_totForceInc){ // 
      program[step].c_totForceInc=3*(int) param;
      program[step].c_totForceIncCC=3*(int) param;
   } else if (cond==C_temp){ // end condition "temperature" dependent
      // needs also other end conditions!!!
      // if one of the other conditions is fullfilled temp is decreased until step limit is reached
      program[step].c_tempSteps=(int) param;
   }
}
#ifdef SHOWPROGRESS
void Layouter::show_network(bool wait){
   if (wait) nd.waitKeyPress=true;
   nd.show();
}
#endif
void Layouter::execute(){
   /* executes the layout algorithm 
      all defined steps are executed in sequential order
      each step is iterated until one of its end conditions is fulfilled
   */
   int i,s,p;
   int num=nw.nodes.size();
/*   VP pg_mov;pg_mov.resize(num);
   VF pg_rot;pg_rot  .resize(num);*/
   
   init();
   int prs=program.size();
   int totalcc=0;
   manual_it=0;
   for (s=0;s<prs;s++){
      #ifdef SHOWPROGRESS
      int skip=1;
      nd.waitKeyPress=true;
      if (manual) nd.waitKeyPress=false;
      #endif
      double temp=1.0; // some notion of temperature 1=hot;0=cold; should go rather linear from 1 to 0, which is of course difficult to achieve
      double maxForce,totalForce,maxMov,totalMov,lastForce=-1;
      
      int cc=0;
      bool end=false;
      int pls=program[s].actplugins.size();
      printf("step %d\n",s);
      for (p=0;p<pls;p++){
         printf("%s ",plugins.get(program[s].actplugins[p]).name.c_str());
      }
      printf("\n");
      bool manual_cont=false;
      do {
         while (!end){
            // apply mov plugins
            for (p=0;p<pls;p++){
               int pidx=program[s].actplugins[p];
               plugin &pg=plugins.get(pidx);
               if (pg.type!=T_mov) continue;
   /*            if (pg.mod_mov) pg_mov.assign(num,Point(0.0,0.0));
               if (pg.mod_rot) pg_rot.assign(num,0.0);*/
               double ttemp=(program[s].temps[p]>=0 ? program[s].temps[p] : temp);
               pg.pfunc(*this,pg,program[s].scales[p],cc,ttemp,(dodebug[pidx]? pidx:0));
   /*            for (i=0;i<num;i++){
                  mov[i]+=pg_mov[i]*program[s].scales[p];
                  force[i]+=fabs(pg_mov[i].x*program[s].scales[p]);
                  force[i]+=fabs(pg_mov[i].y*program[s].scales[p]);
   //               if (pg.mod_rot) rot[i]+=pg_rot[i]*program[s].scales[p];
               }*/
               
            }
            // apply limiting plugins   
            for (p=0;p<pls;p++){
               int pidx=program[s].actplugins[p];
               plugin &pg=plugins.get(pidx);
               if (pg.type!=T_limit) continue;
               double ttemp=(program[s].temps[p]>=0 ? program[s].temps[p] : temp);
               pg.pfunc(*this,pg,program[s].scales[p],cc,ttemp,(dodebug[pidx]? pidx:0));
            }
            
            totalForce=0.0;
            totalMov=0.0;
            maxForce=0.0;
            maxMov=0.0;
            for (i=0;i<num;i++){
               if (maxForce<force[i]) maxForce=force[i];
            }
            for (i=0;i<num;i++){ // calculated tension
               totalForce+=force[i];
         if (!nw.nodes[i].fixed){
            double mv=manh(mov[i]);
            totalMov+=mv;
            if (mv>maxMov) maxMov=mv;
         }
               tension[i]=false;
               if (force[i]>0.8*maxForce){ // high relative force on node
                  if (manh(mov[i])/force[i]<0.1){ // effective force is low compared to added up force (force equilibrium)
                     tension[i]=true;
                  }
               }
            }
            //printf("\rstep: %i, it: %i, tot.force: %0.4f, tot.mov: %0.4f, temp: %0.4f, max.force: %0.4f, max.mov: %0.4f, forceIncCC: %d",s,cc,totalForce,totalMov,temp,maxForce,maxMov,program[s].c_totForceIncCC);fflush(stdout);
            if (lastForce<0) lastForce=2*totalForce; //workaround for first loop where lastForce is not yet defined
            if (totalForce!=totalForce) break; // emergency break (nan)
            if (totalMov!=totalMov) break; // emergency break (nan)
            if (lastForce>0 && totalForce==0) break; // immidiate break ( there exist plugins which do not use force at all -> check lastForce)
            if (totalMov==0 && !(program[s].endc & C_iterations)) break; // immidiate break


   #ifdef SHOWPROGRESS
            if ((--skip<=0) && !manual) {
               #ifdef OUTPNG
               char fn[20];
               sprintf(fn,"ani_s%02d_i%04d.png",s,totalcc);
               skip=nd.show(fn);
               #else
               skip=nd.show();
               #endif
            }
            for (i=0;i<num;i++){
               debug[i].clear();
            }
   #endif
            moveNodes();
            
            // apply position changing plugins
            for (p=0;p<pls;p++){
               int pidx=program[s].actplugins[p];
               plugin &pg=plugins.get(pidx);
               if (pg.type!=T_pos) continue;
               double ttemp=(program[s].temps[p]>=0 ? program[s].temps[p] : temp);
               pg.pfunc(*this,pg,program[s].scales[p],cc,ttemp,(dodebug[pidx]? pidx:0));
            }
            
                        
            if (manual){
               end|=(cc>=manual_it); // in manual mode, always do as many iterations as specified
            } else {
               if (program[s].endc & C_iterations) end|=(cc>=program[s].c_iterations); // limited number of iterations
               if (program[s].endc & C_totForceInc) {
                  if (lastForce<totalForce){
                     program[s].c_totForceIncCC-=3;
                  } else {
                     program[s].c_totForceIncCC++;
                     if (program[s].c_totForceIncCC>program[s].c_totForceInc) program[s].c_totForceIncCC=program[s].c_totForceInc;
                  }
                  end|=(program[s].c_totForceIncCC<=0);
               }
               if (program[s].endc & C_relForceDiff) end|=(fabs(lastForce-totalForce)/totalForce<program[s].c_relForceDiff); // relative change in total force
               if (program[s].endc & C_avgMovLimit) end|=(totalMov/num/avgsize<program[s].c_avgMovLimit); //avg movement compared to avg size
               if (program[s].endc & C_maxMovLimit) end|=(maxMov/avgsize<program[s].c_maxMovLimit); //avg movement compared to avg size
                     
               if (end && program[s].endc & C_temp){
                  temp-=1.0/(double)program[s].c_tempSteps;// decrease temperature if one of the other conditions is fullfilled
                  lastForce=-1; // reset 
                  cc=0; // reset
                  program[s].c_totForceIncCC=program[s].c_totForceInc; // reset
                  if (temp>0) end=false;
               }
            }
            lastForce=totalForce;
            if (show_progress && (cc>0 || s>0)) showProgress(cc);
            cc++;
            totalcc++;
         }
         manual_it=cc;
         nd.show();
         if (manual) domanual(*this,manual_cont,s);
         end=false;
      } while (manual_cont);
      printf("\n");
      if (show_progress) showProgress(0);
   }
}

void Layouter::moveNodes(){
   /*The function moves the nodes to a new position according the the movements (dispalcement vectors)computed, and then set all displacement vectors to 0.
   It also adjustes the default direction of reaction nodes.
   */
   int n=nw.nodes.size();
   for(int i=0;i<n;i++){
//      double length=norm(mov[i]);
//      if (limit && length>avgsize) mov[i]=mov[i]*(avgsize/length); // limit movement to average node size
      if (!nw.nodes[i].fixed){
         nw.nodes[i].x+=mov[i].x; //update position
         nw.nodes[i].y+=mov[i].y; //update position
      }
      mov[i].x=mov[i].y=0.0; //set to zero.
      
//      if (rot[i]>0.25*PI) rot[i]=0.25*PI;  // limit rotation
//      if (rot[i]<-0.25*PI) rot[i]=-0.25*PI;
//      nw.nodes[i].dir=lim(nw.nodes[i].dir+rot[i]); //adjustes default direction.
//      rot[i]=0.0; //set to zero.
      
      force[i]=0.0;
   }
   
}

void Layouter::showProgress(int cc){ // this is certainly highly system dependent!!!!
#ifdef PROGRESSLINUX
   if (!show_progress) return;
   if (cc%progress_step) return; // show only every progress_step iterations
   char infile[30];
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

   
double get_dij(Layouter &l,int i, int j){ 
   //ideal distance between adjacent nodes;
   double x=l.nw.nodes[i].width * l.nw.nodes[i].width + l.nw.nodes[i].height * l.nw.nodes[i].height;
   double y=l.nw.nodes[j].width * l.nw.nodes[j].width + l.nw.nodes[j].height * l.nw.nodes[j].height;
   return (sqrt(x)+sqrt(y))*0.5+l.avgsize/2*(log(1+l.nw.degree(i)+l.nw.degree(j))-log(3));
}
void get_ideal_distances(Layouter &l,VF &dij){
   /* This procedure computes the ideal lengths of edges (the ideal distances between adjacent nodes): dij[i],
   */
   int m=l.nw.edges.size(), i,n1,n2;
   dij.resize(m);
   
   for(i=0;i<m;i++){
      //ideal length of edge-i.
      n1=l.nw.edges[i].from;
      n2=l.nw.edges[i].to;
      dij[i]=get_dij(l,n1,n2);
   }
   
}
void get_degrees(Layouter &l,VI &deg){
   int n=l.nw.nodes.size(),i;
   deg.resize(n);
   
   for(i=0;i<n;i++){
      deg[i]=l.nw.degree(i);
   }
      
}
double avg_sizes(Layouter &l){
   int i,n;
   n=l.nw.nodes.size();
   double size=0;
   for(i=0;i<n;i++){
      size+=l.nw.nodes[i].width;
      size+=l.nw.nodes[i].height;
   }
   return size/(2*n);
}
void domanual(Layouter &l,bool &manual_cont, int &s){
   string cmd;
   cout << ">";
   cin >> cmd;
   if (cmd=="n"){
      manual_cont=false;
      l.manual_it=0;
      return;
   } else if (cmd=="c"){
      int iter;
      cin >> iter;
      l.manual_it+=iter;
      manual_cont=true;
      return;
   } else if (cmd=="pc"){
      int idx;
      cin >> idx;
      if (idx<l.nw.compartments.size()) l.nw.compartments[idx].print();
      return domanual(l,manual_cont,s);
   }
   getline(cin,cmd);
}
  
std::vector<std::string> &split(const std::string &s, char delim, std::vector<std::string> &elems) {
   std::stringstream ss(s);
   std::string item;
   while(std::getline(ss, item, delim)) {
      elems.push_back(item);
   }
   return elems;
}


std::vector<std::string> split(const std::string &s, char delim) {
   std::vector<std::string> elems;
   return split(s, delim, elems);
}
  