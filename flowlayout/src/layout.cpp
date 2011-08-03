#include "network.h"
#include "functions.h"
#define inf 1e50
#define zero 1e-12
#define err 1e-4
struct comp_y{
  //this structure is used for initializing the compartment boundaries.
  int id;
  int cnt;
  float mid;
}; 
float Network::get_dij1(int i, int j){ 
   //ideal distance between adjacent nodes;
   float x=(*nodes)[i].pts.width * (*nodes)[i].pts.width + (*nodes)[i].pts.height * (*nodes)[i].pts.height;
   float y=(*nodes)[j].pts.width * (*nodes)[j].pts.width + (*nodes)[j].pts.height * (*nodes)[j].pts.height;
   return (sqrt(x)+sqrt(y))*0.6;
}

float Network::get_dij2(int i, int j){ 
   /*minimum distance between non-adjacent nodes.
     it should be much larger than the distance between adjacent nodes.
   */
   float x=(*nodes)[i].pts.width * (*nodes)[i].pts.width + (*nodes)[i].pts.height * (*nodes)[i].pts.height;
   float y=(*nodes)[j].pts.width * (*nodes)[j].pts.width + (*nodes)[j].pts.height * (*nodes)[j].pts.height;
   return 1.8*(sqrt(x)+sqrt(y));
}

bool Network::edge_cross(int i, int j){ 
   /* whether edge-i and edge-j cross each other.
      a1,a2 are two ends of edge-i, and b1,b2 are two ends of edge-j.
      edge-i and edge-j cross each other only if: 
        1. a1 and a2 are on different sides of b1, which can be judged using vector-products.
        2. a1 and a2 are on different sides of b2.
   */
   int a1,a2,b1,b2;
   a1=(*edges)[i].from;
   a2=(*edges)[i].to;
   b1=(*edges)[j].from;
   b2=(*edges)[j].to;
   if((pos[a1]-pos[b1])*(pos[a2]-pos[b1])<0 && (pos[a1]-pos[b2])*(pos[a2]-pos[b2])<0)return true;
   return false;
}

float Network::calc_force_adj(){
   /* This function calculates the force induced by edges (or adjacent nodes), and updates the displacements (movements) of nodes accordingly.
      And this force is composed of two parts: distant part and angular part. 
      1. distant part: the force induced by an edge at its ideal length is 0. Otherwise, force=(ideal_length-length)^2.
      2. angular part: for a reaction, we expect that its substrates in above (+0.5PI direction), products in below (-0.5PI direaction),
         and other related compounds on sides (either 0 or PI). 
         The angular force induced by an edge is: force=0.1*length*length*sin(0.5*fabs(lim(expected_angle-angle))).
      Responsively, the displacements also includes two parts.
      1. distant movement: we move both the compounds and the reaction along the edge such that the edge tends to its ideal length.
      2. angular movement: we rotate the compound around the reaction such that the edge tends to be at the expected angle. 
         Then we also adjust the default direction of the reaction a little bit.      
   */
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
      _type=(*edges)[i].pts.type; //edge type.
      
      vec=pos[n2]-pos[n1];
      i_d=dij1[i]; //ideal length of edge-i.
      d=dist(pos[n1],pos[n2]); //length of edge-i.
      force+=((d-i_d)*(d-i_d)); //distantal force;
      
      //distantal movements;
      if(fabs(d)<zero){
         if(_type==substrate)mov[n2].y+=(i_d/n); //substrates at top;
         else if(_type==product)mov[n2].y-=(i_d/n);  //products at bottom;
         else{
            //others on two sides.
            if(_left)mov[n2].x-=(i_d/n);
            else mov[n2].x+=(i_d/n);
            _left=!_left;
         }
      }
      else{
         //move the nodes along the edge so as to adjusting the edge to its ideal length.
         mov[n2].x+=(vec.x/d*(i_d-d)/n);
         mov[n2].y+=(vec.y/d*(i_d-d)/n);
         mov[n1].x-=(vec.x/d*(i_d-d)/n);
         mov[n1].y-=(vec.y/d*(i_d-d)/n);
      }
      
      //angular force;
      alpha=angle(vec); //angle of the edge w.r.t. the +x axis. i_alpha is the corresponding ideal angle.
      if(_type==substrate){
         //substates in above.
         i_alpha=0.5*PI+pts_dir[n1];
         beta=lim(i_alpha-alpha);
      }         
      else if(_type==product){
         //products in below.
         i_alpha=1.5*PI+pts_dir[n1];
         beta=lim(i_alpha-alpha);
      }
      else{ 
         //other compounds, rotating to the nearer side.
         i_alpha=pts_dir[n1]; beta=lim(i_alpha-alpha);
         float i_alpha1=PI+pts_dir[n1], beta1=lim(i_alpha-alpha);
         if(fabs(beta)>fabs(beta1)){
            beta=beta1;
            i_alpha=i_alpha1;
         }
      }
      force+=(d*d*sin(0.5*fabs(beta))*0.1); //angular force;
      mov[n2]=mov[n2]+(to_left(vec,0.1*beta/n)-vec); //angular movement; 
      mov_dir[n1]-=(0.1*beta); //adjust the default direction of the reaction a little bit (to the opposite direaction).
   }
   
   return force;
}

