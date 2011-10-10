#ifndef th_layout_h
#define th_layout_h
enum plugins {
   init=1<<0,init_swap=1<<1,init_wComp=1<<2,adjForce=1<<3,nadjForc=1<<4,adjTorque=1<<5,checkCompartment=1<<6,adjustCompartment=1<<7,avoidOverlap=1<<8
};
enum conditions{
   iteration=1<<0
};
class Layouter;
typedef double (*plugin_func_ptr)(Layouter &state,VP &mov,int round,double temp);
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
   conditions end;
   int c_iterations;
   
};

class Layouter{
   public:
      Layouter(Network& _nw):nw(_nw), plugins(Plugins(_nw.nodes.size())){
         mov.resize(nw.nodes.size());
         movadd.resize(nw.nodes.size());
         avgsize=avg_sizes(nw);
      }
      void setStep(int step,unsigned long bitplugins);
      void setEndCondition(int step, conditions cond, double param);
      void execute();
      Network& nw;
      VP mov;
      VF movadd;
      double avgsize;
      Plugins plugins;
   protected:
      void initStep(int step);
      vector<step> program;
};
#endif