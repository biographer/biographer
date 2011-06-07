#include "network.h"
#include "functions.h"
#define inf 1e50
#define zero 1e-12
#define err 1e-4

VP pos, mov;
VCP icompart; //initial compartments;
VI ins_dif,plink,compartlink; // ins_dif: nodes inside a compartment-size of the compartment;
Point baseNode; //for sorting the edges.
   
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
      i_d=get_dij1(n1,n2);
      d=dist(pos[n1],pos[n2]);
      force+=((d-i_d)*(d-i_d)); //distantal force;
      
      //distantal movements;
      if(fabs(d)<zero){
         if(_type==substrate)mov[n2].y+=(i_d/n); //substrates at top;
         else if(_type==product)mov[n2].y-=(i_d/n);  //products at bottom;
         else{
            //other compounds on either side;
            //if(rand()%2)mov[n2].x+=(i_d/n);
            //else mov[n2].x-=(i_d)/n; 
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

float Network::calc_force_compartments(){
   float force=0.0;
   int i,comp;
   int n=nodes->size();
   float w;
   for(i=0;i<n;i++){
      comp=(*nodes)[i].pts.compartment;
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
     // printf("%7.3f %7.3f     %7.3f %7.3f\n",pos[i].x,pos[i].y,mov[i].x,mov[i].y);
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

void Network::find_compartments(){
   float minix,maxix,miniy,maxiy,maxh,maxw;
   int n=nodes->size();
   int i,j,k,totcompart,nh;
   float nowx,nowy;
   
   //finding maxh, maxw;
   maxh=maxw=0.0;
   for(i=0;i<n;i++){
      if((*nodes)[i].pts.height>maxh)maxh=(*nodes)[i].pts.height;
      if((*nodes)[i].pts.width>maxw)maxw=(*nodes)[i].pts.width;
   }
   maxh*=1.2; maxw*=1.2; //initial sizeof boxes, gap in between is of size (0.5maxh * 0.5maxw);
   
   //finding minix, maxix, miniy, maxiy;
   minix=miniy=1e50; maxix=maxiy=-1e50;
   for(i=0;i<n;i++){
      if(pos[i].x<minix)minix=pos[i].x;
      if(pos[i].y<miniy)miniy=pos[i].y;
      if(pos[i].x>maxix)maxix=pos[i].x;
      if(pos[i].y>maxiy)maxiy=pos[i].y;
   }
   
   //the initial compartments;
   icompart.clear();
   ins_dif.clear();
   totcompart=0;
   nowy=miniy;
   while(nowy<=maxiy){
      nh=0; //nh: number of compartments per row;
      nowx=minix;
      while(nowx<=maxix){
         nh++;
         totcompart++;
         icompart.push_back(Compartment(nowx,nowx+maxw,nowy,nowy+maxh));
         ins_dif.push_back(-1);
         nowx+=(1.5*maxw);
      }
      nowy+=(1.5*maxh);
   }
   
   //number of nodes inside each compartments;
   compartlink.resize(n);
   for(i=0;i<n;i++){
      k=(int)((pos[i].x-minix)/(1.5*maxh));
      j=(int)((pos[i].y-miniy)/(1.5*maxw));
      k=k*nh+j;
      compartlink[i]=k;
      ins_dif[k]++;
   }
   
   //extending the compartments with more nodes; some compartments may overlap
   for(i=0;i<totcompart;i++)
      if(ins_dif[i]>0){
         icompart[i].xmin-=(maxw*0.5*ins_dif[i]);
         icompart[i].xmax+=(maxw*0.5*ins_dif[i]);
      }
   
   //copying the non-empty compartments from "icompart" to "compartments".
   plink.resize(totcompart);
   k=0;
   for(i=0;i<totcompart;i++)
      if(ins_dif[i]>=0){
         plink[i]=k++;
         compartments->push_back(icompart[i]);
      }
   for(i=0;i<n;i++)
      (*nodes)[i].pts.compartment=plink[compartlink[i]];
      
   icompart.clear();
   compartlink.clear();
   ins_dif.clear();
   plink.clear();
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
   
   //phase 1.
   while(true){     
      k++;
      if(50<k && k<=150)cur_force=firm_distribution(); //firmly ditribute edges about a compound;
      else cur_force=0.0;
      cur_force+=calc_force_adj();
      cur_force+=calc_force_nadj();
      move_nodes();
      if(fabs(pre_force-cur_force)<pre_force*err)break;
      pre_force=cur_force;    
   }
   cout<<"number of iteration: "<<k<<endl;
   cout<<cur_force<<endl;
   
   find_compartments();
   
   //phase 2: bring in compartments;
   while(true){
      k++;
      cur_force=calc_force_compartments();
      cur_force+=calc_force_adj();
      cur_force+=calc_force_nadj();
      move_nodes();
      if(fabs(pre_force-cur_force)<pre_force*err)break;
      pre_force=cur_force;    
   }
   
   cout<<"number of iteration: "<<k<<endl;    
   cout<<cur_force<<endl;
   //copying coordinations from pos[] to nodes[];
   for(i=0;i<n;i++){
      (*nodes)[i].pts.x=pos[i].x;
      (*nodes)[i].pts.y=pos[i].y;
   }
   
   pos.clear();
   mov.clear();
   
   return cur_force;
}
     
     
   
   
  
