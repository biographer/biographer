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
var nodeMapping = {}, processNodeMapping = {}, edgeMarkerMapping = {},
        modificationMapping = {};

// TODO remove mapping to 167
addMapping(nodeMapping, [285, 167], bui.UnspecifiedEntity);
addMapping(nodeMapping, [247, 240], bui.SimpleChemical);
addMapping(nodeMapping, [245, 252], bui.Macromolecule);
addMapping(nodeMapping, [250, 251], bui.NucleicAcidFeature);
addMapping(nodeMapping, [253], bui.Complex);
addMapping(nodeMapping, [290], bui.Compartment);


addMapping(nodeMapping, [375], bui.Process);
addMapping(processNodeMapping, [375], bui.Process);


addMapping(edgeMarkerMapping, [19], bui.connectingArcs.modulation.id);
addMapping(edgeMarkerMapping, [20], bui.connectingArcs.inhibition.id);
// TODO remove mapping to 15 and 11
addMapping(edgeMarkerMapping, [459, 15, 11], bui.connectingArcs.stimulation.id);
addMapping(edgeMarkerMapping, [461],
        bui.connectingArcs.necessaryStimulation.id);
addMapping(edgeMarkerMapping, [13], bui.connectingArcs.catalysis.id);

/**
 * Add mappings to the mappings object.
 *
 * @param {Number[]} keys The keys which should be mapped
 * @param {String} long Long name of the SBO term
 * @param {String} short Short name (abbreviation of the SBO term
 */
var addModificationMapping = function(keys, long, short) {
    var val = {
        long : long,
        short : short
    };

    for (var i = 0; i < keys.length; i++) {
        if (modificationMapping.hasOwnProperty(keys[i])) {
            log('Warning: The mapping of modification keys has' +
                    ' already a mapping for key: ' + keys[i]);
        } else {
            modificationMapping[keys[i]] = val;
        }
    }
};

addModificationMapping([215], 'acetylation', 'A');
addModificationMapping([111101], 'active', 'active');
addModificationMapping([217], 'glycosylation', 'G');
addModificationMapping([111100], 'glycosylphosphatidylinositolation', 'GPI');
addModificationMapping([233], 'hydroxylation', 'OH');
addModificationMapping([111102], 'inactive', 'inactive');
addModificationMapping([214], 'methylation', 'M');
addModificationMapping([219], 'myristoylation', 'MYR');
addModificationMapping([218], 'palmitoylation', 'PAL');
addModificationMapping([216], 'phosphorylation', 'P');
addModificationMapping([224], 'ubiquitination', 'U');
addModificationMapping([111100], 'unknownModification', '?');
addModificationMapping([111101], 'PTM_active1', 'active');
addModificationMapping([111101], 'PTM_active2', 'active');
addModificationMapping([111100], 'PTM_farnesylation', 'F');
addModificationMapping([111100], 'geranylgeranylation', 'GER');
addModificationMapping([111100], 'PTM_glycosaminoglycan', 'GA');
addModificationMapping([111100], 'PTM_oxidation', '0');
addModificationMapping([111100], 'PTM_sumoylation', 'S');

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
        throw('Warning: SBO id "' + sbo + '" could not be found.');
    }
};