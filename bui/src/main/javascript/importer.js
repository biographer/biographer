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
            node = graph.add(nodeType.klass, [nodeJSON.sbo]);
        }else{
            node = graph.add(nodeType.klass);
        }

        if (bui.util.propertySetAndNotNull(nodeJSON, ['data', 'label'])) {
            if (node.label !== undefined) {
                node.label(nodeJSON.data.label);
            }
        }
        if (bui.util.propertySetAndNotNull(nodeJSON, ['data', 'orientation'])) {
            try{
                node.orientation(nodeJSON.data.orientation);
            } catch (e) {
                log('FIXME orientation only for Tag at the moment: '+e);
            }
        }

        nodeJSON.data = nodeJSON.data || {};

        if (bui.util.propertySetAndNotNull(nodeJSON,
                ['data', 'x'], ['data', 'y'])) {
            nodeJSON.data.x = bui.util.toNumber(nodeJSON.data.x);
            nodeJSON.data.y = bui.util.toNumber(nodeJSON.data.y);

            node.position(nodeJSON.data.x, nodeJSON.data.y);
        }

        var standardNodeSize = bui.settings.style.importer.standardNodeSize;
        var size = {
            width : standardNodeSize.width,
            height : standardNodeSize.height
        };

        if (bui.util.propertySetAndNotNull(nodeJSON,
                ['data', 'width'], ['data', 'height'])) {
            size.width = nodeJSON.data.width;
            size.height = nodeJSON.data.height;
        } else if (node.sizeBasedOnLabel !== undefined && (!(node._ignLabelSize))) {
            size = node.sizeBasedOnLabel();

            // some padding because of various shapes
            var padding = bui.settings.style.importer.sizeBasedOnLabelPassing;
            size.width += padding.horizontal;
            size.height += padding.vertical;
        }

        if (bui.util.propertySetAndNotNull(nodeJSON,
                ['data', 'cssClasses'])) {
            node.addClass(nodeJSON.data.cssClasses);
        }

        if(('clone_marker' in nodeJSON.data)&&(nodeJSON.data.clone_marker == true)){
            node.addClass('cloneMarker');
        }

        node.size(size.width, size.height)
                .visible(true);

        nodeJSON.data.width = size.width;
        nodeJSON.data.height = size.height;
        
        if (nodeJSON.data.unitofinformation !== undefined) {
            for (var i = 0; i < nodeJSON.data.unitofinformation.length; i++) {
                uoi = graph.add(bui.UnitOfInformation)
                        .label(nodeJSON.data.unitofinformation[i])
                        .parent(node)
                        .visible(true)
                        .json(nodeJSON.data.unitofinformation[i]);//FIXME needs to be added to json, no clue what this does
            }
        }
        // generic state variables
        if (bui.util.propertySetAndNotNull(nodeJSON,
                ['data', 'statevariable'])) {
            var variables = nodeJSON.data.statevariable;
            var state_class_obj = bui.StateVariable;
            if(bui.settings.SBGNlang == 'ER'){
                state_class_obj = bui.StateVariableER;
            }
            for (var i = 0; i < variables.length; i++) {
                statevar = graph.add(state_class_obj)
                        .label(variables[i])
                        .parent(node)
                        .visible(true)
                        .json(variables[i]);//FIXME needs to be added to json, no clue what this does
                if(bui.settings.SBGNlang == 'ER'){
                    statevar.size(60,14)
                    if(variables[i] == 'existence'){
                        statevar.label('').addClass('existence').size(14,14);
                    }
                    if(variables[i] == 'location'){
                        statevar.label('').addClass('location').size(14,14);
                    }
                }
            }
        }
        if (bui.util.propertySetAndNotNull(nodeJSON,
                ['data', 'modification'])) {
            //alert ('xyrock');
            var modifications = nodeJSON.data.modification;

            for (var i = 0; i < modifications.length; i++) {
                var modification = modifications[i];
                //log('adding modification');

                var label, mapping = retrieveFrom(modificationMapping,
                        modification[0]);

                label = mapping.short;

                if (bui.settings.style.importer.modificationLabel === 'long') {
                    label += '@' + modification[1];
                }

                graph.add(bui.StateVariable)
                        .label(label)
                        .parent(node)
                        .visible(true)
                        .json(modification);
            }
        }

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

        var edge_stack = [];
        var drawables = graph.drawables();
        var generatedEdges = {};
        for (var i = 0; i < edges.length; i++) {
            var edgeJSON = edges[i], edge;

            if ((edgeJSON.source === undefined)||(edgeJSON.target===undefined)){
                continue;
            }
            var source = undefined;
            //if there are ports defined (molecule:domain-port) make them to the target
            if (edgeJSON.source.indexOf(':') != -1){
                node_ids = edgeJSON.source.split(':');
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
            var target = undefined;
            //if there are ports defined (molecule:domain-port) make them to the target
            if (edgeJSON.target.indexOf(':') != -1){
                node_ids = edgeJSON.target.split(':');
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

            if ((source === undefined)||(target === undefined)) {
                edge_stack.push(edgeJSON);
                continue;
            }

            // ensuring that the data property exists
            edgeJSON.data = edgeJSON.data || {};

            if (edgeJSON.data.handles !== undefined && edgeJSON.data.handles.length>=4) {
                edge = graph.add(bui.Spline)
                    .layoutElementsVisible(false);

                edge.json(edgeJSON).source(source).target(target);

                if (edgeJSON.data.points !== undefined) {
                    edge.setSplinePoints(edgeJSON.data.points);
                }
                if (edgeJSON.data.handles !== undefined) {
                    edge.setSplineHandlePositions(edgeJSON.data.handles);
                }
            } else {
                edge = graph.add(bui.Edge);
                edge.json(edgeJSON).source(source).target(target);
                if(edgeJSON.data.points !== undefined){
                    for(var j=0; j<edgeJSON.data.points.length; j += 2){
                        edge.addPoint(edgeJSON.data.points[j], edgeJSON.data.points[j+1])
                    }
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
                    back_edge = graph.add(bui.Edge);
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

        var last_len = edge_stack.length + 1;
        //alert(edge_stack.length);
        while ((edge_stack.length > 0) && (edge_stack.length<last_len)){
            last_len = edge_stack.length;
            for(var i = 0; i<edge_stack.length;i++){
                var edgeJSON = edge_stack[i];
                //alert(edge_stack.length+'Processing '+JSON.stringify(edgeJSON));
                //---------------------------
                var target = undefined;
                if (edgeJSON.target.indexOf(':') != -1){
                    node_ids = edgeJSON.target.split(':');
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
                }else{ target = generatedNodes[edgeJSON.target]; }

                if(target === undefined){
                    var target_edge = generatedEdges[edgeJSON.target];
                    if (target_edge === undefined) continue;  
                    target = target_edge.addPoint(0,0);
                }
                //---------------------------
                var source = undefined; 
                if (edgeJSON.source.indexOf(':') != -1){
                    node_ids = edgeJSON.source.split(':');
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
                }else{ source = generatedNodes[edgeJSON.source]; }

                if(source===undefined){
                    var source_edge = generatedEdges[edgeJSON.source];
                    if (source_edge === undefined) continue;  
                    source = source_edge.addPoint(0,0, 'Outcome');//FIXME this does not give the proper positions ... y???
                }
                //---------------------------
                //---------------------------
                if ((source === undefined)||(target === undefined)) continue
                rm_elem = edge_stack.splice(i,1);
                //alert('success '+JSON.stringify(rm_elem));
                edge = graph.add(bui.Edge);
                edge.source(source).target(target);//.json(edgeJSON);
                var marker = retrieveFrom(edgeMarkerMapping, edgeJSON.sbo);
                edge.marker(marker.klass);
                generatedEdges[edgeJSON.id] = edge;
            }
        }
        //recalculate all edge points this should be prevented if points were specified
        for(edge_id in generatedEdges){
            edge = generatedEdges[edge_id];
            handles = edge.handles();
            for(var i=0; i<handles.length; i++){
                var curpos = handles[i].positionCenter(); 
                if(curpos.x==0 && curpos.y==0){
                    edge.recalculatePoints();
                    break;
                }
            }
        }
        for(var i = 0; i<edge_stack.length; i++){
            var flag = true;
            if ((generatedNodes[edge_stack[i].source] === undefined) && (generatedEdges[edge_stack[i].source] === undefined)){
                log('Edge source '+edge_stack[i].source+' could not be found. Edge ID: '+edge_stack[i].id);
                flag = false;
            }
            if ((generatedNodes[edge_stack[i].target] === undefined) && (generatedEdges[edge_stack[i].target] === undefined)){
                log('Edge target '+edge_stack[i].target+' could not be found. Edge ID: '+edge_stack[i].id);
                flag = false;
            }
            if (flag) log('found but not added: '+JSON.stringify(edge_stack[i]));
            //log('Edge source '+edge_stack[i].source+' or target ' + edge_stack[i].target + ' could not be found.');
        } 
        log('Edge stack still contains '+String(edge_stack.length)+' edges');
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
            } else if (!bui.util.propertySetAndNotNull(edgeJSON,
                    ['data', 'type'], ['data', 'handles'])) {
                continue;
            } else if (edgeJSON.data.type !== 'curve') {
                continue;
            }

            edge.setSplineHandlePositions(edgeJSON.data.handles, duration);
            edge.setSplinePoints(edgeJSON.data.points, duration);
        }
    };
})(bui);
