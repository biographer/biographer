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
      step():endc(0){}
      VI actplugins;
      VF scales;
      VF temps;
      unsigned long endc;
      int c_iterations;
      double c_relForceDiff;
      int c_tempSteps;
      double c_relMovLimit;
      double c_maxMovLimit;
      int c_totForceInc;
      int c_totForceIncCC;
};
class Layouter{
   public:
      Layouter(Network& _nw,Plugins& _pgs);
      void stepAddPlugins(int step,enumP pg, enumP pg2=(enumP)0, enumP pg3=(enumP)0, enumP pg4=(enumP)0, enumP pg5=(enumP)0, enumP pg6=(enumP)0, enumP pg7=(enumP)0, enumP pg8=(enumP)0, enumP pg9=(enumP)0, enumP pg10=(enumP)0, enumP pg11=(enumP)0, enumP pg12=(enumP)0, enumP pg13=(enumP)0, enumP pg14=(enumP)0, enumP pg15=(enumP)0);
      void addPlugins(enumP pg, enumP pg2=(enumP)0, enumP pg3=(enumP)0, enumP pg4=(enumP)0, enumP pg5=(enumP)0, enumP pg6=(enumP)0, enumP pg7=(enumP)0, enumP pg8=(enumP)0, enumP pg9=(enumP)0, enumP pg10=(enumP)0, enumP pg11=(enumP)0, enumP pg12=(enumP)0, enumP pg13=(enumP)0, enumP pg14=(enumP)0, enumP pg15=(enumP)0);
      void stepAddPlugin(int step,enumP pg, double scale=1.0);
      void addPlugin(enumP pg, double scale=1.0);
      void stepAddEndCondition(int step, conditions cond, double param=NULL, double param2=NULL);
      void addEndCondition(conditions cond, double param=NULL, double param2=NULL);
      void stepPluginScale(int step, enumP pg,double scale);
      void pluginScale(enumP pg,double scale);
      void fixPluginTemp(enumP pg,double temp);
      void stepFixPluginTemp(int step, enumP pg,double temp);
      void addStep();
      void execute();
      Network& nw;
      VP mov;
      VF force;
      VF dij;
      VI deg;
      vector<bool> tension;
      bool dodebug[P_count-1];
#ifdef SHOWPROGRESS
      vector<vector<forcevec> > debug;
      void show_network(bool wait=false);
#endif
      double avgsize;
      int progress_step;
      bool show_progress;
   protected:
      Plugins& plugins;
      void initStep(int step);
      void moveNodes();
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