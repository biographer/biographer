#include "network.h"
#include "functions.h"
#define inf 1e50
#define zero 1e-12
#define err 1e-4
struct comp_y{
  int id;
  int cnt;
  float mid;
}; 
float Network::get_dij1(int i, int j){ //ideal distance between adjacent nodes;
   float x=(*nodes)[i].pts.width * (*nodes)[i].pts.width + (*nodes)[i].pts.height * (*nodes)[i].pts.height;
   float y=(*nodes)[j].pts.width * (*nodes)[j].pts.width + (*nodes)[j].pts.height * (*nodes)[j].pts.height;
   return (sqrt(x)+sqrt(y))*1;
}

float Network::get_dij2(int i, int j){ //minimum distance between non-adjacent nodes;
   float x=(*nodes)[i].pts.width * (*nodes)[i].pts.width + (*nodes)[i].pts.height * (*nodes)[i].pts.height;
   float y=(*nodes)[j].pts.width * (*nodes)[j].pts.width + (*nodes)[j].pts.height * (*nodes)[j].pts.height;
   return 3*(sqrt(x)+sqrt(y));
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
         mov[n1].x-=(vec.x/d*(i_d-d)/n);
         mov[n1].y-=(vec.y/d*(i_d-d)/n);
      }
      
      //angular force;
      alpha=angle(vec);
      if(_type==substrate){
         i_alpha=0.5*PI+pts_dir[n1];
         beta=lim(i_alpha-alpha);
      }         
      else if(_type==product){
         i_alpha=1.5*PI+pts_dir[n1];
         beta=lim(i_alpha-alpha);
      }
      else{ //other compounds, rotating to the nearer side.
         i_alpha=pts_dir[n1]; beta=lim(i_alpha-alpha);
         float i_alpha1=PI+pts_dir[n1], beta1=lim(i_alpha-alpha);
         if(fabs(beta)>fabs(beta1)){
            beta=beta1;
            i_alpha=i_alpha1;
         }
      }
      force+=(i_d*i_d*sin(0.5*beta)*0.1); //angular force;
      mov[n2]=mov[n2]+(to_left(vec,0.1*beta/n)-vec); //angular movement; 
      mov_dir[n1]-=(0.1*beta);
   }
   
   return force;
}

float Network::calc_force_nadj(){
   int n1,n2,n=nodes->size();
   float d,i_d,force=0.0;
   Point vec;
   
   for(n1=0;n1<n;n1++)
      for(n2=n1+1;n2<n;n2++){
         if(isadj[n1][n2])continue;              
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
      pts_dir[i]=lim(pts_dir[i]+mov_dir[i]/n);
   }
}

float Network::swap_force(int p1, int p2){
   int m,i;
   float force=0.0,i_d,d;
   VI neighbors= *getNeighbors(p1);
   m=neighbors.size();
   for(i=0;i<m;i++){
      i_d=dij2[p1][neighbors[i]]*0.3333;
      d=dist(pos[p1],pos[neighbors[i]]);
      force+=((i_d-d)*(i_d-d));
      d=dist(pos[p2],pos[neighbors[i]]);
      force-=((i_d-d)*(i_d-d));
   }
   neighbors.clear();
   return force;
}

bool Network::swap_node(){
   int i,j,k,m,n=nodes->size(),tem;
   VI neighbors;
   float f1,f2;
   Point baseNode, temp;
   bool flag=false;
   for(k=0;k<n;k++){
      neighbors= *getNeighbors(k);
      m=neighbors.size();
      if(m==1)continue;
      baseNode=pos[k];
      for(i=0;i<m-1;i++)
         for(j=i+1;j<m;j++)
            if(lim(angle(pos[neighbors[j]]-baseNode))<lim(angle(pos[neighbors[i]]-baseNode))){
               tem=neighbors[i];neighbors[i]=neighbors[j];neighbors[j]=tem;
            }
      for(i=0;i<m;i++){
         j=i+1;
         if(j==m)j=0;
         f1=swap_force(neighbors[i],neighbors[j]);
         f2=swap_force(neighbors[j],neighbors[i]);
         if(f1+f2>0){
            temp=pos[neighbors[i]];
            pos[neighbors[i]]=pos[neighbors[j]];
            pos[neighbors[j]]=temp;
            flag=true;            
         }
      }
   }
   neighbors.clear();
   return flag;
} 
      
float Network::firm_distribution(){
   int i,j,k,m,n=nodes->size(),tem;
   VI neighbors;
   float average,beta,d,force=0.0;
   Point baseNode;
   for(k=0;k<n;k++){
      if((*nodes)[k].pts.type!=compound)continue;
      neighbors= *getNeighbors(k);
      m=neighbors.size();
      if(m<2)continue;
      baseNode=pos[k];
      for(i=0;i<m-1;i++)
         for(j=i+1;j<m;j++)
            if(lim(angle(pos[neighbors[j]]-baseNode))<lim(angle(pos[neighbors[i]]-baseNode))){
               tem=neighbors[i];neighbors[i]=neighbors[j];neighbors[j]=tem;
            }               
      average=2.0*PI/m;
      for(i=0;i<m-1;i++){
         j=i+1;
         beta=lim(angle(pos[neighbors[i]]-baseNode)+average-angle(pos[neighbors[j]]-baseNode));
         d=dist(pos[neighbors[i]],baseNode);
         force+=(d*d*sin(0.5*beta));
         mov[j]=mov[j]+(to_left(pos[neighbors[j]]-baseNode,beta/10)-pos[neighbors[j]]+baseNode);
      }
      neighbors.clear();
   }
   return force;
}

