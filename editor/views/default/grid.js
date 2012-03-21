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
bui.grid.add_padding = function(){
    var nodes = bui.grid.nodes;
    var matrix_nodes = bui.grid.matrix_nodes;
    var i;
    var nbucketx = bui.grid.nbucketx;
    var nbuckety = bui.grid.nbuckety;
    var ebucketx = bui.grid.ebucketx;
    var ebuckety = bui.grid.ebuckety;
    for(i=0;i<bui.grid.height; ++i){
        if(matrix_nodes[0][i] != undefined){
            //---------
            matrix_nodes.push([]);
            for(i=0; i<bui.grid.height; ++i) matrix_nodes[bui.grid.width].push(undefined);
            ++bui.grid.width;
            nbucketx.push({});
            ebucketx.push({});
            //---------
            for(i=0; i<nodes.length; ++i){
                matrix_nodes[nodes[i].x][nodes[i].y] = undefined;
                ++nodes[i].x;
                matrix_nodes[nodes[i].x][nodes[i].y] = 1;
            } 
            break;
        }
    } 
    for(i=0;i<bui.grid.width; ++i){
        if(matrix_nodes[i][0] != undefined){
            //---------
            for(i=0; i<bui.grid.width; ++i) matrix_nodes[i].push(undefined);
            ++bui.grid.height;
            nbuckety.push({});
            ebuckety.push({});
            //---------
            for(i=0; i<nodes.length; ++i){
                matrix_nodes[nodes[i].x][nodes[i].y] = undefined;
                ++nodes[i].y;
                matrix_nodes[nodes[i].x][nodes[i].y] = 1;
            } 
            break;
        }
    } 
    //----------------------
    //---------------
    for(i=0;i<bui.grid.height; ++i){
        if(matrix_nodes[bui.grid.width-1][i] != undefined){
            matrix_nodes.push([]);
            for(i=0; i<bui.grid.height; ++i) matrix_nodes[bui.grid.width].push(undefined);
            ++bui.grid.width;
            nbucketx.push({});
            ebucketx.push({});
        }
    }
    for(i=0;i<bui.grid.width; ++i){
        if(matrix_nodes[i][bui.grid.height-1] != undefined){
            for(i=0; i<bui.grid.width; ++i) matrix_nodes[i].push(undefined);
            ++bui.grid.height;
            nbuckety.push({});
            ebuckety.push({});
        }
    }
    //---------------
    //----------------------
    
    //bui.grid.matrix_nodes = matrix_nodes;
    bui.grid.render_current();
};
//=====================================================
bui.grid.init = function(nodes, edges, width, height){
    //-------------------------------------------------------
    var node_id2node_idx = {};
    for(var i=0; i<nodes.length; ++i) node_id2node_idx[nodes[i].id()]=i;
    for(var i=0; i<edges.length; ++i){
        edges[i].source_idx = node_id2node_idx[edges[i].lsource.id()];
        edges[i].target_idx = node_id2node_idx[edges[i].ltarget.id()];
    }
    //-------------------------------------------------------
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
    bui.grid.width = max_x+1;
    bui.grid.height = max_y+1;
    //-------------------------------------------------------
    //init node matrix
    var matrix_nodes = [];
    for (var x=0; x<=max_x; ++x){
        matrix_nodes.push([]);
        for (var y=0; y<=max_y; ++y)
            matrix_nodes[x].push(undefined);
    }
    //-------------------------------------------------------
    //-------------------------------------------------------
    //compartements
    var compartements = []
    var source_id, target_id;
    for(var i=0; i<edges.length; ++i){
        var edge = edges[i];
        if(edge.lsource.parent() == undefined) source_id = undefined
        else source_id = edge.lsource.parent().id()
        if(edge.ltarget.parent() == undefined) target_id = undefined
        else target_id = edge.ltarget.parent().id()

        if(target_id != source_id){
            // we got two compartments!
            console.log('two compartments detected '+source_id+' and '+target_id);
        }
    }
    //-------------------------------------------------------
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
                matrix_nodes[cur_x][cur_y] = i;
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
    bui.grid.render_current();
    // insert empty padding around matrix
    bui.grid.matrix_nodes = matrix_nodes;
    //------------------------------------------------
    bui.grid.set_nodes_as_edges();
}
//=====================================================
bui.grid.layout = function(){
    var nodes = bui.grid.nodes;
    var edges = bui.grid.edges;
    var grid_space = bui.grid.grid_space;
    var matrix_nodes = bui.grid.matrix_nodes;
    var i;
    var spiral_setps = bui.grid.spiral_setps;
    var num_empty_fields = bui.grid.width*bui.grid.height - nodes.length;
    node_idx2nodes_idx = {};
    node_idx2edges_idx = {};
    node_idx2nodes_in_idx = {};
    node_idx2nodes_in = {};
    node_idx2nodes_out = {};
    //-----------------------
    //important init buckets!
    bui.grid.init_ebuckets();
    bui.grid.init_nbuckets();
    //-----------------------
    for(var i=0; i<nodes.length; ++i){
        node_idx2nodes_in_idx[i] = [];
        node_idx2nodes_in[i] = [];
        node_idx2nodes_out[i] = [];
        node_idx2nodes_idx[i] = [];
        node_idx2edges_idx[i] = {};
    }
    for(var ce=0; ce<edges.length; ++ce){
        var s = edges[ce].source_idx;
        var t = edges[ce].target_idx;

        node_idx2nodes_out[s].push(edges[ce].ltarget);
        node_idx2nodes_in[t].push(edges[ce].lsource);
        node_idx2nodes_in_idx[t].push(s);
        
        node_idx2nodes_idx[s].push(t);
        node_idx2nodes_idx[t].push(s);
        node_idx2edges_idx[s][ce] = 1;
        node_idx2edges_idx[t][ce] = 1;
    }
    //------------------------------------------------
    //------------------------------------------------
    var cni = 0;//current node index
    var tmp_ni,min_ni;
    var step = 0;
    console.log('line crossings before: '+bui.grid.num_intersections());
    console.log('node crossings before: '+bui.grid.num_node_intersections());
    //------------------------------------------------
    bui.grid.add_padding();
    //------------------------------------------------
    //------------------------------------------------
    //randomize node order for sum more fun :D and better results
    nodes_idx_list = [];
    for(var i = 0; i<nodes.length; ++i) nodes_idx_list.push(i);
    nodes_idx_list.sort(function() {return 0.5 - Math.random()});
    var cni;
    //------------------------------------------------
    //------------------------------------------------
    for(var nix=0; nix<nodes.length; ++nix){
        cni = nodes_idx_list[nix];
        var node = nodes[cni];
        //console.log('step '+step+' curnode'+cni+'/'+nodes.length+'---'+node.id());
        //--------------------------------------
        ++step;
        if(step>nodes.length) break;
        if (node_idx2nodes_idx[cni] == undefined){
            for(var cx=0;cx<bui.grid.width; ++cx){
                for(var cy=0;cy<bui.grid.height; ++cy){
                    if(matrix_nodes[cx][cy]==undefined){
                        matrix_nodes[cx][cy] = 1;
                        matrix_nodes[node.x][node.y] = undefined;
                        node.x=cx;
                        node.y=cy;
                    }
                }
            }
            continue
        }
        //----------------------------------------
        //----------------------------------------
        //edge intersections
        min_ni = bui.grid.edge_intersections_fromto(node, node_idx2nodes_idx[cni], node_idx2edges_idx[cni]);
        //node intersections
        min_ni += bui.grid.node_intersections_fromto(cni, node, node_idx2nodes_idx[cni]);
        //distance
        min_ni += 0.1*bui.grid.edge_distance(node, node_idx2nodes_idx[cni]);
        min_ni += 0.05*bui.grid.edge_distance(node, node_idx2nodes_in_idx[cni]);
        //flow
        min_ni += 5*bui.grid.flow_fromto(node, node_idx2nodes_in[cni], node_idx2nodes_out[cni]);
        //90deg angle
        min_ni += 0.5*bui.grid.deg90_fromto(node, node_idx2nodes_idx[cni]);
        //graviation
        min_ni += 0.1*bui.grid.graviation_from(node);
        //node.addClass('Red');
        //alert('min_ni '+min_ni);
        //----------------------------------------
        var cx = node.x;
        var cy = node.y;
        var counter = 0;
        var best_x = undefined;
        var best_y = undefined;
        var stop_distance = undefined;
        var fields_visited = 0;
        while(true){
            //-----------------------
            if ( num_empty_fields==fields_visited ) break;
            cx += spiral_setps[counter][0];
            cy += spiral_setps[counter][1];
            ++counter;
            //-----------------------
            if(cx>=0 && cx<bui.grid.width && cy>=0 && cy<bui.grid.height && matrix_nodes[cx][cy] == undefined){
                ++fields_visited;
                tmp_ni = bui.grid.edge_intersections_fromto({ x : cx, y : cy }, node_idx2nodes_idx[cni], node_idx2edges_idx[cni]);
                tmp_ni += bui.grid.node_intersections_fromto(cni, { x : cx, y : cy}, node_idx2nodes_idx[cni]);
                tmp_ni += 0.1*bui.grid.edge_distance({ x : cx, y : cy }, node_idx2nodes_idx[cni]);
                tmp_ni += 0.05*bui.grid.edge_distance({ x : cx, y : cy }, node_idx2nodes_in_idx[cni]);
                tmp_ni += 5*bui.grid.flow_fromto({ x : cx, y : cy }, node_idx2nodes_in[cni], node_idx2nodes_out[cni]);
                tmp_ni += 0.5*bui.grid.deg90_fromto({ x : cx, y : cy }, node_idx2nodes_idx[cni]);
                tmp_ni += 0.1*bui.grid.graviation_from({ x : cx, y : cy });
                //--------------------------------------
                if(tmp_ni<min_ni){
                    min_ni = tmp_ni;
                    best_x = cx;
                    best_y = cy;
                    stop_distance = Math.abs(node.x-cx)+Math.abs(node.y-cy);
                }
                if (stop_distance != undefined){
                    if((Math.abs(node.x-cx)+Math.abs(node.y-cy))*2>stop_distance){
                        //console.log('taxi stop');
                        break
                    }
                }
                if(tmp_ni==0){
                    break;
                }
            }
        }
        //--------------------------------------
        if(best_x != undefined){
            bui.grid.set_nbuckets(cni,node.x, node.y, best_x, best_y);
            matrix_nodes[best_x][best_y] = cni;
            matrix_nodes[node.x][node.y] = undefined;
            node.x=best_x;
            node.y=best_y;
            bui.grid.set_nodes_as_edges(cni);
            for(var i=0; i<node_idx2edges_idx[cni].length; ++i) bui.grid.set_ebuckets(node_idx2edges_idx[cni][i],'clear');
            bui.grid.add_padding();
        }
        //--------------------------------------
        ++cni;
        if (cni>=nodes.length-1) cni=0;
        //--------------------------------------
    }
    bui.grid.render_current();
    console.log('line crossings after: '+bui.grid.num_intersections());
    console.log('node crossings after: '+bui.grid.num_node_intersections());
}
//=====================================================
bui.grid.render_current = function(){
    var nodes = bui.grid.nodes;
    var grid_space = bui.grid.grid_space;
    for(i=0; i<nodes.length; ++i) 
        nodes[i].absolutePositionCenter(nodes[i].x*grid_space,nodes[i].y*grid_space); 
}
//=====================================================
bui.grid.edge_distance = function(from_node, to_nodes){
    distance = 0;
    var nodes = bui.grid.nodes;
    for(var i=0;i<to_nodes.length; ++i){
        distance += Math.abs(from_node.x-nodes[to_nodes[i]].x)+Math.abs(from_node.y-nodes[to_nodes[i]].y)
    }
    return distance;
}
//=====================================================
bui.grid.edge_intersections_fromto = function(from_node, to_nodes, to_edges){
    var counter = 0;
    var edges = bui.grid.edges;
    var nodes = bui.grid.nodes;
    for(var i=0;i<to_nodes.length; ++i){
        for(var j in bui.grid.edge_intersections_getedges(from_node, nodes[to_nodes[i]])){
            if(!(j in to_edges)){
                if( bui.grid.intersect(from_node, nodes[to_nodes[i]], edges[j].lsource, edges[j].ltarget) ){
                    ++counter;
                }
            }
        }
    }
    for(var i=0;i<to_nodes.length; ++i){
        for(var j=i+1;j<to_nodes.length; ++j){
            if( bui.grid.intersect(from_node, nodes[to_nodes[i]], from_node, nodes[to_nodes[j]]) ){
                ++counter;
            }
        }
    }
    return counter;
}
bui.grid.edge_intersections_getedges = function(node1, node2){
    var min,max,i,key;
    var edge_collectionx = {};
    var edge_collection = {};
    //x-------------------
    if(node1.x<node2.x){
        min=node1.x;
        max=node2.x;
    }else{
        max=node1.x;
        min=node2.x;
    }
    for(i=min; i<=max; ++i)
        for(key in bui.grid.ebucketx[i])
            edge_collectionx[key] = 1;
    //y-------------------
    if(node1.y<node2.y){
        min=node1.y;
        max=node2.y;
    }else{
        max=node1.y;
        min=node2.y;
    }
    for(i=min; i<=max; ++i)
        for(key in bui.grid.ebuckety[i])
            if(key in edge_collectionx) 
                edge_collection[key] = 1;
    return edge_collection
}
bui.grid.init_ebuckets = function(){
    var edges = bui.grid.edges;
    var ebucketx = [];
    var ebuckety = [];
    for(var x=0; x<bui.grid.width; ++x) ebucketx.push({});
    for(var y=0; y<bui.grid.height; ++y) ebuckety.push({});
    bui.grid.ebucketx = ebucketx;
    bui.grid.ebuckety = ebuckety;
    for(var ne=0;ne<edges.length; ++ne){
        bui.grid.set_ebuckets(ne);
    }
}
bui.grid.set_ebuckets = function(edge_index, clear){
    var i,min,max;
    var ebucketx = bui.grid.ebucketx;
    var ebuckety = bui.grid.ebuckety;
    var edge = bui.grid.edges[edge_index];
    //-------------------------
    if(clear != undefined){
        for(i=0;i<ebucketx.length; ++i) if(edge_index in ebucketx[i]) delete ebucketx[i][edge_index];
        for(i=0;i<ebuckety.length; ++i) if(edge_index in ebuckety[i]) delete ebuckety[i][edge_index];
    }
    //x-----------------------
    if(edge.lsource.x<edge.ltarget.x){
        min=edge.lsource.x;
        max=edge.ltarget.x;
    }else{
        max=edge.lsource.x;
        min=edge.ltarget.x;
    }
    console.log(ebucketx.length);
    for(i=min;i<=max; ++i) ebucketx[i][edge_index] = 1//FIXME !!1!!!1111 edge_index seems to be out of range
    //y-----------------------
    if(edge.lsource.y<edge.ltarget.y){
        min=edge.lsource.y;
        max=edge.ltarget.y;
    }else{
        max=edge.lsource.y;
        min=edge.ltarget.y;
    }
    for(i=min;i<=max; ++i) ebuckety[i][edge_index] = 1;
}
//=====================================================
bui.grid.node_intersections_fromto = function(from_node_index, from_node, to_nodes){
    var counter = 0;
    var nodes = bui.grid.nodes;
    var candidates,j;
    for(var i=0;i<to_nodes.length; ++i){
        candidates = bui.grid.node_intersections_getnodes(from_node,to_nodes[i]);
        for(var ji=0; ji<candidates.length; ++ji){
            j = candidates[ji];
            if(j!=from_node_index && j != to_nodes[i]){
                var nae = bui.grid.nodes_as_edges[j];
                if(bui.grid.intersect(from_node, nodes[to_nodes[i]], nae[0].source, nae[0].target)){
                    ++counter;
                }else if(bui.grid.intersect(from_node, nodes[to_nodes[i]], nae[1].source, nae[1].target)){
                    ++counter;
                }
            }
        }
    }
    return counter;
}
bui.grid.node_intersections_getnodes = function(from_node, to_node){
    var matrix_nodes = bui.grid.matrix_nodes;
    var minx,miny,maxx,maxy;
    if (from_node.x<to_node.x){
        minx=from_node.x;
        maxx=to_node.x
    }else{
        minx=to_node.x;
        maxx=from_node.x
    }
    if (from_node.y<to_node.y){
        miny=from_node.y;
        maxy=to_node.y
    }else{
        miny=to_node.y;
        maxy=from_node.y
    }
    var i;
    var xnodes = {};
    for(i=minx; i<=maxx; ++i)
        for( key in bui.grid.nbucketx[i] )
            xnodes[key] = 1;
    out_nodes = []
    for(i=miny; i<=maxy; ++i)
        for (key in bui.grid.nbuckety[i] )
            if(key in xnodes)
                out_nodes.push(key)

    return out_nodes
}
bui.grid.init_nbuckets = function(){
    var nodes = bui.grid.nodes;
    var nbucketx = [];
    var nbuckety = [];
    var i;
    for(i=0; i<bui.grid.width; ++i) nbucketx.push({});
    for(i=0; i<bui.grid.height; ++i) nbuckety.push({});
    for(i=0; i<nodes.length; ++i){
        nbucketx[nodes[i].x][i] = 1;
        nbuckety[nodes[i].y][i] = 1;
    }
    bui.grid.nbucketx = nbucketx;
    bui.grid.nbuckety = nbuckety;

}
bui.grid.set_nbuckets = function(node_idx, oldx, oldy, newx, newy){
    delete bui.grid.nbucketx[oldx][node_idx]
    delete bui.grid.nbuckety[oldy][node_idx]
    bui.grid.nbucketx[newx][node_idx] = 1;//FIXME fail here, newx not available
    bui.grid.nbuckety[newy][node_idx] = 1;
}
//=====================================================
bui.grid.set_nodes_as_edges = function(node_index){
    var nodes = bui.grid.nodes;
    var node_edges = [];
    var grid_space = bui.grid.grid_space;
    if (node_index == undefined){
        for(var i=0; i<nodes.length; ++i){
            var node = nodes[i];
            var size = node.size();
            var width = size.width/grid_space/2;
            var height = size.height/grid_space/2;
            var A = {x:node.x-width, y:node.y+height};
            var B = {x:node.x+width, y:node.y-height};
            var C = {x:node.x-width, y:node.y-height};
            var D = {x:node.x+width, y:node.y+height};
            node_edges.push([
                    {source: A, target: B },
                    {source: C, target: D }
                    ]);
        }
        bui.grid.nodes_as_edges = node_edges;
    }else{
        var node = nodes[node_index];
        var size = node.size();
        var width = size.width/grid_space/2;
        var height = size.height/grid_space/2;
        var A = {x:node.x-width, y:node.y+height};
        var B = {x:node.x+width, y:node.y-height};
        var C = {x:node.x-width, y:node.y-height};
        var D = {x:node.x+width, y:node.y+height};
        bui.grid.nodes_as_edges[node_index] = [
                {source: A, target: B },
                {source: C, target: D }
                ];
    }
}
//=====================================================
bui.grid.deg90_fromto = function(from_node, to_nodes){
    var score = 0;
    var nodes = bui.grid.nodes;
    for(var i=0; i<to_nodes.length; ++i){
        if (nodes[to_nodes[i]].x==from_node.x) score += 0
        else if (nodes[to_nodes[i]].y == from_node.y) score += 0.1;
        else score +=1;
    }
    return score
}
//=====================================================
bui.grid.flow_fromto = function(from_node, to_nodes_in, to_nodes_out, common_edge){
    if (to_nodes_in.length==0 || to_nodes_out.length == 0) return 0
    //bui.grid.flow_fromto({x:1,y:1},[{x:1,y:0}],[{x:2,y:2}],{x:2,y:2})
    if(common_edge == undefined) common_edge = bui.grid.common_edge(from_node, to_nodes_in, to_nodes_out);
    //console.log(JSON.stringify(common_edge));
    if(common_edge.x == from_node.x && common_edge.y == from_node.y){
        bui.grid.render_current();
        console.log(from_node.x+' '+from_node.y)
        for(var i =0; i<to_nodes_out.length; ++i) 
            console.log( to_nodes_out[i].x+' '+to_nodes_out[i].x)
        for(var i =0; i<to_nodes_in.length; ++i) 
            console.log( to_nodes_in[i].x+' '+to_nodes_in[i].x)
            //to_nodes_out[i].addClass('Red');
        //alert('stop');
        console.log('problem: common edge node is from_node')
        return 0;
    }
    var score = 0;
    common_edge_norm = Math.sqrt(Math.pow(common_edge.x,2)+Math.pow(common_edge.y,2))
    //console.log(common_edge_norm);
    for(var i=0; i<to_nodes_out.length; ++i){
        tmp_x = to_nodes_out[i].x-from_node.x;
        tmp_y = to_nodes_out[i].y-from_node.y;
        score += (1-(tmp_x*common_edge.x+tmp_y*common_edge.y)/ (Math.sqrt(Math.pow(tmp_x,2)+Math.pow(tmp_y,2))*common_edge_norm))/2;
        //console.log('out'+score);
    }
    for(var i=0; i<to_nodes_in.length; ++i){
        tmp_x = from_node.x-to_nodes_in[i].x;
        tmp_y = from_node.y-to_nodes_in[i].y;
        score += (1-(tmp_x*common_edge.x+tmp_y*common_edge.y)/ (Math.sqrt(Math.pow(tmp_x,2)+Math.pow(tmp_y,2))*common_edge_norm))/2;
        //console.log('in'+score);
    }
    return score
};
bui.grid.common_edge = function(from_node, to_nodes_in, to_nodes_out){
    var x = 0;
    var y = 0;
    var edge_length;
    for(var i=0; i<to_nodes_in.length; ++i){
        
        tmp_x = from_node.x-to_nodes_in[i].x;
        tmp_y = from_node.y-to_nodes_in[i].y;
        edge_length = Math.sqrt(Math.pow(tmp_x,2)+Math.pow(tmp_y,2));
        x += (tmp_x)/edge_length;
        y += (tmp_y)/edge_length;
    }
    for(var i=0; i<to_nodes_out.length; ++i){
        tmp_x = to_nodes_out[i].x-from_node.x;
        tmp_y = to_nodes_out[i].y-from_node.y;
        edge_length = Math.sqrt(Math.pow(tmp_x,2)+Math.pow(tmp_y,2));
        x += (tmp_x)/edge_length;
        y += (tmp_y)/edge_length;
    }
    return {x: x, y: y}
}
bui.grid.angle = function angle(center, p1) {
 //http://beradrian.wordpress.com/2009/03/23/calculating-the-angle-between-two-points-on-a-circle/
 var p0 = {x: center.x, y: center.y - Math.sqrt(Math.abs(p1.x - center.x) * Math.abs(p1.x - center.x) + Math.abs(p1.y - center.y) * Math.abs(p1.y - center.y))};
 return (2 * Math.atan2(p1.y - p0.y, p1.x - p0.x)) * 180 / Math.PI;
}
//=====================================================
bui.grid.graviation_from = function(from_node){
    bui.grid.centerx = Math.round(bui.grid.width/2);
    bui.grid.centery = Math.round(bui.grid.height/2);
    var distance = Math.abs(from_node.x-bui.grid.centerx)+Math.abs(from_node.y-bui.grid.centery)
    return distance / (bui.grid.width+bui.grid.height)*2
}
//=====================================================
bui.grid.node_swap = function(node1, to_nodes1, node2, to_nodes2){
    //TODO not so easy to implement since both nodes need to be moved and node/edge intersections have to be calculated without the original nodes
}
//=====================================================
bui.grid.ccw = function(A,B,C){
    return (C.y-A.y)*(B.x-A.x) > (B.y-A.y)*(C.x-A.x)
}
bui.grid.collinear = function(A,B,C) {
  return (A.y - B.y) * (A.x - C.x) == (A.y - C.y) * (A.x - B.x);
}
bui.grid.point_on_segment = function(A,B,C){
    if (A.x == B.x){
        if(A.y<B.y){
            if(A.y<C.y && B.y>C.y) return true
            else return false
        }else{
            if(B.y<C.y && A.y>C.y) return true
            else return false
        }
    }else if (A.x<B.x){
        if(A.x<C.x && B.x>C.x) return true
        else return false
    }else{
        if(B.x<C.x && A.x>C.x) return true
        else return false
    }
}
bui.grid.intersect = function(A,B,C,D, mark){
    //if (mark!=undefined) console.log('check this '+JSON.stringify([A.id(),{x:A.x,y:A.y},B.id(),{x:B.x,y:B.y},C.id(),{x:C.x,y:C.y},D.id(),{x:D.x,y:D.y}]));
    if (bui.grid.collinear(A,B,C)){
        if (bui.grid.collinear(A,B,D)){
            if (A.x == B.x){
                if( (A.y>=C.y&&B.y>=C.y &&A.y>=D.y&&B.y>=D.y) || (A.y<=C.y&&B.y<=C.y &&A.y<=D.y&&B.y<=D.y) ) return false
                else return true // collinear horizontal overlapping
            }else{
                if( (A.x>=C.x&&B.x>=C.x &&A.x>=D.x&&B.x>=D.x) || (A.x<=C.x&&B.x<=C.x &&A.x<=D.x&&B.x<=D.x) ) return false;
                else return true;//colinear and overlapping
            }
        }else{
            //console.log('ABC  col')
            return bui.grid.point_on_segment(A,B,C)
        }
    }else if (bui.grid.collinear(A,B,D)){ 
        //console.log('ABD  col')
        return bui.grid.point_on_segment(A,B,D)
    }else if (bui.grid.collinear(C,D,A)){ 
        //console.log('CDA  col')
        return bui.grid.point_on_segment(C,D,A)
    }else if (bui.grid.collinear(C,D,B)){ 
        //console.log('CDB  col')
        return bui.grid.point_on_segment(C,D,B)
    }else{
        //console.log('ccw')
        return bui.grid.ccw(A,C,D) != bui.grid.ccw(B,C,D) && bui.grid.ccw(A,B,C) != bui.grid.ccw(A,B,D);
    }

}

