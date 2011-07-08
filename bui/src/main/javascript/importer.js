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

    // TODO document varargs
    /**
     * Verify that an object has a property with the given name and that this
     * property is not null.
     *
     * @param {Object} obj The object which should be checked for the property.
     * @param {String} property The name of the property
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

    // TODO fails on complex, also node sizes are missing, also document
    var defaultNodeGenerator = function(graph, nodeType, nodeJSON) {
        var node = graph.add(nodeType.klass);

        if (propertySetAndNotNull(nodeJSON, 'label')) {
            node.label(nodeJSON.label);
        }

        if (propertySetAndNotNull(nodeJSON, 'x', 'y')) {
            node.position(nodeJSON.x, nodeJSON.y);
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
        var nodes = data.nodes;

        for(var i = 0; i < nodes.length; i++) {
            // TODO: remove try-catch block
            try {
                var nodeJSON = nodes[i];
                var nodeType = retrieveFrom(nodeMapping, nodeJSON.sbo);

                if (nodeType.hasOwnProperty('generator')) {
                    nodeType.generator(graph, nodeJSON);
                } else {
                    defaultNodeGenerator(graph, nodeType, nodeJSON);
                }
            } catch (e) {
                console.log(e);
            }
        }
    };
})(bui);