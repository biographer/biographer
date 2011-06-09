#include "network.h"
#include "functions.h"
#define inf 1e50
#define zero 1e-12
#define err 1e-4

VP pos, mov;
Point baseNode; //for sorting the edges.
struct rect{
   float xmin, xmax, ymin, ymax;
};
vector<rect>bcomp; //compartment boundaries;
vector< vector<float> > xcomp, ycomp; //for initializing the compartments;
vector<float>dij1; //adjacent nodes;
vector< vector<float> >dij2; //non-adjacent nodes;
VI cnt;
   
float Network::get_dij1(int i, int j){ //ideal distance between adjacent nodes;
   float x=(*nodes)[i].pts.width * (*nodes)[i].pts.width + (*nodes)[i].pts.height * (*nodes)[i].pts.height;
   float y=(*nodes)[j].pts.width * (*nodes)[j].pts.width + (*nodes)[j].pts.height * (*nodes)[j].pts.height;
   return (sqrt(x)+sqrt(y))*3;
}

float Network::get_dij2(int i, int j){ //minimum distance between non-adjacent nodes;
   float x=(*nodes)[i].pts.width * (*nodes)[i].pts.width + (*nodes)[i].pts.height * (*nodes)[i].pts.height;
   float y=(*nodes)[j].pts.width * (*nodes)[j].pts.width + (*nodes)[j].pts.height * (*nodes)[j].pts.height;
   return 3*(sqrt(x)+sqrt(y));
}

int cmp_angle(const void *x, const void *y){
   int i=*((int *)x),j=*((int *)y);
   float w=angle(pos[i]-baseNode)-angle(pos[j]-baseNode);
   if(w<0)return -1;
   else if(w==0)return 0;
   else return 1;
}

float Network::calc_force_adj(){
   float force=0.0;
   float d,i_d,alpha,i_alpha,beta;
   Point vec; //vector from pos[n1] to pos[n2];
   int n1,n2,m,n,i;
   Edgetype _type;
   m=edges->size();
   n=nodes->size();
   bool _left=true;
   for(i=0;i<m;i++){
                    
      n1=(*edges)[i].from; //reaction
      n2=(*edges)[i].to; //compound;
      _type=(*edges)[i].pts.type;
      
      vec=pos[n2]-pos[n1];
      i_d=dij1[i];
      d=dist(pos[n1],pos[n2]);
      force+=((d-i_d)*(d-i_d)); //distantal force;
      
      //distantal movements;
      if(fabs(d)<zero){
         if(_type==substrate)mov[n2].y+=(i_d/n); //substrates at top;
         else if(_type==product)mov[n2].y-=(i_d/n);  //products at bottom;
         else{
            if(_left)mov[n2].x-=(i_d/n);
            else mov[n2].x+=(i_d/n);
            _left=!_left;
         }
      }
      else{
         mov[n2].x+=(vec.x/d*(i_d-d)/n);
         mov[n2].y+=(vec.y/d*(i_d-d)/n);
      }
      
      //angular force;
      alpha=angle(vec);
      if(_type==substrate){
         i_alpha=0.5*PI;
         beta=lim(i_alpha-alpha);
      }         
      else if(_type==product){
         i_alpha=1.5*PI;
         beta=lim(i_alpha-alpha);
      }
      else{ //other compounds, rotating to the nearer side.
         i_alpha=0.0; beta=lim(0.0-alpha);
         float i_alpha1=PI, beta1=lim(PI-alpha);
         if(fabs(beta)>fabs(beta1)){
            beta=beta1;
            i_alpha=i_alpha1;
         }
      }
      force+=(i_d*i_d*sin(0.5*beta)*0.1); //angular force;
      mov[n2]=mov[n2]+(to_left(vec,beta/n)-vec); //angular movement; 
   }
   
   return force;
}

float Network::calc_force_nadj(){
   int n1,n2,n=nodes->size();
   float d,i_d,force=0.0;
   Point vec;
   
   for(n1=0;n1<n;n1++)
      for(n2=n1+1;n2<n;n2++){
                          
         i_d=dij2[n1][n2];
         d=dist(pos[n1],pos[n2]);
         if(d>=i_d)continue; //include force and move nodes only if they are too close to each other;
         
         force+=((i_d-d)*(i_d-d)); //distantal force;
         
         vec=pos[n1]-pos[n2];
         if(fabs(d)<zero){
            vec.x=1.0;
            vec.y=0.0;
         }
         else{
            vec.x/=d;
            vec.y/=d;
         }
         mov[n1].x+=(vec.x/n);mov[n1].y+=(vec.y/n);
         mov[n2].x-=(vec.x/n);mov[n2].y-=(vec.y/n);
      }
      
   return force;
}