float Network::calc_force_nadj(){
   /* This function computes the force induced by non-adjacent nodes, and updates the movements of nodes.
      The force is calculated in this manner:
        1. If the distance between node-n1 and node-n2 (d) is larger than or equal to the the minimum distance (dij2[n1][n2]), then the force is 0; else
        2. force=0.1*(d-dij2[n1][n2])^2.
      If the force is greater than 0, the two nodes will repel each other. That is, they will move apart from each other along the line connecting them.
   */
   int n1,n2,n=nodes->size();
   float d,i_d,force=0.0;
   Point vec;
   
   for(n1=0;n1<n;n1++)
      for(n2=n1+1;n2<n;n2++){
         if(isadj[n1][n2])continue; //we only calculate the force and movements for nonadjacent nodes, so we skip the adjacent ones.             
         i_d=dij2[n1][n2]; //the minimum distance.
         d=dist(pos[n1],pos[n2]); //the distance between node-n1 and node-n2.
         if(d>=i_d)continue; //include force and move nodes only if they are too close to each other;
         force+=((i_d-d)*(i_d-d)*0.1); //distantal force;
         
         vec=pos[n1]-pos[n2]; //the vector from node-n1 to node-n1.
         if(fabs(d)<zero){
            vec.x=1.0;
            vec.y=0.0;
         }
         else{
            vec.x/=d;vec.x*=2; //x-displacement greater than y-displacement, since width is greater than height for almost all the nodes.
            vec.y/=d;
         }
         mov[n1].x+=(vec.x/n);mov[n1].y+=(vec.y/n); //two nodes repel each other, along the line connecting them.
         mov[n2].x-=(vec.x/n);mov[n2].y-=(vec.y/n); //two nodes repel each other, along the line connecting them.
      }
   return force;
}

float Network::calc_force_compartments(){
   /* This function computes the force induced by compartments, and updates the movements of nodes.
      Compartments are boxes which constrain the nodes belonging to it inside.
      A node experiences force if it is outside its compartment: force=d*d, where d is the shortest distance between the node and its compartment.
      If a node is outside its compartment, we simply move it to the nearest point inside the compartment.
      Specially, compartment-0 is the whole plane.
   */
      
   float force=0.0;
   int i,comp;
   int n=nodes->size();
   float w;
   for(i=0;i<n;i++){
      comp=(*nodes)[i].pts.compartment; //the compartment which node-i belongs to.
      if(comp==0)continue; //the compartment is the whole plane.
      if(pos[i].x<(*compartments)[comp].xmin){ //if it is outside the its compartment.
         w=(*compartments)[comp].xmin-pos[i].x; //calculate the x-displacement to its nearest point inside the compartment.
         mov[i].x+=w; //update the displacement.
         force+=(w*w); //accumulate force.
      }
      if(pos[i].x>(*compartments)[comp].xmax){
         w=(*compartments)[comp].xmax-pos[i].x;
         mov[i].x+=w;
         force+=(w*w);
      }
      if(pos[i].y<(*compartments)[comp].ymin){ //if it is outside the its compartment.
         w=(*compartments)[comp].ymin-pos[i].y; //calculate the x-displacement to its nearest point inside the compartment.
         mov[i].y+=(w+err); //update the displacement.
         force+=(w*w); //accumulate force.
      }
      if(pos[i].y>(*compartments)[comp].ymax){
         w=(*compartments)[comp].ymax-pos[i].y;
         mov[i].y+=(w-err);
         force+=(w*w);
      }
   }
   return force;
}      
         
