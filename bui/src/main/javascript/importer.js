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
        var node = graph.add(nodeType.klass);

        if (bui.util.propertySetAndNotNull(nodeJSON, ['data', 'label'])) {
            if (node.label !== undefined) {
                node.label(nodeJSON.data.label);
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

        if (node.sizeBasedOnLabel !== undefined) {
            size = node.sizeBasedOnLabel();

            // some padding because of various shapes
            var padding = bui.settings.style.importer.sizeBasedOnLabelPassing;
            size.width += padding.horizontal;
            size.height += padding.vertical;
        }

        node.size(size.width, size.height)
                .visible(true);

        nodeJSON.data.width = size.width;
        nodeJSON.data.height = size.height;

        if (bui.util.propertySetAndNotNull(nodeJSON,
                ['data', 'modification'])) {
            var modifications = nodeJSON.data.modification;

            for (var i = 0; i < modifications.length; i++) {
                var modification = modifications[i];

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

        for (var i = 0; i < edges.length; i++) {
            var edgeJSON = edges[i], edge;

            var source = generatedNodes[edgeJSON.source];
            var target = generatedNodes[edgeJSON.target];

            if (source === undefined) {
                log('Edge source ' + edgeJSON.source + ' could not be found.');
                continue;
            } else if (target === undefined) {
                log('Edge target ' + edgeJSON.target + ' could not be found.');
                continue;
            }

            // ensuring that the data property exists
            edgeJSON.data = edgeJSON.data || {};

            if (edgeJSON.data.type !== 'curve') {
                edge = graph.add(bui.Edge);
            } else {
                edge = graph.add(bui.Spline)
                        .layoutElementsVisible(false);

                if (edgeJSON.data.handles !== undefined) {
                    edge.setSplineHandlePositions(edgeJSON.data.handles);
                }
            }

            edge.json(edgeJSON).source(source).target(target);

            if (edgeJSON.sbo !== undefined) {
                try {
                    var marker = retrieveFrom(edgeMarkerMapping, edgeJSON.sbo);
                    edge.marker(marker.klass);
                } catch (e) {
                    log(e);
                }
            }

            var style = bui.AbstractLine.Style[edgeJSON.data.style];
            if (style !== undefined) {
                edge.lineStyle(style);
            }

            edge.visible(true);
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
        var alignRecursively = function(node) {
            var children = node.childrenWithoutAuxiliaryUnits();

            node.toFront();

            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                alignRecursively(child);
            }
        };

        for (var id in nodes) {
            if (nodes.hasOwnProperty(id)) {
                var node = nodes[id];

                if (node.hasParent() === false &&
                        node.childrenWithoutAuxiliaryUnits().length > 0) {
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
    bui.importUpdatedNodePositionsFromJSON = function(graph, data, duration) {
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
            } else if (node.hasParent() === true) {
                continue;
            }

            var x = nodeJSON.data.x,
                    y = nodeJSON.data.y,
                    currentPosition = node.position();

            node.move(x - currentPosition.x, y - currentPosition.y, duration);
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
        }
    };
})(bui);