void Network::init_compartments(){
   int cn=compartments->size(), n=nodes->size();
   int i,j,comp,k;
   float tem;
   vector<comp_y>ymid;
   ymid.resize(cn);
  // above_comp.resize(cn);
   above_comp=(int *)malloc(sizeof(int)*cn);
   for(comp=0;comp<cn;comp++){
      ymid[comp].id=comp;
      ymid[comp].cnt=0;
      ymid[comp].mid=0.0;
   }
   for(i=0;i<n;i++){
      comp=(*nodes)[i].pts.compartment;
      if(comp==0)continue;
      ymid[comp].cnt++;
      ymid[comp].mid+=pos[i].y;
   }
   for(comp=0;comp<cn;comp++)ymid[comp].mid/=ymid[comp].cnt;
   //sort the compartments by y.
   for(i=1;i<cn;i++)
       for(j=i+1;j<cn;j++)
          if(ymid[i].mid>ymid[j].mid){
             k=ymid[i].id;ymid[i].id=ymid[j].id;ymid[j].id=k;
             k=ymid[i].cnt;ymid[i].cnt=ymid[j].cnt;ymid[j].cnt=k;
             tem=ymid[i].mid;ymid[i].mid=ymid[j].mid;ymid[j].mid=tem;
          }
   //initializing the compartments (ymin and ymax);
   (*compartments)[ymid[1].id].ymin=-inf;
   for(i=1;i<cn-1;i++){
      (*compartments)[ymid[i].id].ymax
      =(*compartments)[ymid[i+1].id].ymin
      =(ymid[i].mid+ymid[i+1].mid)/2;
      above_comp[ymid[i].id]=ymid[i+1].id;
   }
   (*compartments)[ymid[cn-1].id].ymax=inf;
   above_comp[ymid[cn-1].id]=0;
   //xmin,xmax;
   for(i=1;i<cn;i++){
      (*compartments)[i].xmin=-inf;
      (*compartments)[i].xmax=inf;
   }
}   
   
