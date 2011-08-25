/*
 * All these functions and variables are defined in the util.js file as
 * the specific node types need access for the variables for the JSON
 * export.
 */

addMapping(nodeMapping, [285], bui.UnspecifiedEntity);
addMapping(nodeMapping, [247, 240], bui.SimpleChemical);
addMapping(nodeMapping, [245, 252], bui.Macromolecule);
addMapping(nodeMapping, [250, 251], bui.NucleicAcidFeature);
addMapping(nodeMapping, [253], bui.Complex);
addMapping(nodeMapping, [290], bui.Compartment);
addMapping(nodeMapping, [375, 167], bui.Process);


addMapping(processNodeMapping, [375, 167], bui.Process);


addMapping(edgeMarkerMapping, [19], bui.connectingArcs.modulation.id);
addMapping(edgeMarkerMapping, [20], bui.connectingArcs.inhibition.id);
addMapping(edgeMarkerMapping, [459, 15, 11], bui.connectingArcs.stimulation.id);
addMapping(edgeMarkerMapping, [461],
        bui.connectingArcs.necessaryStimulation.id);
addMapping(edgeMarkerMapping, [13], bui.connectingArcs.catalysis.id);


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