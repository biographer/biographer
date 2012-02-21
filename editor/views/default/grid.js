bui.grid = { 
    nodes:[], 
    edges:[], 
    width:0,
    height:0,
    matrix_nodes: [],
    grid_space: 80//px
}
bui.grid.init = function(nodes, edges, width, height){
    bui.grid.nodes = nodes;
    bui.grid.edges = edges;
    if(width==undefined || height==undefined){
        width = 2*Math.sqrt(nodes.length)
            height = 3*Math.sqrt(nodes.length)
    }
    var max_x = Math.round(width);
    var max_y = Math.round(height);
    var grid_space = bui.grid.grid_space;
    var pos;
    //-------------------------------------------------------
    //check if max_x is smaller than the max_x pos of the max x node pos
    //same for max_y
    for(var i=0; i<nodes.length; ++i){
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
        for (var y=0; y<=max_y; ++y){
            matrix_nodes[x].push(undefined);
        }
    }
    //-------------------------------------------------------
    //position elements on grid, only one element is allowed on each grid point
    var cp,cur_x,cur_y,loop;
    for(var i=0; i<nodes.length; ++i){
        pos = nodes[i].absolutePositionCenter();
        cur_x = Math.round(pos.x/grid_space);
        cur_y = Math.round(pos.y/grid_space);
        var counter = 0;
        loop = true;
        mulitplierx = ['x',1,1,-1,1];
        mulitpliery = ['x',1,-1,1,1];
        count4 = 0;
        cur_edge_len = 1;
        cur_edge_steps = 0;
        add_x_abs = 0;
        add_y_abs = 1;
        while(loop){
            if(cur_x>=0 && cur_x<=max_x && cur_y>=0 && cur_y<=max_y && matrix_nodes[cur_x][cur_y] == undefined){
                matrix_nodes[cur_x][cur_y] = 1;
                nodes[i].absolutePositionCenter(cur_x*grid_space,cur_y*grid_space);
                nodes[i].x = cur_x;
                nodes[i].y = cur_y;
                //alert('set '+nodes[i].label()+' -> '+cur_x+' '+cur_y);
                break;
            }
            if (cur_edge_steps%cur_edge_len==0){
                tmp = add_y_abs;
                add_y_abs = add_x_abs;
                add_x_abs = tmp;
                if(count4>3) count4=0;
                ++count4;
            }
            if (cur_edge_steps+1>2*cur_edge_len){
                cur_edge_steps = 0;
                ++cur_edge_len; 
            }
            //console.log('cur_edge_len '+cur_edge_len+' count4 '+count4+' |x '+add_x_abs*mulitplierx[count4]+' y '+add_y_abs*mulitpliery[count4]);
            ++cur_edge_steps;
            cur_x += add_x_abs*mulitplierx[count4];
            cur_y += add_y_abs*mulitpliery[count4];
            ++counter;
        }
    }
    bui.grid.matrix_nodes = matrix_nodes;
}
bui.grid.layout = function(){
    var nodes = bui.grid.nodes;
    var edges = bui.grid.edges;
    var grid_space = bui.grid.grid_space;
    var matrix_nodes = bui.grid.matrix_nodes;
    var node2endpoints = {};
    var s,t;
    for(var ce=0; ce<edges.length; ++ce){
        s = edges[ce].source();
        t = edges[ce].target();
        if(s.id() in node2endpoints) node2endpoints[s.id()].push(t);
        else node2endpoints[s.id()] = [t];
        if(t.id() in node2endpoints) node2endpoints[t.id()].push(s);
        else node2endpoints[t.id()] = [s];
    }

    var cni = 0;//current node index
    var tmp_ni,min_ni,node,target,best_mp,endpoints;
    var step = 0;
    alert(bui.grid.num_intersections());
    while(true){
        node = nodes[cni];
        console.log('step '+step+' curnode'+cni+'/'+nodes.length+'---'+node.id());
        best_mp = undefined;
        endpoints = node2endpoints[node.id()];
        /*enames = [];
        for(var ep=0; ep<endpoints.length; ++ep){
            enames.push(endpoints[ep].label());
        }*/
        //--------------------------------------
        ++step;
        if(step>30) break;
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
        
        //alert('node '+node.label()+' endpoints'+JSON.stringify(enames))
        min_ni = 0;
        t = { x : node.x, y : node.y};
        for(var ep=0; ep<endpoints.length; ++ep){
            for(var ce=0; ce<edges.length; ++ce){
                ced = edges[ce]
                endp = endpoints[ep];
                var interedges = [];
                if(ced.source().id()!=node.id() && ced.target().id()!== node.id() && endp.id()!=ced.source().id()&& endp.id()!= ced.target().id()){
                    //alert(node.label()+' '+endpoints[ep].label()+' '+ced.source().label()+' '+ced.target().label())
                    if(bui.grid.intersect( t, endpoints[ep], ced.source(), ced.target() )) {
                        interedges.push([ced.source().id(),ced.target().id()])
                        ++min_ni;
                    }
                }
            }
        }
        //alert( 'min_ni '+min_ni+'  '+JSON.stringify(interedges) );
        //alert('cur_min: '+min_ni);
        var xmin_ni = min_ni;
        if (min_ni == 0) continue;
        //--------------------------------------
        for(var cx=0;cx<bui.grid.width; ++cx){
            for(var cy=0;cy<bui.grid.height; ++cy){
                if(matrix_nodes[cx][cy]==undefined){
                    t = { x : cx, y : cy};
                    tmp_ni = 0;
                    for(var ep=0; ep<endpoints.length; ++ep){
                        var interedges = [];
                        for(var ce=0; ce<edges.length; ++ce){
                            ced = edges[ce];
                            endp = endpoints[ep];
                            if(ced.source().id()!=node.id() && ced.target().id()!== node.id() && endp.id()!=ced.source().id()&& endp.id()!= ced.target().id()){
                                //if( (ced.source()==node && ced.target()==endpoints[ep]) || (ced.target()==node && ced.source()==endpoints[ep]) ) continue;
                                if(bui.grid.intersect( t, endpoints[ep], ced.source(), ced.target() )) {
                                    interedges.push([ced.source().id(),ced.target().id()])
                                    ++tmp_ni;
                                }
                            }
                        }
                        //node.absolutePositionCenter( t.x*grid_space, t.y*grid_space ); 
                        //alert( 'ep '+endpoints[ep].label()+' tmp_ni '+tmp_ni+'  '+JSON.stringify(interedges) );
                    }

                    //--------------------------------------
                    if(tmp_ni<min_ni){
                        min_ni = tmp_ni;
                        best_mp = t;
                    }
                    if(tmp_ni==0){
                        break;
                    }
                }
            }
        } 
        //--------------------------------------
        if(best_mp != undefined){
            before_apply = bui.grid.num_intersections();
            node.absolutePositionCenter( best_mp.x*grid_space, best_mp.y*grid_space ); 
            //alert('best: '+xmin_ni+'-->'+min_ni);
            //bui.grid.num_intersections();
            //alert(JSON.stringify(matrix_nodes));
            matrix_nodes[best_mp.x][best_mp.y] = 1;
            matrix_nodes[node.x][node.y] = undefined;
            node.x=best_mp.x;
            node.y=best_mp.y;
            alert(xmin_ni+'-> '+min_ni+' -- '+before_apply+'->'+bui.grid.num_intersections());
        }
        //alert(JSON.stringify(matrix_nodes));
    }

}
bui.grid.num_intersections = function(){
    var counter = 0;
    var inter = []
    for(var i=0; i<bui.grid.edges.length; ++i){
        for(var j=i+1; j<bui.grid.edges.length; ++j){
            if(bui.grid.intersect(bui.grid.edges[i].source(),bui.grid.edges[i].target(),bui.grid.edges[j].source(),bui.grid.edges[j].target())){
                edge1 = bui.grid.edges[i];
                edge2 = bui.grid.edges[j];
                ++counter;
                inter.push([
                bui.grid.edges[i].source().label(),
                bui.grid.edges[i].target().label(),
                bui.grid.edges[j].source().label(),
                bui.grid.edges[j].target().label(),
                ])
                alert(JSON.stringify(inter[inter.length-1]));
            }
        }
    }
    //alert(JSON.stringify(inter));
    return counter
    //alert('nodes '+bui.grid.nodes.length+' intersections = '+counter)
}
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
