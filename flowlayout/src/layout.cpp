#include "network.h"
#define inf 1e50
#define zero 1e-12
#define err 1e-5

double Network::get_dij(int i, int j){ 
   double x=(*nodes)[i].pts.width * (*nodes)[i].pts.width + (*nodes)[i].pts.height * (*nodes)[i].pts.height;
   double y=(*nodes)[j].pts.width * (*nodes)[j].pts.width + (*nodes)[j].pts.height * (*nodes)[j].pts.height;
   return (x+y)*4;
}

double Network::get_dis(int i, int j){
   return sqrt((a[i].x-a[j].x)*(a[i].x-a[j].x)+(a[i].y-a[j].y)*(a[i].y-a[j].y));
}

double Network::calc_force(){
   int n=a.size();
   double sum=0.0;
   int i,j;
   double w,idis,dis;
   for(i=0;i<n;i++)
      for(j=0;j<n;j++)
         if(i!=j){
            idis=get_dij(i,j);
            dis=get_dis(i,j);
            if(fabs(idis)<zero)idis=zero;            
            w = 1.0/idis/idis * (dis-idis)*(dis-idis);
            sum+=w;
         }
   return sum;
}       
   
double Network::get_new_pos(){
   int n=a.size();
   int i,j,k;
   double deno=0.0, dis,idis,w;
   b[0]=a[0];
   for(i=1;i<n;i++){
      b[i].x=b[i].y=0.0;
      for(j=0;j<i;j++)
         if(i!=j){
            idis=get_dij(i,j);
            dis=get_dis(i,j);
            if(fabs(idis)<zero)idis=zero;
            if(fabs(dis)<zero)dis=zero;
            w=1.0/idis/idis * (b[j].x+idis*(a[i].x-a[j].x)/dis);
            b[i].x+=w;
            w=1.0/idis/idis * (b[j].y+idis*(a[i].y-a[j].y)/dis);
            b[i].y+=w;
         }
   }
}          
    
double Network::layout(){
       
   //copying coordinates from nodes[] to a[];   
   int n=nodes->size(),i;   
   a.resize(n);
   b.resize(n);
   for(i=0;i<n;i++){
      a[i].x=(*nodes)[i].pts.x;
      a[i].y=(*nodes)[i].pts.y;
   }   
   
   double cur_force,pre_force=inf;  
   int k=0;
    
   while(true){
     cur_force=calc_force();
     if(pre_force-cur_force < pre_force*err)break;
     get_new_pos();
     a=b;
     pre_force=cur_force;
     k++;
     if(k>1000)break;
   }
   
   //copying coordinations from a[] to nodes[];
   for(i=0;i<n;i++){
      (*nodes)[i].pts.x=a[i].x;
      (*nodes)[i].pts.y=a[i].y;
   }
   
   return cur_force;
}
     
     
   
   
  
