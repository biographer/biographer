(function(bui) {
    /**
     * @private
     * Mapping between SBO terms and biographer-ui classes for entity pool
     * nodes.
     */
    var nodeMapping = {
        245 : { class : bui.Macromolecule },
        247 : { class : bui.SimpleChemical },
        253 : { class : bui.Complex },
        285 : { class : bui.UnspecifiedEntity },
        290 : { class : bui.Compartment },
        354 : { class : bui.NucleicAcidFeature }
    };

    /**
     * @private
     * Mapping between SBO terms and biographer-ui classes for process nodes.
     */
    var processNodeMapping = {
        375 : { class : bui.Process }
    };

    /**
     * @private
     * Mapping between SBO terms and biographer-ui classes for connecting arcs.
     */
    var edgeMarkerMapping = {
        168 : { class : bui.connectingArcs.modulation.id },
        169 : { class : bui.connectingArcs.inhibition.id },
        170 : { class : bui.connectingArcs.stimulation.id },
        171 : { class : bui.connectingArcs.necessaryStimulation.id },
        172 : { class : bui.connectingArcs.catalysis.id }
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
    bui.import = function(graph, data) {
        
    };
})(bui);