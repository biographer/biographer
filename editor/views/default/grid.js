bui.grid = { 
    nodes:[], 
    edges:[], 
    width:0,
    height:0,
    matrix_nodes: [],
    grid_space: 80//px
}
//=====================================================
bui.grid.spiral = function(length){
    //--------------------------------------
    var spiral_count4 = 0;
    var spiral_cur_edge_len = 1;
    var sprial_cur_edge_steps = 0;
    var spiral_add_x_abs = 0;
    var spiral_add_y_abs = 1;
    var mulitplierx = ['x',1,1,-1,1];
    var mulitpliery = ['x',1,-1,1,1];
    var spiral_setps = [];
    var counter = 0;
    //--------------------------------------
    while(true){
        //-----------------------
        if (sprial_cur_edge_steps%spiral_cur_edge_len==0){
            tmp = spiral_add_y_abs;
            spiral_add_y_abs = spiral_add_x_abs;
            spiral_add_x_abs = tmp;
            if(spiral_count4>3) spiral_count4=0;
            ++spiral_count4;
        }
        if (sprial_cur_edge_steps+1>2*spiral_cur_edge_len){
            sprial_cur_edge_steps = 0;
            ++spiral_cur_edge_len; 
        }
        ++sprial_cur_edge_steps;
        spiral_setps.push([spiral_add_x_abs*mulitplierx[spiral_count4], spiral_add_y_abs*mulitpliery[spiral_count4]]);
        ++counter;
        if(counter>=length) break
    }
    return spiral_setps

}
//=====================================================
bui.grid.init = function(nodes, edges, width, height){
    bui.grid.nodes = nodes;
    bui.grid.edges = edges;
    bui.grid.spiral_setps = bui.grid.spiral(10000);
    var spiral_setps = bui.grid.spiral_setps;
    if(width==undefined || height==undefined){
        width = 2*Math.sqrt(nodes.length)
            height = 3*Math.sqrt(nodes.length)
    }
    var max_x = Math.round(width);
    var max_y = Math.round(height);
    var grid_space = bui.grid.grid_space;
    var pos,i;
    //-------------------------------------------------------
    //check if max_x is smaller than the max_x pos of the max x node pos
    //same for max_y
    for(i=0; i<nodes.length; ++i){
        pos = nodes[i].absolutePositionCenter();
        if(pos.x>max_x*grid_space) max_x = Math.round(pos.x/grid_space);
        if(pos.y>max_y*grid_space) max_y = Math.round(pos.y/grid_space);
    }
    bui.grid.width = max_x;
    bui.grid.height = max_y;
    //-------------------------------------------------------
    //init node matrix
    var matrix_nodes = [];
    for (var x=0; x<=max_x; ++x){
        matrix_nodes.push([]);
        for (var y=0; y<=max_y; ++y)
            matrix_nodes[x].push(undefined);
    }
    //-------------------------------------------------------
    //position elements on grid, only one element is allowed on each grid point
    var cp,cur_x,cur_y,loop;
    for(i=0; i<nodes.length; ++i){
        pos = nodes[i].absolutePositionCenter();
        cur_x = Math.round(pos.x/grid_space);
        cur_y = Math.round(pos.y/grid_space);
        //----------------------------
        var count = 0;
        while(true){
            if(cur_x>=0 && cur_x<=max_x && cur_y>=0 && cur_y<=max_y && matrix_nodes[cur_x][cur_y] == undefined){
                matrix_nodes[cur_x][cur_y] = 1;
                nodes[i].x = cur_x;
                nodes[i].y = cur_y;
                break;
            }
            spiral_setp = spiral_setps[count];
            cur_x += spiral_setp[0];
            cur_y += spiral_setp[1];
            ++count;
        }
    }
    var move = 0;
    for(i=0;i<max_x; ++i) 
        if(matrix_nodes[i][0] == 1) 
            move = grid_space;
    if (move == 0) 
        for(i=0;i<max_y; ++i) 
            if(matrix_nodes[0][i] == 1) 
                move = grid_space;
    for(i=0; i<nodes.length; ++i) 
        nodes[i].absolutePositionCenter(nodes[i].x*grid_space+move,nodes[i].y*grid_space+move); 
    bui.grid.matrix_nodes = matrix_nodes;
}
//=====================================================
bui.grid.layout = function(){
    var nodes = bui.grid.nodes;
    var edges = bui.grid.edges;
    var grid_space = bui.grid.grid_space;
    var matrix_nodes = bui.grid.matrix_nodes;
    var node2endpoints = {};
    var s,t,i;
    var spiral_setps = bui.grid.spiral_setps;
    //-----------------------
    //important init buckets!
    bui.grid.init_buckets();
    //-----------------------
    for(var ce=0; ce<edges.length; ++ce){
        s = edges[ce].source();
        t = edges[ce].target();
        if(s.id() in node2endpoints) node2endpoints[s.id()].push([t,ce]);
        else node2endpoints[s.id()] = [[t,ce]];
        if(t.id() in node2endpoints) node2endpoints[t.id()].push([s,ce]);
        else node2endpoints[t.id()] = [[s,ce]];
    }

    var cni = 0;//current node index
    var tmp_ni,min_ni,node,target,best_mp,endpoints;
    var step = 0;
    console.log('line crossings before: '+bui.grid.num_intersections());
    while(true){
        node = nodes[cni];
        //console.log('step '+step+' curnode'+cni+'/'+nodes.length+'---'+node.id());
        best_mp = undefined;
        endpoints = node2endpoints[node.id()];
        //--------------------------------------
        ++step;
        if(step>nodes.length) break;
        //--------------------------------------
        ++cni;
        if (cni>=nodes.length-1) cni=0;
        //--------------------------------------
        if (endpoints == undefined){
            for(var cx=0;cx<bui.grid.width; ++cx){
                for(var cy=0;cy<bui.grid.height; ++cy){
                    if(matrix_nodes[cx][cy]==undefined){
                        node.absolutePositionCenter( cx*grid_space, cy*grid_space ); 
                        matrix_nodes[cx][cy] = 1;
                        matrix_nodes[node.x][node.y] = undefined;
                        node.x=c.x;
                        node.y=c.y;
                    }
                }
            }
            continue
        }
        min_ni = bui.grid.num_i_fromto(node, endpoints);
        var xmin_ni = min_ni;
        if (min_ni == 0) continue;
        //--------------------------
        var cx = node.x;
        var cy = node.y;
        var cur_spiral_step;
        var counter = 0;
        while(true){
            //-----------------------
            if ( cx>bui.grid.width && cy>bui.grid.height ) break;
            //console.log('c '+counter+' cx '+cx+' cy '+cy);
            cur_spiral_step = spiral_setps[counter];
            cx += cur_spiral_step[0];
            cy += cur_spiral_step[1];
            if(cx>=0 && cx<=bui.grid.width && cy>=0 && cy<=bui.grid.height && matrix_nodes[cx][cy] == undefined){
                t = { x : cx, y : cy, id: function(){return node.id()} };
                tmp_ni = bui.grid.num_i_fromto(t,endpoints);
                //--------------------------------------
                if(tmp_ni<min_ni){
                    min_ni = tmp_ni;
                    best_mp = {x:t.x, y:t.y};
                }
                if(tmp_ni==0){
                    break;
                }
            }
            ++counter;
        }
        //--------------------------------------
        if(best_mp != undefined){
            before_apply = bui.grid.num_intersections();//DEBUG
            matrix_nodes[best_mp.x][best_mp.y] = 1;
            matrix_nodes[node.x][node.y] = undefined;
            node.x=best_mp.x;
            node.y=best_mp.y;
            for(var i=0; i<endpoints.length; ++i) bui.grid.set_buckets(endpoints[i][1],'clear');
            alert(xmin_ni+'-> '+min_ni+' -- '+before_apply+'->'+bui.grid.num_intersections());//DEBUG
            node.absolutePositionCenter( best_mp.x*grid_space, best_mp.y*grid_space ); //DEBUG
        }
    }
    var move = 0;
    for(i=0;i<=bui.grid.width; ++i) 
        if(matrix_nodes[i][0] == 1) 
            move = grid_space;
    if (move == 0) 
        for(i=0;i<=bui.grid.height; ++i) 
            if(matrix_nodes[0][i] == 1) 
                move = grid_space;
    for(i=0; i<nodes.length; ++i) 
        nodes[i].absolutePositionCenter(nodes[i].x*grid_space+move,nodes[i].y*grid_space+move); 
    console.log('line crossings after: '+bui.grid.num_intersections());
}
//=====================================================
bui.grid.num_i_fromto = function(from_node, to_nodes){
    var counter = 0;
    var to_node,edge, check_edges;
    for(var i=0;i<to_nodes.length; ++i){
        to_node = to_nodes[i][0];//pos 0 is the point pos 1 is the edge id the point belongs to
        check_edges = bui.grid.get_possible_intersecting_edges(from_node,to_node);
        for(var i=0; i<check_edges.length; ++i){
            edge = bui.grid.edges[check_edges[i]];
            //edge.addClass('mRED');
            if( 
            (edge.source().id() != from_node.id() && edge.target().id() != from_node.id() && edge.source().id() != to_node.id() && edge.target().id() != to_node.id() )
            ||
            (edge.source().id() == from_node.id() && edge.target().id() != to_node.id())
            || 
            (edge.target().id() == from_node.id() && edge.source().id() != to_node.id() )
            ){
                if(bui.grid.intersect(from_node, to_node, edge.source(), edge.target())){
                    //console.log(JSON.stringify([from_node, to_node, edge.source(), edge.target()]));
                    ++counter;
                }
            }
        }
        /*alert('check_edges '+from_node.id()+'->'+to_node.id()+' : '+JSON.stringify(check_edges));
        for(edge_id in check_edges){
            edge = bui.grid.edges[edge_id];
            edge.removeClass('mRED');
        }*/
    }
    return counter;
}
//=====================================================
bui.grid.get_possible_intersecting_edges = function(node1, node2){
    var s,e,i;
    var edge_collectionx = {};
    var edge_collectiony = {};
    var edge_collection = [];
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
bui.grid.num_intersections = function(){
    var counter = 0;
    for(var i=0; i<bui.grid.edges.length; ++i){
        for(var j=i+1; j<bui.grid.edges.length; ++j){
            edge1 = bui.grid.edges[i];
            edge2 = bui.grid.edges[j];
            if(bui.grid.intersect(bui.grid.edges[i].source(),bui.grid.edges[i].target(),bui.grid.edges[j].source(),bui.grid.edges[j].target())){
                ++counter;
            }
        }
    }
    return counter
}

//=====================================================
bui.grid.ccw = function(A,B,C){
    return (C.y-A.y)*(B.x-A.x) > (B.y-A.y)*(C.x-A.x)
}

bui.grid.intersect = function(A,B,C,D){
        if(A.y==B.y&&B.y==C.y&&C.y==D.y){
            if( (A.x>C.x&&B.x>C.x &&A.x>D.x&&B.x>D.x) || (A.x<C.x&&B.x<C.x &&A.x<D.y&&B.x<D.x) ) return false
            else return true
        }else if(A.x==B.x&&B.x==C.x&&C.x==D.x){
            if( (A.y>C.y&&B.y>C.y &&A.y>D.y&&B.y>D.y) || (A.y<C.y&&B.y<C.y &&A.y<D.y&&B.y<D.y) ) return false
            else return true
        }
        return bui.grid.ccw(A,C,D) != bui.grid.ccw(B,C,D) && bui.grid.ccw(A,B,C) != bui.grid.ccw(A,B,D)
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
bui.grid.set_buckets = function(edge_id, clear){
    var i;
    var xbuckets = bui.grid.xbuckets;
    var ybuckets = bui.grid.ybuckets;
    var edges = bui.grid.edges;
    edge = edges[edge_id];
    //-------------------------
    if(clear != undefined){
        //alert('xbuckets: '+JSON.stringify(xbuckets)+' ybuckets '+JSON.stringify(ybuckets));
        for(i=0;i<xbuckets.length; ++i) if(edge_id in xbuckets[i]) delete xbuckets[i][edge_id];
        for(i=0;i<ybuckets.length; ++i) if(edge_id in ybuckets[i]) delete ybuckets[i][edge_id];
    }
    //x-----------------------
    if(edge.source().x<edge.target().x){
        s=edge.source().x;
        e=edge.target().x;
    }else{
        e=edge.source().x;
        s=edge.target().x;
    }
    for(i=s;i<=e; ++i){ xbuckets[i][edge_id] = 1 }
    //y-----------------------
    if(edge.source().y<edge.target().y){
        s=edge.source().y;
        e=edge.target().y;
    }else{
        e=edge.source().y;
        s=edge.target().y;
    }
    for(i=s;i<=e; ++i){ 
        //console.log('yb '+i+' '+edge.source().label()+' '+edge.target().label());
        //console.log(ybuckets)
        ybuckets[i][edge_id] = 1;
    }
}