void Network::move_nodes(){
   /*The function moves the nodes to a new position according the the movements (dispalcement vectors)computed, and then set all displacement vectors to 0.
     It also adjustes the default direction of reaction nodes.
   */
   int n=nodes->size();
   for(int i=0;i<n;i++){
      pos[i].x+=mov[i].x; //update position
      pos[i].y+=mov[i].y; //update position
      mov[i].x=mov[i].y=0.0; //set to zero.s
      pts_dir[i]=lim(pts_dir[i]+mov_dir[i]/n); //adjustes default direaction.
      mov_dir[i]=0.0; //set to zero.
   }
}

float Network::swap_force(int p1, int p2){
   int m,i,y,_type=(*nodes)[p1].pts.type;
   float force=0.0,i_d,d,alpha, i_alpha, beta, beta1;
   Point vec;
   VI neighbors= *((*nodes)[p1].neighbors); // it's a copy
   m=neighbors.size();
   //distantal force;
   for(i=0;i<m;i++){
      i_d=dij1[neighbors[i]];
      if(_type==reaction)y=(*edges)[neighbors[i]].to;
      else y=(*edges)[neighbors[i]].from;
      d=dist(pos[p1],pos[y]);
      force+=((i_d-d)*(i_d-d));
      d=dist(pos[p2],pos[y]);
      force-=((i_d-d)*(i_d-d));
   }
   
   //angular force;
   for(i=0;i<m;i++){
      i_d=dij1[neighbors[i]];
      y=(*edges)[neighbors[i]].to;              
      if(_type==reaction)vec=pos[y]-pos[p1]; 
      else vec=pos[p1]-pos[y];           
                       
      alpha=angle(vec);
      if(_type==substrate){
         i_alpha=0.5*PI+pts_dir[p1];
         beta=lim(i_alpha-alpha);
      }         
      else if(_type==product){
         i_alpha=1.5*PI+pts_dir[p1];
         beta=lim(i_alpha-alpha);
      }
      else{ //other compounds, rotating to the nearer side.
         i_alpha=pts_dir[p1]; beta=lim(i_alpha-alpha);
         float i_alpha1=PI+pts_dir[p1], beta1=lim(i_alpha-alpha);
         if(fabs(beta)>fabs(beta1)){
            beta=beta1;
            i_alpha=i_alpha1;
         }
      }
      force+=(d*d*sin(0.5*fabs(beta))); //angular force;
      
      if(_type==reaction)vec=pos[y]-pos[p2]; 
      else vec=pos[p2]-pos[y];
      alpha=angle(vec);
      if(_type==substrate){
         i_alpha=0.5*PI+pts_dir[p1];
         beta=lim(i_alpha-alpha);
      }         
      else if(_type==product){
         i_alpha=1.5*PI+pts_dir[p1];
         beta=lim(i_alpha-alpha);
      }
      else{ //other compounds, rotating to the nearer side.
         i_alpha=pts_dir[p1]; beta=lim(i_alpha-alpha);
         float i_alpha1=PI+pts_dir[p1], beta1=lim(i_alpha-alpha);
         if(fabs(beta)>fabs(beta1)){
            beta=beta1;
            i_alpha=i_alpha1;
         }
      }
      force-=(d*d*sin(0.5*fabs(beta))); //angular force;
   }
   neighbors.clear(); 
   return force;
}

bool Network::swap_node(){
   int i,j,k,m,n=nodes->size(),tem;
   VI *neighbors;
   float f1,f2;
   Point baseNode, temp;
   bool flag=false;
   for(k=0;k<n;k++){
      neighbors= getNeighbors(k);
      m=neighbors->size();
      if(m==1)continue;
      baseNode=pos[k];
      for(i=0;i<m-1;i++)
         for(j=i+1;j<m;j++)
            if(lim(angle(pos[(*neighbors)[j]]-baseNode))<lim(angle(pos[(*neighbors)[i]]-baseNode))){
               tem=(*neighbors)[i];(*neighbors)[i]=(*neighbors)[j];(*neighbors)[j]=tem;
            }
      for(i=0;i<m;i++){
         j=i+1;
         if(j==m)j=0;
         f1=swap_force((*neighbors)[i],(*neighbors)[j]);
         f2=swap_force((*neighbors)[j],(*neighbors)[i]);
         if(f1+f2>0){
            temp=pos[(*neighbors)[i]];
            pos[(*neighbors)[i]]=pos[(*neighbors)[j]];
            pos[(*neighbors)[j]]=temp;
            flag=true;            
         }
      }
      //neighbors->clear();
	  delete neighbors; // we should delete neighbors in the loop as it is generated in each iteration.
   }
//   free(neighbors);
   return flag;
} 
      
