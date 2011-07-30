#include "network.h"

const char edgetypes[][20]={"Directed", "Undirected", "Substrate", "Product", "Catalyst", "Activator", "Inhibitor"}; //for the convenience of input and output.
const char nodetypes[][20]={"None", "Reaction", "Compound","Other"}; //for the convenience of input and output.

Network::Network(){
   //default network constructor.
   nodes = new VN(); nodes->clear();
   edges = new VE(); edges->clear();
   compartments = new VCP(); compartments->clear();
}

Network::~Network(){
   //default network destructor.
   int i,n=nodes->size();
   for(i=0;i<n;i++)(*nodes)[i].neighbors->clear();
   nodes->clear();
   edges->clear();
   compartments->clear();
   delete nodes;
   delete edges;
}

VI * Network::getNeighbors(int nodeIndex, Edgetype type){
   /*
     find the neighbors nodes of specified type (eg. substrates) of a node.
     if this node is a reaction node, its neighbors should be at the "to" side,
     otherwise, its neighbors are at the "from"side.
   */
   
   VI *arr=new VI();
   arr->clear();
   int i,n=(*nodes)[nodeIndex].neighbors->size();
   for(i=0;i<n;i++)
      if((*edges)[(*(*nodes)[nodeIndex].neighbors)[i]].pts.type==type){
         if((*nodes)[nodeIndex].pts.type==reaction)
            arr->push_back((*edges)[(*(*nodes)[nodeIndex].neighbors)[i]].to);
         else arr->push_back((*edges)[(*(*nodes)[nodeIndex].neighbors)[i]].from);
      }
   return arr;//take care: must delete the pointer in the calling methods.
}

VI * Network::getNeighbors(int nodeIndex){
   /*
     find all the neighbors nodes of a node.
     if this node is a reaction node, its neighbors should be at the "to" side,
     otherwise, its neighbors are at the "from"side.
   */
   VI *arr=new VI();
   arr->clear();
   int i,n=(*nodes)[nodeIndex].neighbors->size();
   for(i=0;i<n;i++){
      if((*nodes)[nodeIndex].pts.type==reaction)
         arr->push_back((*edges)[(*(*nodes)[nodeIndex].neighbors)[i]].to);
      else arr->push_back((*edges)[(*(*nodes)[nodeIndex].neighbors)[i]].from);
   }
   return arr;//take care: must delte the pointer in the calling methods.
}

void Network::addEdge(int from, int to , Edgetype type){
   //add in an edge into the network.
   edges->push_back(Edge(from, to, type)); //add in this edge.
   int index=edges->size()-1; //index of the edge added.
   (*nodes)[from].neighbors->push_back(index); //add this edge into the neighbors of the reaction.
   (*nodes)[to].neighbors->push_back(index); //add this edge into te neighbors of the compound.
}

void Network::addNode(int index){
   //add in a node into the network (with only index specified).
   if(index>=nodes->size())nodes->resize(index+1);
   (*nodes)[index]=Node();
}

void Network::addNode(int index, Nodetype _type){
   //add in a node into the network with only index and Nodetype specified.
   if(index>=nodes->size())nodes->resize(index+1);
   (*nodes)[index]=Node(_type);
}

void Network::addNode(int index, Nodetype _type, string _name, float _width, float _height, float _x, float _y, float _dir){
   if(index>=nodes->size())nodes->resize(index+1);
   (*nodes)[index]=Node(_type, _name, _width, _height, _x, _y, _dir);
}

void Network::addNode(int index, Nodetype _type, string _name, float _width, float _height, float _x, float _y, float _dir, int _comp){
   //add in a node with all node properties specified (prefered in the algorithms).
   if(index>=nodes->size())nodes->resize(index+1);
   (*nodes)[index]=Node(_type, _name, _width, _height, _x, _y, _dir, _comp);
}

void Network::addCompartment(int index, string _name){
   //add in a compartment with _name specified (prefered in the algorithms).
   if(index>=compartments->size())compartments->resize(index+1);
   (*compartments)[index]=(Compartment(_name));
}

void Network::addCompartment(int index, float _xmin, float _xmax, float _ymin, float _ymax, string _name){
   //add in a compartment with all attributes specified.
   if(index>=compartments->size())compartments->resize(index+1);
   (*compartments)[index]=(Compartment(_xmin,_xmax,_ymin,_ymax,_name));
}

void Network::addReaction(int index, const VI* substrates,const VI* products, const VI* catalysts, const VI* activators, const VI* inhibitors){
   /* add a reaction in to the network.
     This operation includes: 
     1. add in new nodes
     2. add in edges involved in the reaction.
   */
   int i,n;
   addNode(index, reaction); //add in the reaction node.
   n=substrates->size();
   for(i=0;i<n;i++){ //add in new node (if any) in its substrate-set.
      addNode((*substrates)[i],compound);
      addEdge(index,(*substrates)[i],substrate);
   }
   n=products->size();
   for(i=0;i<n;i++){ //add in new node (if any) in its product-set.
      addNode((*products)[i],compound);
      addEdge(index, (*products)[i],product);
   }
   n=catalysts->size();
   for(i=0;i<n;i++){ //add in new node (if any) in its catalyst-set.
      addNode((*catalysts)[i],compound);
      addEdge(index, (*catalysts)[i], catalyst);
   }
   n=activators->size();
   for(i=0;i<n;i++){ //add in new node (if any) in its activator-set.
      addNode((*activators)[i],compound);
      addEdge(index, (*activators)[i], activator);
   }
   n=inhibitors->size();
   for(i=0;i<n;i++){ //add in new node (if any) in its inhibitor-set.
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
	printf("number of compartments: %d\n",c);
   for(i=0;i<c;i++){
      scanf("%d %s\n",&_index,t);
      addCompartment(_index,t);
   }  
   scanf("%s\n",s); // "///"  
   scanf("%d",&n); //number of nodes
	printf("number of nodes: %d\n",n);
   for(i=0;i<n;i++){
      scanf("%d\n",&_index);
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
	fflush(stdout);
   for(i=0;i<m;i++){
      scanf("%s %d %d\n",s,&p,&q);
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
  