float Network::calc_force_compartments(){
   float force=0.0;
   int i,comp;
   int n=nodes->size();
   float w;
   for(i=0;i<n;i++){
      comp=(*nodes)[i].pts.compartment;
      if(comp==0)continue;
      if(pos[i].x<(*compartments)[comp].xmin){
         w=(*compartments)[comp].xmin-pos[i].x;
         mov[i].x+=w;
         force+=(w*w);
      }
      if(pos[i].x>(*compartments)[comp].xmax){
         w=(*compartments)[comp].xmax-pos[i].x;
         mov[i].x+=w;
         force+=(w*w);
      }
      if(pos[i].y<(*compartments)[comp].ymin){
         w=(*compartments)[comp].ymin-pos[i].y;
         mov[i].y+=w;
         force+=(w*w);
      }
      if(pos[i].y>(*compartments)[comp].ymax){
         w=(*compartments)[comp].ymax-pos[i].y;
         mov[i].y+=w;
         force+=(w*w);
      }
   }
   return force;
}      
         
void Network::move_nodes(){
   int n=nodes->size();
   for(int i=0;i<n;i++){
      pos[i]=pos[i]+mov[i];
      mov[i].x=mov[i].y=0.0;
   }
}
float Network::firm_distribution(){
   int i,j,k,m,n=nodes->size();
   int* neighbors;
   float average,beta,d,force=0.0;
   for(k=0;k<n;k++){
      if((*nodes)[k].pts.type!=compound)continue;
      neighbors=getNeighbors_arr(k);
      m=sizeof(neighbors)/sizeof(int);
      if(m<2)continue;
      baseNode=pos[k];
      average=2.0*PI/m;
      qsort(neighbors,m,sizeof(int),cmp_angle);
      for(i=0;i<m-1;i++){
         j=i+1;
         beta=lim(angle(pos[j]-baseNode)-angle(pos[i]-baseNode)-average);
         d=dist(pos[j],baseNode);
         force+=(d*d*sin(beta/10));
         mov[j]=mov[j]+(to_left(pos[j]-baseNode,beta/10)-pos[j]+baseNode);
      }
      free(neighbors);
   }
   return force;
}

void Network::init_compartments(){
   int cn=compartments->size(), n=nodes->size();
   int i,comp,k;
   float delta;
   xcomp.resize(cn); ycomp.resize(cn);
   for(comp=0;comp<cn;comp++){
      xcomp[comp].clear();
      ycomp[comp].clear();
   }
   for(i=0;i<n;i++){
      comp=(*nodes)[i].pts.compartment;
      if(comp==0)continue;
      xcomp[comp].push_back(pos[i].x);
      ycomp[comp].push_back(pos[i].y);
   }
   for(comp=1;comp<cn;comp++){
      k=xcomp[comp].size();
      sort(xcomp[comp].begin(),xcomp[comp].end());
      (*compartments)[comp].xmin=xcomp[comp][k/4];
      (*compartments)[comp].xmax=xcomp[comp][k*3/4];
      delta=((*compartments)[comp].xmax-(*compartments)[comp].xmin)/4;
      (*compartments)[comp].xmin-=delta;
      (*compartments)[comp].xmax+=delta;      
      k=ycomp[comp].size();
      sort(ycomp[comp].begin(),ycomp[comp].end());
      (*compartments)[comp].ymin=ycomp[comp][k/4];
      (*compartments)[comp].ymax=ycomp[comp][k*3/4];
      delta=((*compartments)[comp].ymax-(*compartments)[comp].ymin)/4;
      (*compartments)[comp].ymin-=delta;
      (*compartments)[comp].ymax+=delta;
      xcomp[comp].clear();
      ycomp[comp].clear();
   }
   xcomp.clear();
   ycomp.clear();
}   
   
void Network::adjust_compartments(){
   //adjust the boundaries of compartments, so that it tends the minimum rectangle contains all the nodes belongs to it.
   int n=nodes->size(),cn=compartments->size();
   int i,comp;   
   for(comp=1;comp<cn;comp++){ //the 0-th compartment is the infinite plane
      bcomp[comp].xmin=bcomp[comp].ymin=1e50;
      bcomp[comp].ymin=bcomp[comp].ymax=-1e50;
   }
   for(i=0;i<n;i++){
      comp=(*nodes)[i].pts.compartment;
      if(comp==0)continue;
      if(pos[i].x<bcomp[comp].xmin)bcomp[comp].xmin=pos[i].x;
      if(pos[i].x>bcomp[comp].xmax)bcomp[comp].xmax=pos[i].x;
      if(pos[i].y<bcomp[comp].ymin)bcomp[comp].ymin=pos[i].y;
      if(pos[i].y>bcomp[comp].ymax)bcomp[comp].ymax=pos[i].y;
   }
   for(comp=1;comp<cn;comp++){
      (*compartments)[comp].xmin+=((bcomp[comp].xmin-(*compartments)[comp].xmin)/n);
      (*compartments)[comp].xmax+=((bcomp[comp].xmax-(*compartments)[comp].xmax)/n);
      (*compartments)[comp].ymin+=((bcomp[comp].ymin-(*compartments)[comp].ymin)/n);
      (*compartments)[comp].ymax+=((bcomp[comp].ymax-(*compartments)[comp].ymax)/n);
   }  
}
void Network::get_ideal_distance(){
   int n=nodes->size(), m=edges->size(), i,n1,n2;
   dij1.resize(m);
   dij2.resize(n);
   for(i=0;i<m;i++){
      n1=(*edges)[i].from;
      n2=(*edges)[i].to;
      dij1[i]=get_dij1(n1,n2);
   }
   for(n1=0;n1<n;n1++){
      dij2[n1].resize(n);
      for(n2=n1+1;n2<n;n2++)dij2[n1][n2]=get_dij2(n1,n2);
   }
}

