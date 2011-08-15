#include "network.h"


const char edgetypes[][20]={"Directed", "Undirected", "Substrate", "Product", "Catalyst", "Activator", "Inhibitor"}; //for the convenience of input and output.
const char nodetypes[][20]={"None", "Reaction", "Compound","Other"}; //for the convenience of input and output in order of enum Nodetype.
const char jnodetypes[][20]={"None", "Reaction", "Compound","SimpleCompound","Complex","Protein","Other"}; //json node types
const Nodetype inodetypes[]={none,reaction,compound,compound,compound,compound,other}; // convertion of different node types from json nodetypes
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
void Network::dump(){
   Node* tmp;
   Edge* e;
   Compartment* c;
   int i,j;
   int n=nodes->size();
   printf("nodes:\n");
   for(i=0;i<n;i++){
      tmp = &((*nodes)[i]);
      cout<<i<<' '<<nodetypes[tmp->pts.type]<<' '<<tmp->pts.name<<endl;
      printf("(%0.3f,%0.3f)+(%0.3f,%0.3f) dir %0.3f, comp %d\n",tmp->pts.x, tmp->pts.y, tmp->pts.width, tmp->pts.height, tmp->pts.dir, tmp->pts.compartment);
      printf("--edges: ");
      for (j=0;j<tmp->neighbors->size();j++){
         printf("%d ",(*tmp->neighbors)[j]);
      }
      printf("\n");
   }
   n=edges->size();
   printf("edges:\n");
   for(i=0;i<n;i++){
      e = &((*edges)[i]);
      printf("%s %d -> %d\n",edgetypes[(int)(e->pts.type)],e->from,e->to);
   }
   n=compartments->size();
   printf("compartments:\n");
   for(i=0;i<n;i++){
      c = &((*compartments)[i]);
      cout<<i<<' '<<c->name<<endl;
      printf("(%0.3f,%0.3f)-(%0.3f,%0.3f)",c->xmin, c->ymin, c->xmax, c->ymax);
      
   }
   
}


