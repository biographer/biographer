#include "network.h"
#include "functions.h"
#define inf 1e50
#define zero 1e-12
#define err 1e-4

float Network::get_dij1(int i, int j){ //ideal distance between adjacent nodes;
   float x=(*nodes)[i].pts.width * (*nodes)[i].pts.width + (*nodes)[i].pts.height * (*nodes)[i].pts.height;
   float y=(*nodes)[j].pts.width * (*nodes)[j].pts.width + (*nodes)[j].pts.height * (*nodes)[j].pts.height;
   return (sqrt(x)+sqrt(y))*2;
}

float Network::get_dij2(int i, int j){ //minimum distance between non-adjacent nodes;
   float x=(*nodes)[i].pts.width * (*nodes)[i].pts.width + (*nodes)[i].pts.height * (*nodes)[i].pts.height;
   float y=(*nodes)[j].pts.width * (*nodes)[j].pts.width + (*nodes)[j].pts.height * (*nodes)[j].pts.height;
   return 0.2*(sqrt(x)+sqrt(y));
}

float Network::calc_force_adj(){
   float force=0.0;
   float d,i_d,alpha,i_alpha,beta;
   Point vec; //vector from pos[n1] to pos[n2];
   int n1,n2,m,n,i;
   Edgetype _type;
   m=edges->size();
   n=nodes->size();

   for(i=0;i<m;i++){
                    
      n1=(*edges)[i].from; //reaction
      n2=(*edges)[i].to; //compound;
      _type=(*edges)[i].pts.type;
      
      vec=pos[n2]-pos[n1];
      i_d=get_dij1(n1,n2);
      d=dist(pos[n1],pos[n2]);
      force+=((d-i_d)*(d-i_d)); //distantal force;
      
      //distantal movements;
      if(fabs(d)<zero){
         if(_type==substrate)mov[n2].y+=(i_d/n); //substrates at top;
         else if(_type==product)mov[n2].y-=(i_d/n);  //products at bottom;
         else{
            //other compounds on either side;
            if(rand()%2)mov[n2].x+=(i_d/n);
            else mov[n2].x-=(i_d)/n; 
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
      force+=(i_d*i_d*sin(beta/2)); //angular force;
      mov[n2]=mov[n2]+(to_left(vec,beta/n)-vec); //angular movement; 
   }
   
   return force;
}

float Network::calc_force_nadj(){
   int n1,n2,n=nodes->size();
   float d,i_d,force=0.0;
   Point vec;
   
   for(n1=0;n1<n;n1++)
      for(n2=0;n2<n;n2++){
                          
         i_d=get_dij2(n1,n2);
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
         
void Network::move_nodes(){
   int n=nodes->size();
   for(int i=0;i<n;i++){
     // printf("%7.3f %7.3f     %7.3f %7.3f\n",pos[i].x,pos[i].y,mov[i].x,mov[i].y);
      pos[i]=pos[i]+mov[i];
      mov[i].x=mov[i].y=0.0;
   }
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
   
   float cur_force,pre_force=inf;  
   int k=0;
   
   srand(time(0));
   while(true){     
     cur_force=calc_force_adj();
     cur_force+=calc_force_nadj();
     move_nodes();
     printf("%0.3f\n",cur_force);
     if(fabs(pre_force-cur_force)<pre_force*err)break;
     pre_force=cur_force;    
   }
   
   //copying coordinations from pos[] to nodes[];
   for(i=0;i<n;i++){
      (*nodes)[i].pts.x=pos[i].x;
      (*nodes)[i].pts.y=pos[i].y;
   }
   
   return cur_force;
}
     
     
   
   
  
