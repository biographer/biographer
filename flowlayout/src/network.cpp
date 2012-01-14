#include "network.h"


const char jnodetypes[][20]={"None", "Reaction", "Compound","SimpleCompound","Complex","Protein","Other"}; //json node types
const Nodetype inodetypes[]={none,reaction,compound,compound,compound,compound,other}; // convertion of different node types from json nodetypes
Network::Network(){
   //default network constructor.
   infile=NULL;
   hasfixed=false;
}


VI * Network::getNeighbors(int nodeIndex, Edgetype type){
   /*
     find the neighbors nodes of specified type (eg. substrates) of a node.
     if this node is a reaction node, its neighbors should be at the "to" side,
     otherwise, its neighbors are at the "from"side.
   */
   
   VI *arr=new VI();
   int i,n=nodes[nodeIndex].neighbors.size();
   for(i=0;i<n;i++){
      if(edges[(nodes[nodeIndex].neighbors)[i]].type==type){
         if (edges[(nodes[nodeIndex].neighbors)[i]].to==nodeIndex){
            arr->push_back(edges[(nodes[nodeIndex].neighbors)[i]].from);
         } else {
            arr->push_back(edges[(nodes[nodeIndex].neighbors)[i]].to);
         }
      }
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
   int i,n=nodes[nodeIndex].neighbors.size();
   for(i=0;i<n;i++){
      if (edges[(nodes[nodeIndex].neighbors)[i]].to==nodeIndex){
         arr->push_back(edges[(nodes[nodeIndex].neighbors)[i]].from);
      } else {
         arr->push_back(edges[(nodes[nodeIndex].neighbors)[i]].to);
      }
   }
   return arr;//take care: must delte the pointer in the calling methods.
}
bool Network::isNeighbor(int node1,int node2){
   /*
   find all the neighbors nodes of a node.
   if this node is a reaction node, its neighbors should be at the "to" side,
      otherwise, its neighbors are at the "from"side.
      */
   int i,n=nodes[node1].neighbors.size();
   for(i=0;i<n;i++){
      if (edges[(nodes[node1].neighbors)[i]].to==node2 || edges[(nodes[node1].neighbors)[i]].from==node2) return true;
   }
   return false;
}
int Network::degree(int nodeIndex){
   return nodes[nodeIndex].neighbors.size();
}
void Network::addEdge(int from, int to , Edgetype type){
   //add in an edge into the network.
   edges.push_back(Edge(from, to, type)); //add in this edge.
   int index=edges.size()-1; //index of the edge added.
   nodes[from].neighbors.push_back(index); //add this edge into the neighbors of the reaction.
   nodes[to].neighbors.push_back(index); //add this edge into te neighbors of the compound.
}

void Network::addNode(int index){
   //add in a node into the network (with only index specified).
   if((size_t) index>=nodes.size())nodes.resize(index+1);
   nodes[index]=Node();
}

void Network::addNode(int index, Nodetype _type){
   //add in a node into the network with only index and Nodetype specified.
   if((size_t) index>=nodes.size())nodes.resize(index+1);
   nodes[index]=Node(_type);
}

void Network::addNode(int index, Nodetype _type, string _name, double _width, double _height, double _x, double _y, double _dir, int _comp, bool _fx){
   //add in a node with all node properties specified (prefered in the algorithms).
   if((size_t) index>=nodes.size())nodes.resize(index+1);
   nodes[index]=Node(_type, _name, _width, _height, _x, _y, _dir, _comp, _fx);
   if (_fx) hasfixed=true;
}

void Network::addCompartment(int index, string _name){
   //add in a compartment with _name specified (prefered in the algorithms).
   if((size_t) index>=compartments.size())compartments.resize(index+1);
   compartments[index]=(Compartment(_name));
}

void Network::addCompartment(int index, double _xmin, double _ymin, double _xmax, double _ymax, string _name, bool _fx){
   //add in a compartment with all attributes specified.
   if((size_t) index>=compartments.size())compartments.resize(index+1);
   compartments[index]=(Compartment(_xmin,_ymin,_xmax,_ymax,_name,_fx));
   if (_fx) hasfixed=true;
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
void Network::calcEdgeLengths(){
   int i,m=edges.size();
   for (i=0;i<m;i++){
      Edge &e=edges[i];
      e.len=dist(nodes[e.to],nodes[e.from]);
   }
}
void Network::dump(){
   Node* tmp;
   Edge* e;
   Compartment* c;
   int i,j;
   int n=nodes.size();
   printf("nodes:\n");
   for(i=0;i<n;i++){
      tmp = &(nodes[i]);
      cout<<i<<' '<<nodetypes[tmp->type]<<' '<<tmp->name<<endl;
      printf("(%0.3f,%0.3f)+(%0.3f,%0.3f) dir %0.3f, comp %d\n",tmp->x, tmp->y, tmp->width, tmp->height, tmp->dir, tmp->compartment);
      printf("--edges: ");
      for (j=0;j<(int) tmp->neighbors.size();j++){
         printf("%d ",tmp->neighbors[j]);
      }
      printf("\n");
   }
   n=edges.size();
   printf("edges:\n");
   for(i=0;i<n;i++){
      e = &(edges[i]);
      printf("%s %d -> %d\n",edgetypes[(int)(e->type)],e->from,e->to);
   }
   n=compartments.size();
   printf("compartments:\n");
   for(i=0;i<n;i++){
      c = &(compartments[i]);
      cout<<i<<' '<<c->name<<endl;
      printf("(%0.3f,%0.3f)-(%0.3f,%0.3f)",c->xmin, c->ymin, c->xmax, c->ymax);
      
   }
   
}


char scanerr[200];
#define MSCANF(f,v) if(!(scanf(f,v))){sprintf(scanerr,"error reading %s line %i in %s",f,__LINE__,__FILE__);throw scanerr;}
#define MSCANF2(f,v,x) if(!(scanf(f,v,x))){sprintf(scanerr,"error reading %s line %i in %s",f,__LINE__,__FILE__);throw scanerr;}
#define MSCANF3(f,v,x,y) if(!(scanf(f,v,x,y))){sprintf(scanerr,"error reading %s line %i in %s",f,__LINE__,__FILE__);throw scanerr;}
#define MSCANF4(f,v,x,y,z) if(!(scanf(f,v,x,y,z))){sprintf(scanerr,"error reading %s line %i in %s",f,__LINE__,__FILE__);throw scanerr;}
void Network::read(const char* file){
   try {
      int numc,ci,i,n,m,p,q,k,_index;
      int ret;
      Nodetype _type;
      char s[100],t[100];
      float _x,_y, _width, _height,_dir;
//      FILE* old_stdin=stdin;
      printf("importing network\n");
      infile=(char *) file;
      if (file) freopen(file,"r",stdin);
      ret=1;
      while (ret>0){ret=scanf(" #%[^\n]",s);}; // remove comment lines
      if (ret<0) throw "error reading input";
      MSCANF(" %d\n",&numc); // num compartments
      if (numc>2000){
         fprintf(stderr,"too many compartments %d",numc);
         abort();
      }
      addCompartment(0,"unknown"); //first compartment is witout constraints (you can overwrite its name though)
      printf("number of compartments: %d\n",numc);
      for(i=0;i<numc;i++){
         MSCANF2(" %d %s\n",&_index,t);
         char fc[2];
         float _xmin,_ymin,_xmax,_ymax;
         if (scanf(" %[!]",fc)){
            MSCANF4("%f%f%f%f",&_xmin,&_ymin,&_xmax,&_ymax);
            addCompartment(_index,_xmin,_ymin,_xmax,_ymax,t,true);
         } else {
            addCompartment(_index,t);
         }
         if (_index>numc+1){ // not starting at zero
            fprintf(stderr,"compartment index out of bound %d",_index);
            abort();
         }
      }  
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
         char fc[2];
         bool fix=false;
         if (scanf(" %[!]",fc)) fix=true;
         MSCANF("%f",&_x);
         if (scanf(" %[!]",fc)) fix=true;
         MSCANF("%f",&_y);
         MSCANF3("%f%f%f",& _width,& _height,& _dir);      
         addNode(_index, _type, s, _width, _height, _x, _y, _dir,ci,fix);
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
         if (((Edgetype)k) != product){// note: if you change this here also change in write!!!!
            swap(p,q); // Network and layout expect reaction->reactant edge format
         }
         addEdge(p,q,(Edgetype)k);
      }
      freopen("/dev/tty","r",stdin);
   } catch (char* err){
      cout << err <<endl;
      abort();
   }
}
void Network::write(const char* file){
   Node tmp;
   int i;
   int c=compartments.size();
   int n=nodes.size();
   int e=edges.size();
   FILE * out;
   if (file) {
      out=fopen(file,"w");
   } else {
      out=stdout;
   }
   fprintf(out,"%d\n",c-1);
   for(i=0;i<c-1;i++){// ignore first compartment
      fprintf(out,"%d %s\n",i,compartments[i].name.c_str());
   }
   fprintf(out,"///\n%d\n",n);
   for(i=0;i<n;i++){
      fprintf(out,"%d\n",i);
      tmp = nodes[i];
      fprintf(out,"%s\n",nodetypes[(int)(tmp.type)]);
      fprintf(out,"%s\n",tmp.name.c_str());
      fprintf(out,"%d\n%0.3f\n%0.3f\n%0.3f\n%0.3f\n%f\n",tmp.compartment,tmp.x, tmp.y, tmp.width, tmp.height, tmp.dir);
   }
   fprintf(out,"///\n%d\n",e);
   Edge* ed;
   for(i=0;i<e;i++){
      ed = &(edges[i]);
      int p=ed->from;
      int q=ed->to;
      if (ed->type != product) swap(p,q); // note: if you change this here also change in read
         fprintf(out,"%s %d %d\n",edgetypes[(int)(ed->type)],p,q);
   }
   fclose(out);
} 
void Network::dumpNodes(FILE* out){
   Node tmp;
   int i;
   const double inf=1e50;
   double xmin=inf;
   double xmax=-inf;
   double ymin=inf;
   double ymax=-inf;
   int n=nodes.size();
/*   FILE * out;
   if (file) {
      out=fopen(file,"w");
   } else {
      out=stdout;
   }*/
   for(i=0;i<n;i++){
      fprintf(out,"%d\n",i);
      tmp = nodes[i];
      fprintf(out,"%s\n",nodetypes[(int)(tmp.type)]);
      fprintf(out,"%s\n",tmp.name.c_str());
      fprintf(out,"%d\n%0.3f\n%0.3f\n%0.3f\n%0.3f\n%0.3f\n",tmp.compartment,tmp.x, tmp.y, tmp.width, tmp.height, tmp.dir);
      if (xmin>nodes[i].x-nodes[i].width/2) xmin=nodes[i].x-nodes[i].width/2;
      if (xmax<nodes[i].x+nodes[i].width/2) xmax=nodes[i].x+nodes[i].width/2;
      if (ymin>nodes[i].y-nodes[i].height/2) ymin=nodes[i].y-nodes[i].height/2;
      if (ymax<nodes[i].y+nodes[i].height/2) ymax=nodes[i].y+nodes[i].height/2;
   }
   //do do print in output file !!! printf("bound:\n(%f,%f)-(%f,%f)\n",xmin,ymin,xmax,ymax);
   n=compartments.size();
   double cpminy=inf;
   double cpmaxy=-inf;
   int cpmin,cpmax;
   for(i=0;i<n;i++){
      if (compartments[i].ymin<cpminy){
         cpmin=i;
         cpminy=compartments[i].ymin;
      }
      if (compartments[i].ymax>cpmaxy){
         cpmax=i;
         cpmaxy=compartments[i].ymax;
      }
   }
   compartments[cpmin].ymin=ymin;
   compartments[cpmax].ymax=ymax;
   for(i=0;i<n;i++){
      fprintf(out,"%d\n",i);
      fprintf(out,"Compartment\n");
      fprintf(out,"%s\n",compartments[i].name.c_str());
      fprintf(out,"%d\n%0.3f\n%0.3f\n%0.3f\n%0.3f\n%0.3f\n",0,
             max(xmin,compartments[i].xmin),
             max(ymin,compartments[i].ymin),
             min(xmax,compartments[i].xmax)-max(xmin,compartments[i].xmin),
             min(ymax,compartments[i].ymax)-max(ymin,compartments[i].ymin),
             0.0);
   }
   //fclose(out);
} 
void Network::dumpEdges(FILE* out){
   for (int i=0,m=edges.size();i<m;i++){
      Edge &e=edges[i];
      int src=e.from;
      int tgt=e.to;
      if (e.type==substrate || e.type==catalyst || e.type==activator || e.type==inhibitor) swap(src,tgt);
      fprintf(out,"%s %d %d ",edgetypes[e.type],src,tgt);
      for (int j=0,js=e.splinehandles.size();j<js;j++){
         fprintf(out,"%0.3f,%0.3f",e.splinehandles[j].x,e.splinehandles[j].y);
         if (j<js-1) fprintf(out,",");
      }
      fprintf(out," ");
      for (int j=0,js=e.splinepoints.size();j<js;j++){
         fprintf(out,"%0.3f,%0.3f",e.splinepoints[j].x,e.splinepoints[j].y);
         if (j<js-1) fprintf(out,",");
      }
      fprintf(out,"\n");
   }
}
Rect Network::getBB(bool includeCompartments){
   int cn=compartments.size();
   int n=nodes.size();
   int i;
   double xmin=DBL_MAX,xmax=-DBL_MAX,ymin=DBL_MAX,ymax=-DBL_MAX;
   if (includeCompartments){
      for(i=1;i<cn;i++){
         const Compartment &cpi=compartments[i];
         if (cpi.xmax>xmax) xmax=cpi.xmax;
         if (cpi.ymax>ymax) ymax=cpi.ymax;
         if (cpi.xmin<xmin) xmin=cpi.xmin;
         if (cpi.ymin<ymin) ymin=cpi.ymin;
      }
   }
   for(i=0;i<n;i++){
      if(nodes[i].x-nodes[i].width/2<xmin) xmin=nodes[i].x-nodes[i].width/2;
      if(nodes[i].x+nodes[i].width/2>xmax) xmax=nodes[i].x+nodes[i].width/2;
      if(nodes[i].y-nodes[i].height/2<ymin) ymin=nodes[i].y-nodes[i].height/2;
      if(nodes[i].y+nodes[i].height/2>ymax) ymax=nodes[i].y+nodes[i].height/2;
   }
   return Rect(xmin,ymin,xmax,ymax);
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

int json_object_get_intnumber_member(JsonObject* jobj,const gchar *name){
   JsonNode* node=json_object_get_member(jobj,name);
   GType tp=json_node_get_value_type(node);
   if (tp == G_TYPE_INT64){
      return (int) json_node_get_int(node);
   } else if (tp == G_TYPE_DOUBLE){
      return (int) json_node_get_double(node);
   } else if (tp == G_TYPE_STRING){
      return atoi(json_node_get_string(node));
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
      if (json_object_has_member(n,"is_abstract") && (json_object_get_boolean_member(n,"is_abstract") || json_object_get_intnumber_member(n,"is_abstract"))){
         continue;
      }
      if (!json_object_has_member(n,"index")){
         g_print ("no index defined for %s %s\n",type,id);
         abort();
      }
      int idx=json_object_get_intnumber_member(n,"index");
      g_print ("node %d %s id %s\n",idx,type,id);
      if(strcmp(type,"Compartment")==0){
         addCompartment(idx,id);
         if (idx>=ctx->cpidx->size()) ctx->cpidx->resize(idx+1);
         (*(ctx->cpidx))[idx]=i;
      } else {
         double x=json_object_get_number_member(data,"x");
         double y=json_object_get_number_member(data,"y");
         double w=json_object_get_number_member(data,"width");
         double h=json_object_get_number_member(data,"height");
         double d=json_object_get_number_member(data,"dir");
         int c=json_object_get_intnumber_member(data,"compartmentidx");
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
         abort();
      }
      for(k=0;k<7;k++){
         if(strcmp(edgetypes[k],type)==0)break;
      }
      int from=json_object_get_intnumber_member(e,"sourceidx");
      int to=json_object_get_intnumber_member(e,"targetidx");
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

   const double inf=1e50;
   int i;
   int n=nodes.size();
   double xmin=inf;
   double xmax=-inf;
   double ymin=inf;
   double ymax=-inf;
   
   for(i=0;i<n;i++){ // add x,y position to json object
      JsonObject *node=json_array_get_object_element(jnodes,(*(ctx->nodeidx))[i]); //get corresponding json node using nodeidx
      JsonObject *data=json_object_get_object_member(node,"data");
      json_object_set_double_member(data,"x",nodes[i].x);
      json_object_set_double_member(data,"y",nodes[i].y);
      // getting overal bounds
      if (xmin>nodes[i].x-nodes[i].width/2) xmin=nodes[i].x-nodes[i].width/2;
      if (xmax<nodes[i].x+nodes[i].width/2) xmax=nodes[i].x+nodes[i].width/2;
      if (ymin>nodes[i].y-nodes[i].height/2) ymin=nodes[i].y-nodes[i].height/2;
      if (ymax<nodes[i].y+nodes[i].height/2) ymax=nodes[i].y+nodes[i].height/2;
   }
   
   n=compartments.size();
   for(i=0;i<n;i++){ // add x,y position to json object
      JsonObject *node=json_array_get_object_element(jnodes,(*(ctx->cpidx))[i]); //get corresponding json node using nodeidx
      JsonObject *data=json_object_get_object_member(node,"data");
      json_object_set_double_member(data,"x",max(xmin,compartments[i].xmin));
      json_object_set_double_member(data,"y",max(ymin,compartments[i].ymin));
      json_object_set_double_member(data,"width",min(xmax,compartments[i].xmax)-max(xmin,compartments[i].xmin));
      json_object_set_double_member(data,"height",min(ymax,compartments[i].ymax)-max(ymin,compartments[i].ymin));
   }
   
   gsize length;
   gchar* jdata=json_generator_to_data(gen,&length);
   
   ofstream out(file);
   out<<jdata;
   out.close();
   
   
}
#endif
