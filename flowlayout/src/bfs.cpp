

class BFS{
   public:
      BFS(Network &_net, int seed):nw(_net), visited(vector<unsigned char>(_net.nodes.size(),0)),dist(vector<double>(_net.nodes.size(),-1)),pred(vector<int>(_net.nodes.size(),-1)),cur(0){
         dist[seed]=0;
      };
      BFS(Network &_net, VI &seed):nw(_net), visited(vector<unsigned char>(_net.nodes.size(),0)),dist(vector<double>(_net.nodes.size(),-1)),pred(vector<int>(_net.nodes.size(),-1)),cur(0){
         int i,n=seed.size();
         for (i=0;i<n;i++){
            dist[seed[i]]=0;
         }
      };
      int next();
      VI path(int nodeidx=-1);
   protected:
      Network &nw;
      vector<unsigned char> visited;
      vector<double> dist;
      VI pred;
      double cur;
      int curidx;
};

int BFS::next(){
   int i,n=nw.nodes.size();
   double min=DBL_MAX;
   curidx=-1;
   for (i=0;i<n;i++){
      if (!visited[i] && dist[i]>=cur && dist[i]<=min){
         min=dist[i];
         curidx=i;
      }
   }
   if (curidx==-1) return -1; // BFS complete
   cur=min;
   visited[curidx]=1;
   const VI &ne=nw.nodes[curidx].neighbors;
   int m=ne.size();
   for (i=0;i<m;i++){
      int other=nw.edges[ne[i]].from;
      if (other==curidx) other=nw.edges[ne[i]].to;
      double d_other=cur+nw.edges[ne[i]].len;
      if (dist[other]<0 || dist[other]>d_other){
         dist[other]=d_other;
         pred[other]=curidx;
      }
   }
   return curidx;
}
VI BFS::path(int idx) {
   VI p;
   if (idx<0) idx=curidx;
   if (idx<0) {
      printf("no current index\n");
      return p;
   }
   while (pred[idx]>=0){
      p.push_back(idx);
      idx=pred[idx];
   }
   p.push_back(idx);
   reverse(p.begin(),p.end());
   return p;
}