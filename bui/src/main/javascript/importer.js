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
     *   as keys. The values should be objects will at least a class
     *   property.
     * @param {Number} sbo The SBO id.
     * @return {Object} An object with a 'class' and an optional 'generator'
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
     * Import nodes and edges from JSON using this function.
     *
     * @param {bui.Graph} graph The target graph to which the nodes and edges
     *   should be added.
     * @param {Object} data JSON data which should be imported
     */
    bui.importFromJSON = function(graph, data) {
        
    };
})(bui);