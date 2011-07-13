(function(bui) {

    /**
     * Add mappings to the mappings object.
     *
     * @param {Object} mapping The mappings object
     * @param {Number[]} keys The keys which should be mapped
     * @param {Function} klass A classes' constructor
     * @param {Function} [generator] Generator funtion which should be used
     *   instead of the constructor.
     */
    var addMapping = function(mapping, keys, klass, generator) {
        var val = { klass : klass };

        if (generator !== undefined) {
            val.generator = generator;
        }

        for (var i = 0; i < keys.length; i++) {
            mapping[keys[i]] = val;
        }
    };

    /**
     * @private
     * Mapping between SBO terms and biographer-ui classes.
     */
    var nodeMapping = {}, processNodeMapping = {}, edgeMarkerMapping = {};

    addMapping(nodeMapping, [285], bui.UnspecifiedEntity);
    addMapping(nodeMapping, [247], bui.SimpleChemical);
    addMapping(nodeMapping, [245, 252], bui.Macromolecule);
    addMapping(nodeMapping, [250, 251], bui.NucleicAcidFeature);
    addMapping(nodeMapping, [253], bui.Complex);
    addMapping(nodeMapping, [290], bui.Compartment);

    addMapping(processNodeMapping, [375], bui.Process);

    addMapping(edgeMarkerMapping, [19], bui.connectingArcs.modulation.id);
    addMapping(edgeMarkerMapping, [20], bui.connectingArcs.inhibition.id);
    addMapping(edgeMarkerMapping, [459], bui.connectingArcs.stimulation.id);
    addMapping(edgeMarkerMapping, [461],
            bui.connectingArcs.necessaryStimulation.id);
    addMapping(edgeMarkerMapping, [13], bui.connectingArcs.catalysis.id);

    /**
     * Retrieve the class and generator from a mapping object. When the mapping
     * object does not have an appropriate class or generator object an
     * exception will be thrown.
     *
     * @param {Object} mapping A mapping object, i.e. an object with SBO ids
     *   as keys. The values should be objects will at least a 'klass'
     *   property.
     * @param {Number} sbo The SBO id.
     * @return {Object} An object with a 'klass' and an optional 'generator'
     *   property.
     */
    var retrieveFrom = function(mapping, sbo) {
        if (mapping.hasOwnProperty(sbo)) {
            return mapping[sbo];
        } else {
            throw 'SBO id "' + sbo + '" could not be found.';
        }
    };

    /**
     * Verify that an object has a property with the given name and that this
     * property is not null.
     *
     * @param {Object} obj The object which should be checked for the property.
     * @param {String} property Property names which should be checked. This is
     *   a var args method.
     * @return {Boolean} True in case the property exists and is not null.
     *   False otherwise.
     */
    var propertySetAndNotNull = function() {
        var obj = arguments[0];
        for(var i = 1; i < arguments.length; i++) {
            var property = arguments[i];
            if (obj.hasOwnProperty(property) === false ||
                    obj[property] === null) {
                return false;
            }
        }

        return true;
    };

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

        if (propertySetAndNotNull(nodeJSON.data, 'label')) {
            if (node.label !== undefined) {
                node.label(nodeJSON.data.label);
            }
        }

        if (propertySetAndNotNull(nodeJSON.data, 'x', 'y')) {
            nodeJSON.data.x = toNumber(nodeJSON.data.x);
            nodeJSON.data.y = toNumber(nodeJSON.data.y);

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

        return node;
    };

    /**
     * Retrieve the node's id or the ref key if applicable.
     *
     * @param {Object} nodeJSON Node information
     * @return {String} The node's id or ref key.
     */
    var getId = function(nodeJSON) {
        var id = nodeJSON.id;

        if (nodeJSON.data.ref !== undefined) {
            id = nodeJSON.data.ref;
        }

        return id;
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

        // add all nodes
        for(var i = 0; i < nodes.length; i++) {
            // TODO: remove try-catch block or use different error handling
            try {
                nodeJSON = nodes[i];
                var nodeType = retrieveFrom(nodeMapping, nodeJSON.sbo);

                if (nodeType.hasOwnProperty('generator')) {
                    node = nodeType.generator(graph, nodeJSON);
                } else {
                    node = defaultNodeGenerator(graph, nodeType, nodeJSON);
                }

                node.json(nodeJSON);
                generatedNodes[getId(nodeJSON)] = node;
            } catch (e) {
                console.log(e);
            }
        }

        // add relationship information
        for (var key in generatedNodes) {
            if (generatedNodes.hasOwnProperty(key)) {
                node = generatedNodes[key];
                nodeJSON = node.json();

                if (nodeJSON.data.subnodes !== undefined) {
                    for (var j = 0; j <  nodeJSON.data.subnodes.length; j++) {
                        var subNodeId = nodeJSON.data.subnodes[j];
                        var subNode = generatedNodes[subNodeId];
                        subNode.parent(node);
                    }
                }
            }
        }

        return generatedNodes;
    };

    /**
     * Layout this complex node and all its sub-nodes.
     *
     * @param {bui.Node} node A bui.Complex instances which needs layouting.
     */
    var layoutComplex = function(node) {
        
    };

    /**
     * Layout the complex nodes using a table layout.
     *
     * @param {Object} nodes A map which keys map onto {@link bui.Node}
     *   instances.
     */
    var doComplexLayout = function(nodes) {
        for(var key in nodes) {
            if (nodes.hasOwnProperty(key)) {
                var node = nodes[key];

                if (node instanceof bui.Complex &&
                        node.parent() === node.graph()) {
                    layoutComplex(node);
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
        var generatedNodes = addAllNodes(graph, data);
        doComplexLayout(generatedNodes);
    };
})(bui);