void Network::adjust_compartments(){
   //adjust the boundaries of compartments, so that it tends the minimum rectangle contains all the nodes belongs to it.
   int n=nodes->size(),cn=compartments->size();
   int i,j,comp;  
   float delta; 
   for(comp=1;comp<cn;comp++){ //the 0-th compartment is the infinite plane
      bcomp[comp].xmin=bcomp[comp].ymin=1e50;
      bcomp[comp].xmax=bcomp[comp].ymax=-1e50;
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
   for(i=1;i<cn;i++){
     j=above_comp[i];
     if(j==0)continue;
     delta=(*compartments)[i].ymax-(*compartments)[j].ymin;
     if(delta<=0)continue;
     delta/=2;
     (*compartments)[i].ymax-=delta;
     (*compartments)[j].ymin+=delta;
   }
}
void Network::get_ideal_distance(){
   int n=nodes->size(), m=edges->size(), i,n1,n2;
   dij1.resize(m);
   dij2.resize(n);
   isadj.resize(n);
   
   for(n1=0;n1<n;n1++){
      dij2[n1].resize(n);
      isadj[n1].resize(n);
      for(n2=0;n2<n;n2++){
         dij2[n1][n2]=get_dij2(n1,n2);
         isadj[n1][n2]=false;
      }
   }
   for(i=0;i<m;i++){
      n1=(*edges)[i].from;
      n2=(*edges)[i].to;
      dij1[i]=get_dij1(n1,n2);
      isadj[n1][n2]=true;
   }
}

float Network::init_layout(){
   float force=0.0,d,cost1,cost2;
   int n=nodes->size(), m=edges->size();
   int i, n1, n2;
   Edgetype _type;   
   cnt.resize(n);
   for(i=0;i<n;i++)cnt[i]=0;
   for(i=0;i<m;i++){
      _type=(*edges)[i].pts.type;
      //if(_type!=product && _type!=substrate)continue;
      n1=(*edges)[i].from; //reaction.
      n2=(*edges)[i].to; //compound.
      cnt[n1]++; cnt[n2]++;
      if(_type==product){
         mov[n1].y+=(pos[n2].y+dij1[i]);
         mov[n2].y+=(pos[n1].y-dij1[i]);
         mov[n1].x+=pos[n2].x;
         mov[n2].x+=pos[n1].x;
      }
      else if(_type==product){
         mov[n1].y+=(pos[n2].y-dij1[i]);
         mov[n2].y+=(pos[n1].y+dij1[i]);
         mov[n1].x+=pos[n2].x;
         mov[n2].x+=pos[n1].x;
      }
      else{
         cost1=fabs((pos[n1].x-dij1[i])-mov[n2].x/cnt[n2]);
         cost2=fabs((pos[n1].x+dij1[i])-mov[n2].x/cnt[n2]);
         if(cost1<cost2)mov[n2].x+=(pos[n1].x-dij1[i]);
         else mov[n2].x+=(pos[n1].x+dij1[i]);
         mov[n2].y+=pos[n1].y;
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
   
float Network::post_pro(){
   int m=edges->size(),n=nodes->size(),n1,n2,i;
   float d,i_d,force=0.0;
   Point vec;
   
   for(i=0;i<m;i++){
                    
      n1=(*edges)[i].from; //reaction
      n2=(*edges)[i].to; //compound;
      
      vec=pos[n2]-pos[n1];
      i_d=dij1[i]*0.7;
      d=dist(pos[n1],pos[n2]);
      if(d<i_d)continue;
      force+=((d-i_d)*(d-i_d));

      //distantal movements;
      mov[n2].x+=(vec.x/d*(i_d-d)/n);
      mov[n2].y+=(vec.y/d*(i_d-d)/n);
      mov[n1].x-=(vec.x/d*(i_d-d)/n);
      mov[n1].y-=(vec.y/d*(i_d-d)/n);
   }
   
   for(n1=0;n1<n;n1++)
      for(n2=n1+1;n2<n;n2++){
         if(isadj[n1][n2])continue;              
         i_d=dij2[n1][n2]*0.3;
         d=dist(pos[n1],pos[n2]);
         if(d>=i_d)continue; //include force and move nodes only if they are too close to each other;
         
         force+=((i_d-d)*(i_d-d)); //distantal force;
         
         vec=pos[n1]-pos[n2];
         if(fabs(d)<zero){
            vec.x=i_d;
            vec.y=0.0;
         }
         else{
            vec.x=vec.x*(i_d-d)/d;
            vec.y=vec.x*(i_d-d)/d;
         }
         mov[n1].x+=(vec.x/n);mov[n1].y+=(vec.y/n);
         mov[n2].x-=(vec.x/n);mov[n2].y-=(vec.y/n);
      }
   return force;      
}
   
float Network::layout(){
       
   //copying coordinates from nodes[] to pos[];   
   int n=nodes->size(),i;   
   pos.resize(n);
   mov.resize(n);
   pts_dir.resize(n);
   mov_dir.resize(n);
   for(i=0;i<n;i++){
      pos[i].x=(*nodes)[i].pts.x;
      pos[i].y=(*nodes)[i].pts.y;
      mov[i].x=mov[i].y=0.0;
      pts_dir[i]=(*nodes)[i].pts.dir;
      mov_dir[i]=0.0;
   }   
   bcomp.resize(compartments->size());
   
   get_ideal_distance();

   float cur_force,pre_force=inf;  
   int k, inc;
   
   //phase 1. initialization
   k=inc=0;
   while(true){
      k++;
      cur_force=init_layout();
      if(fabs(pre_force-cur_force)<pre_force*err)break;
      pre_force=cur_force;
   }
   printf("number of iteration: %d\n",k);    
   printf("Total force = %0.3f\n",cur_force);

   k=inc=0;
   pre_force=inf;
   while(true){
     k++;
     cur_force=calc_force_adj();
     move_nodes();
     if(fabs(pre_force-cur_force)<pre_force*err)break;
      if(cur_force>pre_force)inc++;
      if(inc>log(1.0*n))break;
      pre_force=cur_force;
   }
   printf("number of iteration: %d\n",k);    
   printf("Total force = %0.3f\n",cur_force);
   
   bool flag=true;
   k=0;
   while(flag){
      flag=swap_node();
      k++;
      if(k>n)break;
   }

   //phase 2: adj and nadj.
   k=inc=0;
   pre_force=inf;
   while(true){     
      k++;
      cur_force=0.0;
      if(100<k)cur_force+=firm_distribution(); //firmly ditribute edges about a compound;
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
   k=inc=0;
   while(true){
      k++;
      cur_force=0.0;
      adjust_compartments();
      cur_force+=firm_distribution();
      cur_force+=calc_force_compartments();
      cur_force+=calc_force_adj();
      cur_force+=calc_force_nadj();
      move_nodes();
      if(fabs(pre_force-cur_force)<pre_force*err)break;
      if(cur_force>pre_force)inc++;
      if(inc>log(1.0*n))break;
     // printf("%0.3f\n",cur_force);
      pre_force=cur_force;    
   }
   printf("number of iteration: %d\n",k);    
   printf("Total force = %0.3f\n",cur_force); 
  
   //phase4: post processing.
   pre_force=inf;
   while(true){
      cur_force=post_pro();
      adjust_compartments();
      cur_force+=calc_force_compartments();
      move_nodes();
      if(fabs(pre_force-cur_force)<pre_force*err)break;
      pre_force=cur_force;
   } 
   
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
     
     
   
   
  
