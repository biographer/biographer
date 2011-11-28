#ifndef th_layout_h
#define th_layout_h
#include "network.h"
#include "functions.h"
#include "plugins.h"
enum conditions{
   iterations=1<<0,relForceDiff=1<<1,temp=1<<2
};

struct step{
   VI actplugins;
   VF scales;
   unsigned long end;
   int c_iterations;
   double c_relForceDiff;
   double c_tempRelForce;
   int c_tempSteps;
   bool limit_mov;
};

class Layouter{
   public:
      Layouter(Network& _nw,Plugins& _pgs);
      void stepAddPlugins(int step,enumP pg, enumP pg2=(enumP)0, enumP pg3=(enumP)0, enumP pg4=(enumP)0, enumP pg5=(enumP)0, enumP pg6=(enumP)0, enumP pg7=(enumP)0, enumP pg8=(enumP)0, enumP pg9=(enumP)0, enumP pg10=(enumP)0);
      void stepAddPlugin(int step,enumP pg, double scale=1.0);
      void stepAddEndCondition(int step, conditions cond, double param=NULL, double param2=NULL);
      void stepLimitMov(int step, bool limit);
      void execute();
      Network& nw;
      VP mov;
      VF movadd;
      VF rot;
      VF dij;
      VI deg;
      vector<bool> tension;
      double avgsize;
      bool show_progress;
      int progress_step;
   protected:
      Plugins& plugins;
      void initStep(int step);
      void moveNodes(bool limit);
      double maxForce;
      vector<step> program;
      bool forked_viewer;
      void showProgress(int cc);
};
double get_dij(Network &nw,int i, int j);
#endif