float Network::init_layout(){
   float force=0.0,d;
   int n=nodes->size(), m=edges->size();
   int i, n1, n2;
   Edgetype _type;   
   for(i=0;i<n;i++)cnt[i]=0;
   for(i=0;i<m;i++){
      _type=(*edges)[i].pts.type;
      if(_type!=product && _type!=substrate)continue;
      n1=(*edges)[i].from; //reaction.
      n2=(*edges)[i].to; //compound.
      mov[n1].x+=pos[n2].x;
      mov[n2].x+=pos[n1].x;
      cnt[n1]++; cnt[n2]++;
      if(_type==product){
         mov[n1].y+=(pos[n2].y+dij1[i]);
         mov[n2].y+=(pos[n1].y-dij1[i]);
      }
      else{
         mov[n1].y+=(pos[n2].y-dij1[i]);
         mov[n2].y+=(pos[n1].y+dij1[i]);
      }
   }
   for(i=0;i<n;i++){
      if(cnt[i]==0)continue;
      mov[i].x/=cnt[i]; mov[i].y/=cnt[i];
      d=dist(mov[i],pos[i]);
      force+=(d*d);
      pos[i].x=mov[i].x;
      pos[i].y=mov[i].y;
      mov[i].x=mov[i].y=0.0;
   }
   return force;
}
      
float Network::layout(){
       
   //copying coordinates from nodes[] to pos[];   
   int n=nodes->size(),i;   
   pos.resize(n);
   mov.resize(n);
   for(i=0;i<n;i++){
      pos[i].x=(*nodes)[i].pts.x;
      pos[i].y=(*nodes)[i].pts.y;
      mov[i].x=mov[i].y=0.0;
   }   
   bcomp.resize(compartments->size());
   
   get_ideal_distance();
   
   float cur_force,pre_force=inf;  
   int k=0, inc=0;
   
   //phase 1.
   cnt.resize(n);
   while(true){
      k++;
      cur_force=init_layout();
      if(fabs(pre_force-cur_force)<pre_force*err)break;
      pre_force=cur_force;
   }
   cout<<k<<endl; 
    
   //phase 2: adj and nadj.
   pre_force=inf;
   while(true){     
      k++;
      if(30<k && k<=100)cur_force=firm_distribution(); //firmly ditribute edges about a compound;
      else cur_force=0.0;
      cur_force=0.0;
      cur_force+=calc_force_adj();
      cur_force+=calc_force_nadj();
      move_nodes();
      //printf("%0.3f\n",cur_force);
      if(fabs(pre_force-cur_force)<pre_force*err)break;
      if(cur_force>pre_force)inc++;
      if(inc>log(1.0*n))break;
      pre_force=cur_force;
   }
   printf("number of iteration: %d\n",k);    
   printf("Total force = %0.3f\n",cur_force);
   
   init_compartments();
   
   //phase 3: bring in compartments;
   pre_force=inf;
   inc=0;
   while(true){
      k++;
      adjust_compartments();
      cur_force=calc_force_compartments();
      cur_force+=calc_force_adj();
      cur_force+=calc_force_nadj();
      move_nodes();
      //printf("%0.3f\n",cur_force);
      if(fabs(pre_force-cur_force)<pre_force*err)break;
      if(cur_force>pre_force)inc++;
      if(inc>log(1.0*n))break;
      pre_force=cur_force;    
   }
   
   printf("number of iteration: %d\n",k);    
   printf("Total force = %0.3f\n",cur_force); 
   //copying coordinations from pos[] to nodes[];
   for(i=0;i<n;i++){
      (*nodes)[i].pts.x=pos[i].x;
      (*nodes)[i].pts.y=pos[i].y;
   }
    
   pos.clear();
   mov.clear();
   dij1.clear();
   for(i=0;i<n;i++)dij2[i].clear();
   dij2.clear();
   
   return cur_force;
}
     
     
   
   
  
