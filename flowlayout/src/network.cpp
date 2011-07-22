#include "network.h"

const char edgetypes[][20]={"Directed", "Undirected", "Substrate", "Product", "Catalyst", "Activator", "Inhibitor"};
const char nodetypes[][20]={"None", "Reaction", "Compound","Other"};

Network::Network(){
   nodes = new VN(); nodes->clear();
   edges = new VE(); edges->clear();
   compartments = new VCP(); compartments->clear();
}

Network::~Network(){
   int i,n=nodes->size();
   for(i=0;i<n;i++)(*nodes)[i].neighbors->clear();
   nodes->clear();
   edges->clear();
   compartments->clear();
   delete nodes;
   delete edges;
}

VI * Network::getNeighbors(int nodeIndex, Edgetype type){
   VI *arr=new VI();
   arr->clear();
   int i,n=(*nodes)[nodeIndex].neighbors->size();
   for(i=0;i<n;i++)
      if((*edges)[(*(*nodes)[nodeIndex].neighbors)[i]].pts.type==type){
         if((*nodes)[nodeIndex].pts.type==reaction)
            arr->push_back((*edges)[(*(*nodes)[nodeIndex].neighbors)[i]].to);
         else arr->push_back((*edges)[(*(*nodes)[nodeIndex].neighbors)[i]].from);
      }
   return arr;
}

VI * Network::getNeighbors(int nodeIndex){
   VI *arr=new VI();
   arr->clear();
   int i,n=(*nodes)[nodeIndex].neighbors->size();
   for(i=0;i<n;i++){
      if((*nodes)[nodeIndex].pts.type==reaction)
         arr->push_back((*edges)[(*(*nodes)[nodeIndex].neighbors)[i]].to);
      else arr->push_back((*edges)[(*(*nodes)[nodeIndex].neighbors)[i]].from);
   }
   return arr;
}

void Network::addEdge(int from, int to , Edgetype type){
   edges->push_back(Edge(from, to, type));
   int index=edges->size()-1;
   (*nodes)[from].neighbors->push_back(index);
   (*nodes)[to].neighbors->push_back(index);
}

void Network::addNode(int index){
   if(index>=nodes->size())nodes->resize(index+1);
   (*nodes)[index]=Node();
}

void Network::addNode(int index, Nodetype _type){
   if(index>=nodes->size())nodes->resize(index+1);
   (*nodes)[index]=Node(_type);
}

void Network::addNode(int index, Nodetype _type, string _name, float _width, float _height, float _x, float _y, float _dir){
   if(index>=nodes->size())nodes->resize(index+1);
   (*nodes)[index]=Node(_type, _name, _width, _height, _x, _y, _dir);
}

void Network::addNode(int index, Nodetype _type, string _name, float _width, float _height, float _x, float _y, float _dir, int _comp){
   if(index>=nodes->size())nodes->resize(index+1);
   (*nodes)[index]=Node(_type, _name, _width, _height, _x, _y, _dir, _comp);
}

void Network::addCompartment(int index, string _name){
   if(index>=compartments->size())compartments->resize(index+1);
   (*compartments)[index]=(Compartment(_name));
}

void Network::addCompartment(int index, float _xmin, float _xmax, float _ymin, float _ymax, string _name){
   if(index>=compartments->size())compartments->resize(index+1);
   (*compartments)[index]=(Compartment(_xmin,_xmax,_ymin,_ymax,_name));
}

void Network::addReaction(int index, const VI* substrates,const VI* products, const VI* catalysts, const VI* activators, const VI* inhibitors){
   int i,n;
   addNode(index, reaction);
   n=substrates->size();
   for(i=0;i<n;i++){
      addNode((*substrates)[i],compound);
      addEdge(index,(*substrates)[i],substrate);
   }
   n=products->size();
   for(i=0;i<n;i++){
      addNode((*products)[i],compound);
      addEdge(index, (*products)[i],product);
   }
   n=catalysts->size();
   for(i=0;i<n;i++){
      addNode((*catalysts)[i],compound);
      addEdge(index, (*catalysts)[i], catalyst);
   }
   n=activators->size();
   for(i=0;i<n;i++){
      addNode((*activators)[i],compound);
      addEdge(index, (*activators)[i], activator);
   }
   n=inhibitors->size();
   for(i=0;i<n;i++){
      addNode((*inhibitors)[i],compound);
      addEdge(index, (*inhibitors)[i], inhibitor);
   }
}
  
void Network::read(const char* file){
   int c,ci,i,n,m,p,q,k,_index;
   Nodetype _type;
   char s[100],t[100];
   float _x,_y, _width, _height,_dir;
   FILE* old_stdin=stdin;
	printf("importing network\n",c);
   if (file) freopen(file,"r",stdin);
   while (scanf(" #%[^\n]",s)){}; // remove comment lines
   scanf(" %d\n",&c); // num compartments
   if (c>2000){
      fprintf(stderr,"too many compartments %d",c);
      abort();
   }
	printf("number of compartments: %d\n",c);
   for(i=0;i<c;i++){
      scanf("%d %s\n",&_index,t);
      if (_index>c+1){ // not starting at zero
         fprintf(stderr,"compartment index out of bound %d",_index);
         abort();
      }
      addCompartment(_index,t);
   }  
   scanf("%s\n",s); // "///"  
   scanf("%d",&n); //number of nodes
	printf("number of nodes: %d\n",n);
   if (c>10000){
      fprintf(stderr,"too many nodes %d",c);
      abort();
   }
   for(i=0;i<n;i++){
      scanf("%d\n",&_index);
      if (_index>=n){
         fprintf(stderr,"node index out of bound %d",_index);
         abort();
      }
      scanf("%s\n",t);
      if(strcmp(t,"Compound")==0)_type=compound;
      else if(strcmp(t,"Reaction")==0)_type=reaction;
      else if(strcmp(t,"Other")==0)_type=other;
      else _type=none;
      scanf("%s\n",s);
      scanf("%d\n",&ci); 
      scanf("%f%f",& _x,& _y);
      scanf("%f%f%f",& _width,& _height,& _dir);      
      addNode(_index, _type, s, _width, _height, _x, _y, _dir,ci);            
   }
   scanf("%s\n",s); // "///"
   scanf("%d\n",&m); // numer of edges
	printf("number of edges: %d\n",m);
   if (c>40000){
      fprintf(stderr,"too many edges %d",c);
      abort();
   }
   fflush(stdout);
   for(i=0;i<m;i++){
      scanf("%s %d %d\n",s,&p,&q);
      if (p>=n){
         fprintf(stderr,"edge node index out of bound %d",p);
         abort();
      }
      if (q>=n){
         fprintf(stderr,"edge node index out of bound %d",q);
         abort();
      }
      for(k=0;k<7;k++){
         if(strcmp(edgetypes[k],s)==0)break;
      }
      addEdge(p,q,(Edgetype)k);
   }
}

void Network::dumpNodes(const char* file){
   Node tmp;
   int i;
   int n=nodes->size();
   FILE* old_stdout=stdout;
   if (file) freopen(file,"w",stdout);
   for(i=0;i<n;i++){
      printf("%d\n",i);
      tmp = (*nodes)[i];
      printf("%s\n",nodetypes[(int)(tmp.pts.type)]);
      cout<<tmp.pts.name<<endl;
      printf("%d\n%0.3f\n%0.3f\n%0.3f\n%0.3f\n%0.3f\n",tmp.pts.compartment,tmp.pts.x, tmp.pts.y, tmp.pts.width, tmp.pts.height, tmp.pts.dir);
   }
} 
  
