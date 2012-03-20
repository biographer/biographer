//=====================================================
bui.grid.get_possible_intersecting_edges = function(node1, node2){
    var s,e,i;
    var edge_collectionx = {};
    var edge_collectiony = {};
    var edge_collection = [];
    for(var i = 0; i<bui.grid.edges.length; ++i){
        edge_collection.push(i);
    }
    return edge_collection;
    
    //x-------------------
    if(node1.x<node2.x){
        s=node1.x;
        e=node2.x;
    }else{
        e=node1.x;
        s=node2.x;
    }
    for(i=s; i<=e; ++i){
        //console.log('x '+i+' : '+JSON.stringify(bui.grid.xbuckets[i]));
        for(key in bui.grid.xbuckets[i]){
            edge_collectionx[key] = 1;
        }
    }
    //y-------------------
    if(node1.y<node2.y){
        s=node1.y;
        e=node2.y;
    }else{
        e=node1.y;
        s=node2.y;
    }
    for(i=s; i<=e; ++i){
        for(key in bui.grid.ybuckets[i]){
            edge_collectiony[key] = 1;
        }
    }
    //-----------------------
    //alert('edge_collectiony'+edge_collectiony+'edge_collectionx'+edge_collectionx);
    for(var xkey in edge_collectionx){
        if(xkey in edge_collectiony) edge_collection.push(xkey);
    }
    return edge_collection
}
//=====================================================
bui.grid.init_buckets = function(){
    var edges = bui.grid.edges;
    var xbuckets = [];
    var ybuckets = [];
    for(var x=0; x<bui.grid.height; ++x){
        xbuckets.push({});
    }
    for(var y=0; y<bui.grid.width; ++y){
        ybuckets.push({});
    }
    bui.grid.xbuckets = xbuckets;
    bui.grid.ybuckets = ybuckets;
    var edge,s,e;
    for(var ne=0;ne<edges.length; ++ne){
        bui.grid.set_buckets(ne);
    }
}
//=====================================================
bui.grid.set_buckets = function(edge_index, clear){
    var i;
    var xbuckets = bui.grid.xbuckets;
    var ybuckets = bui.grid.ybuckets;
    var edge = bui.grid.edges[edge_index];
    if(edge==undefined){
        alert('no found '+edge_index);
    }
    //-------------------------
    if(clear != undefined){
        for(i=0;i<xbuckets.length; ++i) if(edge_index in xbuckets[i]) delete xbuckets[i][edge_index];
        for(i=0;i<ybuckets.length; ++i) if(edge_index in ybuckets[i]) delete ybuckets[i][edge_index];
    }
    //x-----------------------
    if(edge.source().x<edge.target().x){
        s=edge.source().x;
        e=edge.target().x;
    }else{
        e=edge.source().x;
        s=edge.target().x;
    }
    for(i=s;i<=e; ++i){ xbuckets[i][edge_index] = 1 }
    //y-----------------------
    if(edge.source().y<edge.target().y){
        s=edge.source().y;
        e=edge.target().y;
    }else{
        e=edge.source().y;
        s=edge.target().y;
    }
    for(i=s;i<=e; ++i){ 
        ybuckets[i][edge_index] = 1;
    }
}
