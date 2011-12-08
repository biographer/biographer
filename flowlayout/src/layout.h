#ifndef th_layout_h
#define th_layout_h
#include "network.h"
#include "functions.h"
#include "plugins.h"
#ifdef SHOWPROGRESS
#include "netdisplay.h"
#endif
enum conditions{
   C_iterations=1<<0,C_relForceDiff=1<<1,C_temp=1<<2,C_relMovLimit=1<<3,C_maxMovLimit=1<<4,C_totForceInc=1<<5
};

class step{
   public:
      step():endc(0),limit_mov(true){}
      VI actplugins;
      VF scales;
      unsigned long endc;
      int c_iterations;
      double c_relForceDiff;
      int c_tempSteps;
      double c_relMovLimit;
      double c_maxMovLimit;
      int c_totForceInc;
      int c_totForceIncCC;
      bool limit_mov;
};
class Layouter{
   public:
      Layouter(Network& _nw,Plugins& _pgs);
      void stepAddPlugins(int step,enumP pg, enumP pg2=(enumP)0, enumP pg3=(enumP)0, enumP pg4=(enumP)0, enumP pg5=(enumP)0, enumP pg6=(enumP)0, enumP pg7=(enumP)0, enumP pg8=(enumP)0, enumP pg9=(enumP)0, enumP pg10=(enumP)0);
      void stepAddPlugins(enumP pg, enumP pg2=(enumP)0, enumP pg3=(enumP)0, enumP pg4=(enumP)0, enumP pg5=(enumP)0, enumP pg6=(enumP)0, enumP pg7=(enumP)0, enumP pg8=(enumP)0, enumP pg9=(enumP)0, enumP pg10=(enumP)0);
      void stepAddPlugin(int step,enumP pg, double scale=1.0);
      void stepAddPlugin(enumP pg, double scale=1.0);
      void stepAddEndCondition(int step, conditions cond, double param=NULL, double param2=NULL);
      void stepAddEndCondition(conditions cond, double param=NULL, double param2=NULL);
      void stepLimitMov(int step, bool limit);
      void stepLimitMov(bool limit);
      void addStep();
      void execute();
      Network& nw;
      VP mov;
      VF force;
      VF dij;
      VI deg;
      vector<bool> tension;
#ifdef SHOWPROGRESS
      vector<vector<forcevec> > debug;
      bool dodebug[P_count-1];
#endif
      double avgsize;
      bool show_progress;
      int progress_step;
   protected:
      Plugins& plugins;
      void initStep(int step);
      void moveNodes(bool limit);
      void init();
      vector<step> program;
      bool forked_viewer;
      void showProgress(int cc);
      
#ifdef SHOWPROGRESS
      NetDisplay nd;
      
#endif
};
double get_dij(Network &nw,int i, int j);
#endif