float Network::firm_distribution(){
   int i,j,jj,k,m,n=nodes->size(),tem,lnk;
   VI *neighbors;
   float average,beta,d,force=0.0;
   Point baseNode;
   for(k=0;k<n;k++){
      neighbors= getNeighbors(k);
      m=neighbors->size();
      if(m<4)continue;
      baseNode=pos[k];
      for(i=0;i<m-1;i++)
         for(j=i+1;j<m;j++)
            if(lim(angle(pos[(*neighbors)[j]]-baseNode)+pts_dir[k])<lim(angle(pos[(*neighbors)[i]]-baseNode)+pts_dir[k])){
               tem=(*neighbors)[i];(*neighbors)[i]=(*neighbors)[j];(*neighbors)[j]=tem;
            }               
      for(i=0;i<m-1;i++){
         j=i+1; if(j==m)j=0;
         jj=i-1; if(jj<0)jj=m-1;
         average=lim(lim(angle(pos[(*neighbors)[j]]-baseNode))+lim(angle(pos[(*neighbors)[jj]]-baseNode)))*0.5;
         beta=lim(average-lim(angle(pos[(*neighbors)[i]]-baseNode)));
         d=dist(pos[(*neighbors)[i]],baseNode);
         force+=(d*d*sin(0.5*fabs(beta)))*0.05/m;
         mov[j]=mov[j]+(to_left(pos[(*neighbors)[j]]-baseNode,beta*0.05/m)-pos[(*neighbors)[j]]+baseNode);
      }
	  delete neighbors; // we should delete neighbors in the loop as it is generated in each iteration.
   }
   return force;
}

void Network::init_compartments(){
   int cn=compartments->size(), n=nodes->size();
   int i,j,comp,k;
   float tem;
   vector<comp_y>ymid;
   ymid.resize(cn);
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
   ymid.clear();
}   
   
void Network::adjust_compartments(){
   //adjust the boundaries of compartments, so that it tends the minimum rectangle contains all the nodes belongs to it.
   int n=nodes->size(),cn=compartments->size();
   int i,j,comp;  
   float delta; 
   for(comp=1;comp<cn;comp++){ //the 0-th compartment is the infinite plane
      bcomp[comp].xmin=bcomp[comp].ymin=inf;
      bcomp[comp].xmax=bcomp[comp].ymax=-inf;
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
      isadj[n1][n2]=isadj[n2][n2]=true;
   }
}

float Network::init_layout(){
   float force=0.0,d,cost1,cost2;
   int n=nodes->size(), m=edges->size();
   int i, n1, n2;
   Edgetype _type;
   for(i=0;i<m;i++){
      _type=(*edges)[i].pts.type;
      //if(_type!=product && _type!=substrate)continue;
      n1=(*edges)[i].from; //reaction.
      n2=(*edges)[i].to; //compound.
      if(_type==product){
         mov[n1].y+=(pos[n2].y+dij1[i]);
         mov[n2].y+=(pos[n1].y-dij1[i]);
         mov[n1].x+=pos[n2].x;
         mov[n2].x+=pos[n1].x;
      }
      else if(_type==substrate){
         mov[n1].y+=(pos[n2].y-dij1[i]);
         mov[n2].y+=(pos[n1].y+dij1[i]);
         mov[n1].x+=pos[n2].x;
         mov[n2].x+=pos[n1].x;
      }
      else{
         cost1=fabs((pos[n1].x-dij1[i])-mov[n2].x/deg[n2]);
         cost2=fabs((pos[n1].x+dij1[i])-mov[n2].x/deg[n2]);
         if(cost1<cost2)mov[n2].x+=(pos[n1].x-dij1[i]);
         else mov[n2].x+=(pos[n1].x+dij1[i]);
         mov[n2].y+=pos[n1].y;
         //mov[n1].y+=pos[n2].y;
      }         
   }
   for(i=0;i<n;i++){
      if(deg[i]==0)continue;
      mov[i].x/=deg[i]; mov[i].y/=deg[i];
      d=dist(mov[i],pos[i]);
      force+=(d*d);
      pos[i].x=mov[i].x;
      pos[i].y=mov[i].y;
      mov[i].x=mov[i].y=0.0;
   }
   return force;
}

