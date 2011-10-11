#ifndef th_layout_h
#define th_layout_h
#include "network.h"
#include "functions.h"
#include "plugins.h"
enum conditions{
   iterations=1<<0,relForceDiff=1<<1
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
      Layouter(Network& _nw,Plugins& _pgs);
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
      bool show_progress;
      int progress_step;
   protected:
      Plugins& plugins;
      void initStep(int step);
      void moveNodes();
      double maxForce;
      vector<step> program;
      bool forked_viewer;
      void showProgress(int cc);
};
#endif