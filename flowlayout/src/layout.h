#ifndef th_layout_h
#define th_layout_h
#include "network.h"
#include "functions.h"
#include "plugins.h"
enum enumP {
//   init=1<<0,init_swap=1<<1,init_wComp=1<<2,adjForce=1<<3,nadjForc=1<<4,adjTorque=1<<5,checkCompartment=1<<6,adjustCompartment=1<<7,avoidOverlap=1<<8
   init=1,init_swap,init_wComp,adjForce,nadjForc,adjTorque,checkCompartment,adjustCompartment,avoidOverlap
};
enum conditions{
   iterations=1<<0,relForceDiff=1<<1
};
class Layouter;

struct plugin;
typedef void (*plugin_func_ptr)(Layouter &state,plugin& pg, VP &mov, VF &rot,int round,double temp);
struct plugin{
   plugin_func_ptr pfunc;
//   VP last;
   void* persist;
   bool mod_mov,mod_rot;
};
class Plugins{
   public:
      Plugins(){} // expects number of nodes in network
      void registerPlugin(enumP pgn, plugin_func_ptr pfunc, bool mod_mov=true, bool mod_rot=false, void* persist=NULL);
      size_t size();
      plugin& get(int idx);
   private:
      vector<plugin> pluginlist;
};

struct step{
   VI actplugins;
   VF scales;
   unsigned long end;
   int c_iterations;
   int c_relForceDiff;
};

class Layouter{
   public:
      Layouter(Network& _nw,Plugins& _pgs):nw(_nw), plugins(_pgs){
         mov.resize(nw.nodes.size());
         movadd.resize(nw.nodes.size());
         avgsize=avg_sizes(nw);
         get_ideal_distances(nw,dij);
         get_degrees(nw,deg);
      }
      void stepAddPlugins(int step,enumP pg, enumP pg2=(enumP)0, enumP pg3=(enumP)0, enumP pg4=(enumP)0, enumP pg5=(enumP)0, enumP pg6=(enumP)0, enumP pg7=(enumP)0, enumP pg8=(enumP)0, enumP pg9=(enumP)0, enumP pg10=(enumP)0);
      void stepAddPlugin(int step,enumP pg, double scale=1.0);
      void addEndCondition(int step, conditions cond, double param);
      void execute();
      Network& nw;
      VP mov;
      VF movadd;
      VF rot;
      VF dij;
      VI deg;
      vector<bool> tension;
      double avgsize;
   protected:
      Plugins& plugins;
      void initStep(int step);
      void moveNodes();
      double maxForce;
      vector<step> program;
};
#endif