void Network::post_pro_dist(){
   int n=nodes->size(),i,j,n1,n2,nn,m,l;
   vector< vector<bool> >cm;
   VI *neighbors,*neis;
   cm.resize(n);
   for(n1=0;n1<n;n1++){
      cm[n1].resize(n);
      neighbors=getNeighbors(n1);
      m=neighbors->size();
      for(i=0;i<m;i++){
         nn=(*neighbors)[i];
         neis=getNeighbors(nn);
         l=neis->size();
         for(j=0;j<l;j++){
            n2=(*neis)[j];
            cm[n1][n2]=true;
         }
         delete neis;
      }
      delete neighbors;
   }
   for(n1=0;n1<n;n1++)
      for(n2=n1+1;n2<n;n2++)
         if(cm[n1][n2])dij2[n1][n2]*=0.8;
   for(n1=0;n1<n;n1++)cm[n1].clear();
   cm.clear();
} 
      
float Network::post_pro(int _round){
   int m=edges->size(),n=nodes->size(),n1,n2,i;
   float d,i_d,force=0.0;
   Point vec;
   
   for(i=0;i<m;i++){                    
      n1=(*edges)[i].from; //reaction
      n2=(*edges)[i].to; //compound;
      if(_round==1 && deg[n1]>3 && deg[n2]>3)continue;
      vec=pos[n2]-pos[n1];
      i_d=dij1[i];
      if(fabs(vec.y)*1.2>=(*nodes)[n1].pts.height+(*nodes)[n2].pts.height)i_d*=0.8;
      if(fabs(vec.x)*1.2>=(*nodes)[n1].pts.width+(*nodes)[n2].pts.width)i_d*=0.9;
      d=dist(pos[n1],pos[n2]);
      if(d<i_d && d>i_d*0.7)continue;
      if(_round==1)force+=pow(2.0,(double)5.0*fabs(i_d-d));
      else force+=pow(2.0,(double)1.0*fabs(i_d-d));
      //distantal movements;
      if(_round==1){
         mov[n2].x+=(2*vec.x/d*(i_d-d)/n);
         mov[n2].y+=(2*vec.y/d*(i_d-d)/n);
         mov[n1].x-=(2*vec.x/d*(i_d-d)/n);
         mov[n1].y-=(2*vec.y/d*(i_d-d)/n);
      }
      else{      
         mov[n2].x+=(vec.x/d*(i_d-d)/n);
         mov[n2].y+=(vec.y/d*(i_d-d)/n);
         mov[n1].x-=(vec.x/d*(i_d-d)/n);
         mov[n1].y-=(vec.y/d*(i_d-d)/n);
      }
   }
   if(_round==1)return force;
   for(n1=0;n1<n;n1++)
      for(n2=n1+1;n2<n;n2++){
         //if(isadj[n1][n2])continue;
         if(isadj[n1][n2])i_d=dij2[n1][n2]*0.3;
         else i_d=dij2[n1][n2]*0.7;
         d=dist(pos[n1],pos[n2]);
         if(d>=i_d)continue; //include force and move nodes only if they are too close to each other;
         if(fabs(pos[n1].x-pos[n2].x)>(*nodes)[n1].pts.width+(*nodes)[n2].pts.width)continue;
         if(fabs(pos[n1].y-pos[n2].y)>(*nodes)[n1].pts.height+(*nodes)[n2].pts.height)continue;
         
         force+=pow(2.0,(double)5.0*fabs(i_d-d)); //distantal force;
         vec=pos[n1]-pos[n2];
         if(fabs(d)<zero){
            vec.x=i_d;
            vec.y=0.0;
         }
         else{
            vec.x=2*vec.x*(i_d-d)/d;
            vec.y=3*vec.y*(i_d-d)/d;
         }
         if(fabs(vec.y)<zero){
            vec.y=i_d;
            vec.x*=5;
         }
         mov[n1].x+=(vec.x/n);mov[n1].y+=(vec.y/n);
         mov[n2].x-=(vec.x/n);mov[n2].y-=(vec.y/n);
      }
   return force;      
}
  