char scanerr[200];
#define MSCANF(f,v) if(!(scanf(f,v))){sprintf(scanerr,"error reading %s line %i in %s",f,__LINE__,__FILE__);throw scanerr;}
#define MSCANF2(f,v,x) if(!(scanf(f,v,x))){sprintf(scanerr,"error reading %s line %i in %s",f,__LINE__,__FILE__);throw scanerr;}
#define MSCANF3(f,v,x,y) if(!(scanf(f,v,x,y))){sprintf(scanerr,"error reading %s line %i in %s",f,__LINE__,__FILE__);throw scanerr;}
void Network::read(const char* file){
   try {
      int numc,ci,i,n,m,p,q,k,_index;
      int ret;
      Nodetype _type;
      char s[100],t[100];
      float _x,_y, _width, _height,_dir;
      FILE* old_stdin=stdin;
      printf("importing network\n");
      if (file) freopen(file,"r",stdin);
      ret=1;
      while (ret>0){ret=scanf(" #%[^\n]",s);}; // remove comment lines
      if (ret<0) throw "error reading input";
      MSCANF(" %d\n",&numc); // num compartments
      if (numc>2000){
         fprintf(stderr,"too many compartments %d",numc);
         abort();
      }
      printf("number of compartments: %d\n",numc);
      for(i=0;i<numc;i++){
         MSCANF2(" %d %s\n",&_index,t);
         if (_index>numc+1){ // not starting at zero
            fprintf(stderr,"compartment index out of bound %d",_index);
            abort();
         }
         addCompartment(_index,t);
      }  
      addCompartment(0,"unknown");
      numc++;
      MSCANF(" %s\n",s); // "///"  
      MSCANF(" %d",&n); //number of nodes
      printf("number of nodes: %d\n",n);
      if (n>10000){
         fprintf(stderr,"too many nodes %d",n);
         abort();
      }
      for(i=0;i<n;i++){
         MSCANF(" %d\n",&_index);
         if (_index>=n){
            fprintf(stderr,"node index out of bound %d",_index);
            abort();
         }
         MSCANF(" %s\n",t);
         if(strcmp(t,"Compound")==0)_type=compound;
         else if(strcmp(t,"Reaction")==0)_type=reaction;
         else if(strcmp(t,"Other")==0)_type=other;
         else _type=none;
         MSCANF("%s\n",s);
         MSCANF("%d\n",&ci); 
         MSCANF2("%f%f",& _x,& _y);
         MSCANF3("%f%f%f",& _width,& _height,& _dir);      
         addNode(_index, _type, s, _width, _height, _x, _y, _dir,ci);
         printf("added %s %s %i\n",t,s,_index);
      }
      MSCANF(" %s\n",s); // "///"
      MSCANF(" %d\n",&m); // numer of edges
      printf("number of edges: %d\n",m);
      if (m>40000){
         fprintf(stderr,"too many edges %d",m);
         abort();
      }
      fflush(stdout);
      for(i=0;i<m;i++){
         MSCANF3("%s %d %d\n",s,&p,&q);
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
   } catch (char* err){
      cout << err <<endl;
      abort();
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

#ifdef USEJSON

double json_object_get_number_member(JsonObject* jobj,const gchar *name){
   JsonNode* node=json_object_get_member(jobj,name);
   GType tp=json_node_get_value_type(node);
   if (tp == G_TYPE_INT64){
      return (double) json_node_get_int(node);
   } else if (tp == G_TYPE_DOUBLE){
      return (double) json_node_get_double(node);
   } else if (tp == G_TYPE_STRING){
      return atof(json_node_get_string(node));
   } else {
      printf("json object member %s not a number, but a %s (%d)",name,json_node_type_name(node),tp);
      return 0;
   }
   
}
// FIXME: check for memory leaks
JSONcontext* Network::readJSON(const char* file){
   JsonParser *parser;
   JsonObject *obj;
   JsonArray *jnodes;
   JsonArray *jedges;
   int i,k;
   JSONcontext* ctx=new JSONcontext();
   GError *error;
   g_type_init ();
   parser = json_parser_new ();
   
   error = NULL;
   json_parser_load_from_file (parser, file, &error);
   if (error)
   {
      g_print ("Unable to parse `%s': %s\n", file, error->message);
      g_error_free (error);
      g_object_unref (parser);
      abort();
   }
   addCompartment(0,"unknown"); // add dummy compartment, may be overwritten by compartment from json
   ctx->root = json_node_copy(json_parser_get_root(parser)); // needs to be copied ??
   obj=json_node_get_object (ctx->root);
   jnodes=json_object_get_array_member(obj,"nodes");
   jedges=json_object_get_array_member(obj,"edges");
   g_print ("%i nodes\n",json_array_get_length(jnodes));
   for (i=0;i<json_array_get_length(jnodes);i++){
      JsonObject *n=json_array_get_object_element(jnodes,i);
      JsonObject *data=json_object_get_object_member(n,"data");
      const char* type=json_object_get_string_member(n,"type");
      const char* id=json_object_get_string_member(n,"id");
      if (json_object_has_member(n,"is_abstract") && (json_object_get_boolean_member(n,"is_abstract") || json_object_get_int_member(n,"is_abstract"))){
         continue;
      }
      if (!json_object_has_member(n,"index")){
         g_print ("no index defined for %s %s\n",type,id);
         abort();
      }
      int idx=json_object_get_int_member(n,"index");
      g_print ("node %d %s id %s\n",idx,type,id);
      if(strcmp(type,"Compartment")==0){
         addCompartment(idx,id);
      } else {
         double x=json_object_get_number_member(data,"x");
         double y=json_object_get_number_member(data,"y");
         double w=json_object_get_number_member(data,"width");
         double h=json_object_get_number_member(data,"height");
         double d=json_object_get_number_member(data,"dir");
         int c=json_object_get_int_member(data,"compartmentidx");
         for(k=0;k<7;k++){
            if(strcmp(jnodetypes[k],type)==0)break;
         }
         if (k==7){
            g_print ("unknown node type %s\n",type);
            abort();
         }
         addNode(idx,inodetypes[k],id,w,h,x,y,d,c);
         if (idx>=ctx->nodeidx->size()) ctx->nodeidx->resize(idx+1);
         (*(ctx->nodeidx))[idx]=i;
      }
   }
   g_print ("%i edges\n",json_array_get_length(jedges));
   for (i=0;i<json_array_get_length(jedges);i++){
      JsonObject *e=json_array_get_object_element(jedges,i);
      const char* type=json_object_get_string_member(e,"type");
      if ((!json_object_has_member(e,"sourceidx")) || (!json_object_has_member(e,"targetidx"))){
         g_print ("no source/targetindex defined for edge %s %i",type,i);
         abort;
      }
      for(k=0;k<7;k++){
         if(strcmp(edgetypes[k],type)==0)break;
      }
      int from=json_object_get_int_member(e,"sourceidx");
      int to=json_object_get_int_member(e,"targetidx");
      addEdge(from,to,(Edgetype)k);
      g_print ("edge %s %i -> %i\n",edgetypes[k],from,to);
   }
   g_object_unref(parser);
   return ctx;
}

// FIXME: check for memory leaks
void Network::writeJSON(JSONcontext* ctx,const char* file){
   GError *error;
   JsonGenerator* gen=json_generator_new ();
   json_generator_set_root(gen,ctx->root);
   JsonArray* jnodes=json_object_get_array_member(json_node_get_object (ctx->root),"nodes");
   
   int i;
   int n=nodes->size();
   
   for(i=0;i<n;i++){ // add x,y position to json object
      JsonObject *node=json_array_get_object_element(jnodes,(*(ctx->nodeidx))[i]); //get corresponding json node using nodeidx
      JsonObject *data=json_object_get_object_member(node,"data");
      json_object_set_double_member(data,"x",(*nodes)[i].pts.x);
      json_object_set_double_member(data,"y",(*nodes)[i].pts.y);
   }
   gsize length;
   gchar* jdata=json_generator_to_data(gen,&length);
   
   ofstream out(file);
   out<<jdata;
   out.close();
   
   
}
#endif USEJSON