//=====================================================
//=====================================================
bui.grid.num_intersections = function(edges_index, mark){
    var counter = 0;
    var crossing_edges = [];
    for(var i=0; i<bui.grid.edges.length; ++i){
        for(var j=i+1; j<bui.grid.edges.length; ++j){
            if(bui.grid.intersect(bui.grid.edges[i].lsource,bui.grid.edges[i].ltarget,bui.grid.edges[j].lsource,bui.grid.edges[j].ltarget, mark) == true){
                if(edges_index != undefined){
                    if(i in edges_index){
                        crossing_edges.push(j);
                        if(mark != undefined){
                            /*console.log(JSON.stringify([
                            {x:bui.grid.edges[i].lsource.x,y:bui.grid.edges[i].lsource.y},
                            {x:bui.grid.edges[i].ltarget.x,y:bui.grid.edges[i].ltarget.y},
                            {x:bui.grid.edges[j].lsource.x,y:bui.grid.edges[j].lsource.y},
                            {x:bui.grid.edges[j].ltarget.x,y:bui.grid.edges[j].ltarget.y},
                            ]));*/
                            bui.grid.edges[j].addPoint(1,1,'Outcome');
                            bui.grid.edges[j].recalculatePoints();
                        }
                    }else if (j in edges_index){
                        crossing_edges.push(i);
                        if(mark != undefined){
                            bui.grid.edges[i].addPoint(1,1,'Outcome');
                            bui.grid.edges[i].recalculatePoints();
                        }
                    }
                }
                ++counter;
            }
        }
    }
    if(edges_index != undefined){
        return crossing_edges;
    } 
    return counter
}
//=====================================================
bui.grid.num_node_intersections = function(edges_index, mark){
    var counter = 0;
    var edges = bui.grid.edges;
    for(var i=0; i<edges.length; ++i){
        for(var j=0; j<bui.grid.nodes.length; ++j){
            if(j != edges[i].source_idx && j != edges[i].target_idx){
                var nae = bui.grid.nodes_as_edges[j];
                if(bui.grid.intersect(edges[i].lsource, edges[i].ltarget, nae[0].source, nae[0].target)){
                    ++counter;
                }else if(bui.grid.intersect(edges[i].lsource, edges[i].ltarget, nae[1].source, nae[1].target)){
                    ++counter;
                }
            }
        }
    }
    return counter
}
