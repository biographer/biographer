(function(bui) {

    /**
     * Default generator for node types. This will be used when
     * nodeJSON.generator is undefined.
     *
     * @param {bui.Graph} graph The graph to which the node shall be added
     * @param {Object} nodeType Node type retrieved from the node mapping.
     * @param {Object} nodeJSON Node information
     * @return {bui.Node} The generated node
     */
    var defaultNodeGenerator = function(graph, nodeType, nodeJSON) {
       
        var node;
        if (nodeJSON.sbo == 174 || nodeJSON.sbo == 173 || nodeJSON.sbo == 238 || nodeJSON.sbo == 225 || nodeJSON.sbo == 396 || nodeJSON.sbo == 379){
            node = graph.add(nodeType.klass, nodeJSON.id, [nodeJSON.sbo]);
        }else{
            node = graph.add(nodeType.klass, nodeJSON.id);
        }

        node.fromJSON(nodeJSON);
        
        return node;
    };

    /**
     * Import nodes.
     *
     * @param {bui.Graph} graph The target graph to which the nodes and edges
     *   should be added.
     * @param {Object} data JSON data which should be imported
     * @return {Object} All the generated nodes. Keys of this object are the
     *   node's ids or, if applicable, the node's ref key (node.data.ref).
     */
    var addAllNodes = function(graph, data) {
        var nodes = data.nodes,
                generatedNodes = {},
                node,
                nodeJSON;

        var addNode = function(nodeJSON, id) {
            var nodeType = retrieveFrom(nodeMapping, nodeJSON.sbo);
            var node;

            if (nodeType === undefined) {
                return undefined;
            }

            if (bui.util.propertySetAndNotNull(nodeType, 'generator')) {
                node = nodeType.generator(graph, nodeJSON);
            } else {
                node = defaultNodeGenerator(graph, nodeType, nodeJSON);
            }

            if (node !== undefined) {
                node.json(nodeJSON);
                generatedNodes[id] = node;
            }

            return node;
        };

        // add all nodes
        for (var i = 0; i < nodes.length; i++) {
            try {
                nodeJSON = nodes[i];

                addNode(nodeJSON, nodeJSON.id);
            } catch (e) {
                log(e);
            }
        }

        // add relationship information
        for (var key in generatedNodes) {
            if (generatedNodes.hasOwnProperty(key)) {
                node = generatedNodes[key];
                nodeJSON = node.json();

                if (nodeJSON.data !== undefined &&
                        nodeJSON.data.subnodes !== undefined) {
                    for (var j = 0; j < nodeJSON.data.subnodes.length; j++) {
                        var subNodeId = nodeJSON.data.subnodes[j];
                        var subNode = generatedNodes[subNodeId];

                        if (subNode !== undefined) {
                            subNode.parent(node);
                        } else {
                            log('Warning: Broken sub node reference to sub' +
                                    ' node id: ' + subNodeId);
                        }
                    }
                }
            }
        }

        return generatedNodes;
    };

    /**
     * Layout the complex nodes using a table layout.
     *
     * @param {Object} nodes A map which keys map onto {@link bui.Node}
     *   instances.
     */
    var doComplexLayout = function(nodes) {
        for (var key in nodes) {
            if (nodes.hasOwnProperty(key)) {
                var node = nodes[key];

                if (node instanceof bui.Complex &&
                        node.parent() instanceof bui.Complex === false) {
                    node.tableLayout();

                    var size = node.size();
                    var json = node.json();
                    json.data.width = size.width;
                    json.data.height = size.height;
                }
            }
        }
    };

    /**
     * Position the auxiliary units for each node.
     *
     * @param {Object} All the generated nodes. Keys of this object are the
     *   node's ids or, if applicable, the node's ref key (node.data.ref).
     */
    var positionAuxiliaryUnits = function(nodes) {
        for (var key in nodes) {
            if (nodes.hasOwnProperty(key)) {
                nodes[key].positionAuxiliaryUnits();
            }
        }
    };

    /**
     * Add edges to the graph. Information about the edges will be extracted
     * from the data parameter.
     *
     * @param {bui.Graph} graph The target graph to which the nodes and edges
     *   should be added.
     * @param {Object} data JSON data which should be imported
     * @return {Object} All the generated nodes. Keys of this object are the
     *   node's ids or, if applicable, the node's ref key (node.data.ref).
     */
    var addAllEdges = function(graph, data, generatedNodes) {
        var edges = data.edges;

        var edge_stack = [], edge_stack2 = edges.slice(); // make a shallow copy of edges array
        var drawables = graph.drawables();
        var generatedEdges = {};
        var last_len=edge_stack2.length+1;
        while (last_len>edge_stack2.length){ // repeat until no more edges from edge_Stack can be added
          last_len=edge_stack2.length
          edge_stack = edge_stack2;
          edge_stack2 = [];
          for (var i = 0; i < edge_stack.length; i++) {
          
            var edgeJSON = edge_stack[i], edge;

            if ((edgeJSON.source === undefined)||(edgeJSON.target===undefined)){
                continue;
            }
            var source = undefined;
            //if there are ports defined (molecule:domain-port) make them to the target
            if (edgeJSON.source.indexOf(':') != -1){
                var node_ids = edgeJSON.source.split(':');
                source = generatedNodes[node_ids[0]];
                if (source !== undefined) {
                    children = source.children();
                    for(var j = 0;j<children.length;j++){
                        if((children[j].label() == node_ids[1])||(children[j].hasClass(node_ids[1]))){
                            source = drawables[children[j].id()];
                            break;
                        }
                    }
                }
            }else{
                var source = generatedNodes[edgeJSON.source];
            }
            // still undefined? may be an edge
            if(source === undefined){
              var idx=-1;
              var source_edge= undefined;
              if (edgeJSON.source.indexOf(':') != -1){
                var ids = edgeJSON.source.split(':');
                idx = ids[1];
                source_edge = generatedEdges[ids[0]];
              } else {
                source_edge = generatedEdges[edgeJSON.source];
              }
              if (source_edge !== undefined) {
                if (idx>=0){
                  source = source_edge.getPoint(idx);
                } else {
                  source = source_edge.addPoint(undefined,undefined,"Outcome");
                }
              }
            }
            var target = undefined;
            //if there are ports defined (molecule:domain-port) make them to the target
            if (edgeJSON.target.indexOf(':') != -1){
                var node_ids = edgeJSON.target.split(':');
                target = generatedNodes[node_ids[0]];
                if (target !== undefined) {
                    var children = target.children();
                    for(var j = 0;j<children.length;j++){
                        if((children[j].label() == node_ids[1])||(children[j].hasClass(node_ids[1]))){
                            target = drawables[children[j].id()];
                            break;
                        }
                    }
                }
            }else{
                target = generatedNodes[edgeJSON.target];
            }
            // still undefined? may be an edge
            if(target === undefined){
              var idx=-1;
              var target_edge= undefined;
              if (edgeJSON.target.indexOf(':') != -1){
                var ids = edgeJSON.target.split(':');
                idx = ids[1];
                target_edge = generatedEdges[ids[0]];
              } else {
                target_edge = generatedEdges[edgeJSON.target];
              }
              if (target_edge !== undefined) {
                if (idx>=0){
                  target = target_edge.getPoint(idx);
                } else {
                  target = target_edge.addPoint();
                }
              }
            }
            // if source or target are still undefined they might reference an edge which is not yet added
            if ((source === undefined)||(target === undefined)) {
                edge_stack2.push(edgeJSON);
                continue;
            }

            // ensuring that the data property exists
            edgeJSON.data = edgeJSON.data || {};

            edge = graph.add(bui.Edge, edgeJSON.id);
            edge.json(edgeJSON).source(source).target(target);
            var spline=(edgeJSON.data.type=='curve' || edgeJSON.data.type=='spline');
            edge.spline(spline);
            if (spline){
              edge.sourceSplineHandle(edgeJSON.data.handles[0].x,edgeJSON.data.handles[0].y);
              edge.targetSplineHandle(edgeJSON.data.handles[edgeJSON.data.handles.length-1].x,edgeJSON.data.handles[edgeJSON.data.handles.length-1].y);
            }
            if(edgeJSON.data.points !== undefined){
              for(var j=0; j<edgeJSON.data.points.length; j ++){
                var type = (edgeJSON.data.pointtypes ? edgeJSON.data.pointtypes[j] : undefined);
                if (spline){
                  edge.addPoint(edgeJSON.data.points[j].x, edgeJSON.data.points[j].y,type,undefined,edgeJSON.data.handles[j+1].x,edgeJSON.data.handles[j+1].y)
                } else {
                  edge.addPoint(edgeJSON.data.points[j].x, edgeJSON.data.points[j].y,type)
                }
              }
            }
            // import the color width and dash array of the edge
            if (bui.util.propertySetAndNotNull(edgeJSON, ['data','color'])){
              if (Object.prototype.toString.call(edgeJSON.data.color).slice(8,-1) == "String"){
                edge.color({color: edgeJSON.data.color});
              } else {
                edge.color(edgeJSON.data.color);
              } 
            }

            if (edgeJSON.sbo !== undefined) {
                if ((edgeJSON.source.split(':')[0] == edgeJSON.target.split(':')[0])&&(edgeJSON.sbo == 342)){//SBO:0000342 molecular or genetic interaction
                    //log(JSON.stringify(edgeJSON));
                    // source and tartget are the same molecule add cis/trans infobox 
                    var pos = edge.source().absoluteCenter();
                    var size = edge.source().size();
                    var cis_trans = 'cis_trans';
                    if (edgeJSON.data.cis_trans !== undefined){
                        cis_trans = edgeJSON.data.cis_trans;
                    }
                    var handle = graph.add(bui.RectangularNode).visible(true).size(50,20).label(cis_trans);
                    handle.positionCenter(pos.x+size.width+30, pos.y);
                    edge.json(edgeJSON).source(handle).target(target);
                    back_edge = graph.add(bui.Edge, edgeJSON.id+'_back');
                    back_edge.json(edgeJSON).source(handle).target(source);
                    var marker = retrieveFrom(edgeMarkerMapping, edgeJSON.sbo);
                    back_edge.marker(marker.klass);
                    edge.marker(marker.klass);
                    back_edge.addPoint(pos.x+size.width+30, pos.y-20);
                    edge.addPoint(pos.x+size.width+30, pos.y+20)
                }else{
                    try {
                        var marker = retrieveFrom(edgeMarkerMapping, edgeJSON.sbo);
                        edge.marker(marker.klass);
                    } catch (e) {
                        log(e);
                    }
                }
            }

            var style = bui.AbstractLine.Style[edgeJSON.data.style];
            if (style !== undefined) {
                edge.lineStyle(style);
            }

            edge.visible(true);
            generatedEdges[edgeJSON.id] = edge;   
          }
        }
        if (edge_stack2.length){
          log('Edge stack still contains '+String(edge_stack2.length)+' edges');
          for(var i = 0; i<edge_stack2.length; i++){
              var flag = true;
              if ((generatedNodes[edge_stack2[i].source] === undefined) && (generatedEdges[edge_stack2[i].source] === undefined)){
                  log('Edge source '+edge_stack2[i].source+' could not be found. Edge ID: '+edge_stack2[i].id);
                  flag = false;
              }
              if ((generatedNodes[edge_stack2[i].target] === undefined) && (generatedEdges[edge_stack2[i].target] === undefined)){
                  log('Edge target '+edge_stack2[i].target+' could not be found. Edge ID: '+edge_stack2[i].id);
                  flag = false;
              }
              if (flag) log('found but not added: '+JSON.stringify(edge_stack2[i]));
              //log('Edge source '+edge_stack[i].source+' or target ' + edge_stack[i].target + ' could not be found.');
          } 

        }
        
      };

    /**
     * Align nodes according to their parent-child relationships. Childs
     * should end up on top of their parents.
     *
     * @param {Object} All the generated nodes. Keys of this object are the
     *   node's ids or, if applicable, the node's ref key (node.data.ref).
     */
    var alignAccordingToNodeHierachy = function(nodes) {
        var id;
        var node;
        var alignRecursively = function(node) {
            var children = node.childrenWithoutAuxiliaryUnits();
            var i;
            if (!(node instanceof(bui.Compartment))) {
               node.toFront();
            }

            for (i = 0; i < children.length; i++) {
                var child = children[i];
                alignRecursively(child);
            }

            var auxUnits = node.auxiliaryUnits();
            for(i = 0; i < auxUnits.length; i++) {
               auxUnits[i].toFront();
            }
        };

        for (id in nodes) { //align compartments and its members
            if (nodes.hasOwnProperty(id)) {
                node = nodes[id];

                if (node.hasParent() === false &&
                   (node instanceof(bui.Compartment))){
                   alignRecursively(node);
                }

            }
        }
        for (id in nodes) { // bring non-compartment members to front
           if (nodes.hasOwnProperty(id)) {
              node = nodes[id];
              if (node.hasParent() === false &&
                 (!(node instanceof(bui.Compartment)))){
                    alignRecursively(node);
              }
           }
        }


    };

    /**
     * Import nodes and edges from JSON using this function.
     *
     * @param {bui.Graph} graph The target graph to which the nodes and edges
     *   should be added.
     * @param {Object} data JSON data which should be imported
     */
    bui.importFromJSON = function(graph, data) {
        var start = new Date().getTime();
        var suspendHandle = graph.suspendRedraw(20000);

        if('sbgnlang' in data){
            bui.settings.SBGNlang = data.sbgnlang; 
        }
        log('## Setting SBGN language to '+bui.settings.SBGNlang);

        log('## Importing all nodes');
        var generatedNodes = addAllNodes(graph, data);

        log('## Layout complexes');
        doComplexLayout(generatedNodes);

        log('## Layout auxiliary units');
        positionAuxiliaryUnits(generatedNodes);

        log('## Aligning nodes according to parent-child relationships');
        alignAccordingToNodeHierachy(generatedNodes);

        log('## Adding all edges');
        addAllEdges(graph, data, generatedNodes);

        log('## Reducing canvas size');
        graph.reduceCanvasSize();

        graph.unsuspendRedraw(suspendHandle);
        var elapsed = new Date().getTime() - start;
        log('## Complete import took ' + elapsed + 'ms.');
//         //FIXME horrible hack but neede to make the import work
//         for (var key in generatedNodes) {
//             if (generatedNodes.hasOwnProperty(key)) {
//                 var node = generatedNodes[key];
//                 var pos = node.position();
//                 var nparent = node.parent();
//                 if ('identifier' in nparent){
//                     if (nparent.identifier() == "Compartment"){
//                         var pos_parent = nparent.position();
//                         node.position(pos.x-pos_parent.x, pos.y-pos_parent.y);
//                         console.log('reset pos');
//                     }
//                 }
//             }
//         }
    };

    /**
     * Update node positions by reimporting data from JSON.
     *
     * @param {bui.Graph} graph The target graph to which the nodes and edges
     *   should be added.
     * @param {Object} data JSON data which should be imported
     * @param {Number} [duration] An optional duration in milliseconds.
     *   {@link bui.Node#move}
     */
    bui.importUpdatedNodePositionsFromJSON = function(graph, data, duration, finishListener) {
        var drawables = graph.drawables();

        // optimize the data structure to map json IDs to drawable references
        // to achieve a computational complexity of O(2n).
        var optimizedDrawables = {};
        for (var key in drawables) {
            if (drawables.hasOwnProperty(key)) {
                var drawable = drawables[key];
                var json = drawable.json();

                if (json !== undefined && json !== null) {
                    optimizedDrawables[json.id] = drawable;
                }
            }
        }

        var nodesJSON = data.nodes, i;
	var listener_set=false;
        for (i = 0; i < nodesJSON.length; i++) {
            var nodeJSON = nodesJSON[i],
                    node = optimizedDrawables[nodeJSON.id];

            if (node === undefined) {
                log('Warning: Can\'t update nodes position for json node id ' +
                        nodeJSON.id + ' because the node can\'t be found.');
                continue;
            } else if (bui.util.propertySetAndNotNull(nodeJSON,
                    ['data', 'x'], ['data', 'y']) === false) {
                continue;
            } else if (node.hasParent() === true) { // this ensures complex members are not moved
               if (!(node.parent() instanceof bui.Compartment)){  // allow members of compartments to be moved
                  continue;
               } 
            }
            if (node instanceof bui.Compartment){
               // animate size for compartments
               var w=nodeJSON.data.width,
                     h=nodeJSON.data.height;
               if (w && h){
                  node.resize(w,h,duration);
               }
            
            }

            var x = nodeJSON.data.x,
                    y = nodeJSON.data.y,
                    currentPosition = node.position();
	    if (!listener_set){
	      node.move(x - currentPosition.x, y - currentPosition.y, duration, finishListener); // the last node will call the finishListener
	      listener_set=true;
	    } else {
	      node.move(x - currentPosition.x, y - currentPosition.y, duration);
	    }
        }

        var edgesJSON = data.edges;
        for (i = 0; i < edgesJSON.length; i++) {
            var edgeJSON = edgesJSON[i],
                    edge = optimizedDrawables[edgeJSON.id];

            if (edge === undefined) {
                log('Warning: Can\'t update edge for json edge id ' +
                        edgeJSON.id + ' because the edge can\'t be found.');
                continue;
            }
            var isSpline=(edgeJSON.data.type == 'curve' || edgeJSON.data.type == 'spline');
            var points=[];
            if (bui.util.propertySetAndNotNull(edgeJSON,['data', 'points'])) {
                points=edgeJSON.data.points;
            }
            var handles=[];
            if (isSpline && (!bui.util.propertySetAndNotNull(edgeJSON,['data', 'handles']) || edgeJSON.data.handles.length+2!=points.length)) { 
              log('no/wrong data.handles property for spline edge');
              isSpline=false;
            }
            edge.spline(isSpline); // update spline status
            if (isSpline){
              handles=edgeJSON.data.handles
              edge.sourceSplineHandle(handles[0].x,handles[0].y);
              edge.targetSplineHandle(handles[handles.length-1].x,handles[handles.length-1].y);
            }
            for (var k=edge.length()-2;k>=points.length;k--){
              edge.removePoint(k);
            }
            for (var k=0;k<points.length;k++){
                //var type = (pointtypes ? pointtypes[j] : undefined); //WARNING cannot update type yet
              if (isSpline){
                edge.updatePoint(k,points[k].x, points[k].y,handles[k+1].x,handles[k+1].y,duration);
              } else {
                edge.updatePoint(k,points[k].x, points[k].y,undefined,undefined,duration);
              }
              
            }
            for (var k=edge.length();k<points.length;k++){
              var type = (pointtypes ? pointtypes[j] : undefined);
              if (isSpline){
                edge.addPoint(points[k].x, points[k].y,type,undefined,handles[k+1].x,handles[k+1].y)
              } else {
                edge.addPoint(points[k].x, points[k].y,type)
              }
            }
            edge.setSplineHandlePositions(edgeJSON.data.handles, duration);
            edge.setSplinePoints(edgeJSON.data.points, duration);
        }
    };
})(bui);
