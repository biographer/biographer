(function(bui) {
    /**
     * @private
     * Mapping between SBO terms and biographer-ui classes for entity pool
     * nodes.
     */
    var nodeMapping = {
        245 : { klass : bui.Macromolecule },
        247 : { klass : bui.SimpleChemical },
        253 : { klass : bui.Complex },
        285 : { klass : bui.UnspecifiedEntity },
        290 : { klass : bui.Compartment },
        354 : { klass : bui.NucleicAcidFeature }
    };

    /**
     * @private
     * Mapping between SBO terms and biographer-ui classes for process nodes.
     */
    var processNodeMapping = {
        375 : { klass : bui.Process }
    };

    /**
     * @private
     * Mapping between SBO terms and biographer-ui classes for connecting arcs.
     */
    var edgeMarkerMapping = {
        168 : { klass : bui.connectingArcs.modulation.id },
        169 : { klass : bui.connectingArcs.inhibition.id },
        170 : { klass : bui.connectingArcs.stimulation.id },
        171 : { klass : bui.connectingArcs.necessaryStimulation.id },
        172 : { klass : bui.connectingArcs.catalysis.id }
    };

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