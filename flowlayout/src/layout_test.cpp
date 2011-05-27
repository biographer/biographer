#include "network.h"

int main(){
    freopen("data1.txt","r",stdin);
    freopen("summary.txt","w",stdout);
    char edgetypes[][20]={"Directed", "Undirected", "Substrate", "Product", "Catalyst", "Activator", "Inhibitor"};
    char nodetypes[][20]={"None", "Reaction", "Compound","Other"};
    Network nw=Network();
    int n,m,i,j,k,_index;
    Nodetype _type;
    char s[100],t[100];
    float _x,_y, _width, _height,_dir;
    scanf("%d",&n);
    for(i=0;i<n;i++){
       scanf("%d\n",&_index);
       gets(t);
       if(strcmp(t,"Compound")==0)_type=compound;
       else if(strcmp(t,"Reaction")==0)_type=reaction;
       else if(strcmp(t,"Other")==0)_type=other;
       else _type=none;
       gets(s);
       scanf("%f%f",& _x,& _y);
       scanf("%f%f%f",& _width,& _height,& _dir);      
       nw.addNode(_index, _type, s, _width, _height, _x, _y, _dir);            
    }
    scanf("%s\n",s);
    scanf("%d\n",&m);

    while(m--){
       scanf("%s %d %d\n",s,&i,&j);
       for(k=0;k<7;k++)
         if(strcmp(edgetypes[k],s)==0)break;
       nw.addEdge(i,j,(Edgetype)k);
    }
     
    double _force=nw.layout();
   
    printf("%0.3f\n",_force);
    n=nw.nodes->size();
    Node tem=Node();
    for(i=0;i<n;i++){
      printf("%d\n",i);
      tem = (*(nw.nodes))[i];
      printf("%s\n",nodetypes[(int)(tem.pts.type)]);
      cout<<tem.pts.name<<endl;
      printf("%0.3f %0.3f\n%0.3f %0.3f\n%0.3f\n",tem.pts.x, tem.pts.y, tem.pts.width, tem.pts.height, tem.pts.dir);
    } 
    return 0;
}
