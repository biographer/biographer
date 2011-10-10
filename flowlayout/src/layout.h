#ifndef th_layout_h
#define th_layout_h
enum plugins {
   init=1<<0,init_swap=1<<1,init_wComp=1<<2,adjForce=1<<3,nadjForc=1<<4,adjTorque=1<<5,checkCompartment=1<<6,adjustCompartment=1<<7,avoidOverlap=1<<8
};
enum conditions{
   iterations=1<<0,relForceDiff=1<<1
};
class Layouter;
struct plugin;
typedef double (*plugin_func_ptr)(Layouter &state,plugin& pg, VP &mov,int round,double temp);
struct plugin{
   plugin_func_ptr pfunc;
   VP last;
   void* persist;
};
class Plugins{
   public:
      Plugins(int _num):num(_num){} // expects number of nodes in network
      void registerPlugin(unsigned long pgn, plugin_func_ptr pfunc);
      size_t size();
      plugin& get(int idx);
   private:
      int num;
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
      Layouter(Network& _nw):nw(_nw), plugins(Plugins(_nw.nodes.size())){
         mov.resize(nw.nodes.size());
         movadd.resize(nw.nodes.size());
         avgsize=avg_sizes(nw);
      }
      void setStep(int step,unsigned long bitplugins);
      void addEndCondition(int step, conditions cond, double param);
      void execute();
      Network& nw;
      VP mov;
      VF movadd;
      VF rot;
      vector<bool> tension;
      double avgsize;
   protected:
      Plugins plugins;
      void initStep(int step);
      void moveNodes();
      double maxForce;
      vector<step> program;
};
#endif