bool Network::near_swap(){
   int n1,n2,n=nodes->size();
   float i_d,d,f1,f2;
   bool flag=false;
   Point temp;
   for(n1=0;n1<n;n1++)
      for(n2=n1+1;n2<n;n2++){          
         i_d=dij2[n1][n2]*0.1;
         d=dist(pos[n1],pos[n2]);
         if(d>=i_d)continue;         
         f1=swap_force(n1,n2);
         f2=swap_force(n2,n1);
         if(f1+f2>0){
            temp=pos[n1];pos[n1]=pos[n2];pos[n2]=temp;
            flag=true;            
         }
      }
   return flag;
}  

float Network::min_edge_crossing(int deglim){
   int a1,a2,b1,b2,i,j,mindeg;
   int m=edges->size();
   float force=0.0;
   Point tem1, tem2;
   for(i=0;i<m;i++)
      for(j=i+1;j<m;j++){                         
         if(!edge_cross(i,j))continue;
         a1=(*edges)[i].from;
         a2=(*edges)[i].to;
         b1=(*edges)[j].from;
         b2=(*edges)[j].to;
         if(a1==a2)continue;
         if(b1==b2)continue;
         force+=1.0;
         mindeg=min_four(deg[a1],deg[a2],deg[b1],deg[b2]); //the node with minimum connections.
         if(mindeg>deglim)continue;
         if(mindeg==deg[a1]){ //rotate a1 around a2;
            tem1=pos[a2]+pos[b2]-pos[b1];
            tem2=pos[a2]+pos[b1]-pos[b2];
            if(dist(tem1,pos[a1])<dist(tem2,pos[a1]))pos[a1]=tem1;
            else pos[a1]=tem2;
         }
         else if(mindeg==deg[a2]){
            tem1=pos[a1]+pos[b2]-pos[b1];
            tem2=pos[a1]+pos[b1]-pos[b2];
            if(dist(tem1,pos[a2])<dist(tem2,pos[a2]))pos[a2]=tem1;
            else pos[a2]=tem2;
         }
         else if(mindeg==deg[b1]){
            tem1=pos[b2]+pos[a2]-pos[a1];
            tem2=pos[b2]+pos[a1]-pos[a2];
            if(dist(tem1,pos[b1])<dist(tem2,pos[b1]))pos[b1]=tem1;
            else pos[b1]=tem2;
         }
         else{
            tem1=pos[b1]+pos[a2]-pos[a1];
            tem2=pos[b1]+pos[a1]-pos[a2];
            if(dist(tem1,pos[b2])<dist(tem2,pos[b2]))pos[b2]=tem1;
            else pos[b2]=tem2;
         }
      }
   return force;
}      
   
void Network::brute_force_post_pro(){
   int n=nodes->size(),n1,n2,k,comp1,comp2;
   float dx,dy;
   VI lnk;
   VP ps;
   Point tem;
   lnk.resize(n);
   ps.resize(n);
   for(n1=0;n1<n;n1++){
      ps[n1]=pos[n1];
      lnk[n1]=n1;
   }
   for(n1=0;n1<n;n1++)
      for(n2=n1+n1;n2<n;n2++)
         if(p_compare(ps[n1],ps[n2])<0){
            tem=ps[n1];ps[n1]=ps[n2];ps[n2]=tem;
            k=lnk[n1];lnk[n1]=lnk[n2];lnk[n2]=k;
         }
   for(n2=1;n2<n;n2++)
      for(n1=0;n1<n2;n1++){
          dx=(*nodes)[lnk[n1]].pts.height+(*nodes)[lnk[n1]].pts.height;
          dy=(*nodes)[lnk[n1]].pts.width+(*nodes)[lnk[n1]].pts.width;
          comp1=(*nodes)[lnk[n1]].pts.compartment;
          comp2=(*nodes)[lnk[n2]].pts.compartment;
          if(fabs(ps[n2].y-ps[n1].y)<0.51*dy && fabs(ps[n2].x-ps[n1].x)<0.51*dx){
             if(ps[n1].y+0.51*dy>(*compartments)[comp2].ymax){ //cannot move in y-direaction because of compartment rule.
                ps[n2].x=ps[n1].x+0.51*dx;
                continue;
             }
             if(ps[n2].y>ps[n1].y+zero)ps[n2].y=ps[n1].y+0.51*dy;
             else ps[n2].x=ps[n1].x+0.51*dx;
          }
      }
   for(n1=0;n1<n;n1++)pos[lnk[n1]]=ps[n1];
   lnk.clear();
   ps.clear();
}      
                           
