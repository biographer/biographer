#ifndef th_layout_h
#define th_layout_h
#include "network.h"
#include "functions.h"
#include "plugins.h"
enum plugins {
   init=1<<0,init_swap=1<<1,init_wComp=1<<2,adjForce=1<<3,nadjForc=1<<4,adjTorque=1<<5,checkCompartment=1<<6,adjustCompartment=1<<7,avoidOverlap=1<<8
};
enum conditions{
   iterations=1<<0,relForceDiff=1<<1
};
class Layouter;

struct plugin;
typedef void (*plugin_func_ptr)(Layouter &state,plugin& pg, VP &mov, VF &rot,int round,double temp);
struct plugin{
   plugin_func_ptr pfunc;
   VP last;
   void* persist;
};
class Plugins{
   public:
      Plugins(){} // expects number of nodes in network
      void registerPlugin(unsigned long pgn, plugin_func_ptr pfunc);
      size_t size();
      plugin& get(int idx);
   private:
      vector<plugin> pluginlist;
};

struct step{
   VF actplugins;
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
      void setStep(int step,unsigned long bitplugins);
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