float Network::layout(){
       
   //copying coordinates from nodes[] to pos[];   
   int n=nodes->size(),i;   
   pos.resize(n);
   mov.resize(n);
   pts_dir.resize(n);
   mov_dir.resize(n);
   deg.resize(n);
   for(i=0;i<n;i++){
      pos[i].x=(*nodes)[i].pts.x;
      pos[i].y=(*nodes)[i].pts.y;
      mov[i].x=mov[i].y=0.0;
      pts_dir[i]=(*nodes)[i].pts.dir;
      mov_dir[i]=0.0;
      deg[i]=((*nodes)[i].neighbors)->size();
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

   bool flag=true;
   k=0;
   while(flag){
      flag=swap_node();
      if(k<10)near_swap();
      k++;
      if(k>n)break;
   }
   
   k=inc=0;
   pre_force=inf;
   while(true){
      k++;
      cur_force=calc_force_adj();
      if(k>300)cur_force+=firm_distribution();
      move_nodes();
      if(fabs(pre_force-cur_force)<pre_force*err)break;
      if(cur_force>pre_force)inc++;
      if(inc>log(1.0*n))break;
      pre_force=cur_force;
   }
   printf("number of iteration: %d\n",k);    
   printf("Total force = %0.3f\n",cur_force);

   //phase 2: adj and nadj.
   k=inc=0;
   pre_force=inf;
   while(true){     
      k++;
      cur_force=0.0;
      if(300<k)cur_force+=firm_distribution(); //firmly ditribute edges about a compound;
      cur_force+=calc_force_adj();
      cur_force+=calc_force_nadj();
      move_nodes();
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
      cur_force+=calc_force_compartments();
      cur_force+=calc_force_adj();
      cur_force+=calc_force_nadj();
      move_nodes();
      if(fabs(pre_force-cur_force)<pre_force*err)break;
      if(cur_force>pre_force)inc++;
      if(inc>log(1.0*n))break;
      pre_force=cur_force;    
   }
   printf("number of iteration: %d\n",k);    
   printf("Total force = %0.3f\n",cur_force); 
   
   //phase4: post processing. 
   
   post_pro_dist();
   
   pre_force=inf;
   while(true){
      cur_force=min_edge_crossing(1);
      if(cur_force>=pre_force)break;
      pre_force=cur_force;
      cout<<cur_force<<endl;
   }
   
   pre_force=inf;
   k=inc=0;
   while(true){
      k++;
      near_swap();
      cur_force=post_pro(1);
      move_nodes();
      adjust_compartments();
      cur_force+=calc_force_compartments();
      move_nodes();
      if(fabs(pre_force-cur_force)<pre_force*err)break;
      if(cur_force>pre_force)inc++;
      if(inc>log(1.0*n))break;
      pre_force=cur_force;
   }
   
   pre_force=inf;
   k=inc=0;
   while(true){
      k++;
      near_swap();
      cur_force=post_pro(2);
      move_nodes();
      adjust_compartments();
      cur_force+=calc_force_compartments();
      move_nodes();
      if(fabs(pre_force-cur_force)<pre_force*err)break;
      if(cur_force>pre_force)inc++;
      if(inc>log(1.0*n))break;
      pre_force=cur_force;
   } 
   printf("number of iteration: %d\n",k);    
   printf("Total force = %0.3f\n",cur_force); 
   
  // brute_force_post_pro();
   
   cout<<endl;
   for(i=1;i<compartments->size();i++){
      cout<<(*compartments)[i].name<<endl;
      printf("%0.3f %0.3f\n",(*compartments)[i].ymin, (*compartments)[i].ymax);
   }
   
   //copying coordinations from pos[] to nodes[];
   for(i=0;i<n;i++){
      (*nodes)[i].pts.x=pos[i].x;
      (*nodes)[i].pts.y=pos[i].y;
      (*nodes)[i].pts.dir=mov_dir[i];
   }
    
   pos.clear();
   mov.clear();
   dij1.clear();
   for(i=0;i<n;i++){
      dij2[i].clear();
      isadj[i].clear();
   }
   dij2.clear();
   isadj.clear();
   mov_dir.clear();
   deg.clear();
   free(above_comp);
   
   return cur_force;
}
     
     
   
   
  
