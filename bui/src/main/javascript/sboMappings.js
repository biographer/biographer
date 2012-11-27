/*
 * All these functions and variables are defined in the util.js file as
 * the specific node types need access for the variables for the JSON
 * export.
 */

addMapping(nodeMapping, [285], bui.UnspecifiedEntity);
addMapping(nodeMapping, [247, 240, 245], bui.SimpleChemical);
addMapping(nodeMapping, [245, 252], bui.Macromolecule);
addMapping(nodeMapping, [250, 251], bui.NucleicAcidFeature);
addMapping(nodeMapping, [405, 357], bui.Perturbation);
addMapping(nodeMapping, [358], bui.Phenotype);
addMapping(nodeMapping, [253], bui.Complex);
addMapping(nodeMapping, [290], bui.Compartment);
addMapping(nodeMapping, [375, 167, 379, 396], bui.Process);
addMapping(nodeMapping, [-1], bui.Helper);
addMapping(nodeMapping, [110001], bui.VariableValue);
addMapping(nodeMapping, [110002, 110004], bui.Tag);
//SBO:0000395 ! encapsulating process
addMapping(nodeMapping, [395, 412,110003], bui.RectangularNode);//Annotation
//SBO:0000409 ! interaction outcome
addMapping(nodeMapping, [177,409], bui.Association);
addMapping(nodeMapping, [180], bui.Dissociation);
addMapping(nodeMapping, [174,173,238,225], bui.LogicalOperator);
addMapping(nodeMapping, [291], bui.EmptySet);
addMapping(nodeMapping, [110005], bui.EdgeHandle);
addMapping(processNodeMapping, [375, 167], bui.Process);




addMapping(edgeMarkerMapping, [19, 168], bui.connectingArcs.control.id);
addMapping(edgeMarkerMapping, [20, 169], bui.connectingArcs.inhibition.id);
addMapping(edgeMarkerMapping, [407], bui.connectingArcs.absoluteInhibition.id);
addMapping(edgeMarkerMapping, [464,342], bui.connectingArcs.assignment.id);
//addMapping(edgeMarkerMapping, [342], bui.connectingArcs.interaction.id);
addMapping(edgeMarkerMapping, [459, 462, 170], bui.connectingArcs.stimulation.id);
addMapping(edgeMarkerMapping, [15, 394], bui.connectingArcs.substrate.id);
addMapping(edgeMarkerMapping, [11, 393], bui.connectingArcs.production.id);
addMapping(edgeMarkerMapping, [461], bui.connectingArcs.necessaryStimulation.id);
addMapping(edgeMarkerMapping, [13], bui.connectingArcs.catalysis.id);
addMapping(edgeMarkerMapping, [411], bui.connectingArcs.absoluteStimulation.id);


addModificationMapping([111100], 'unknownModification', '?');
addModificationMapping([111101], 'active', 'active');
addModificationMapping([111102], 'inactive', 'inactive');
addModificationMapping([215], 'acetylation', 'A');
addModificationMapping([217], 'glycosylation', 'G');
addModificationMapping([233], 'hydroxylation', 'OH');
addModificationMapping([214], 'methylation', 'M');
addModificationMapping([219], 'myristoylation', 'MYR');
addModificationMapping([218], 'palmitoylation', 'PAL');
addModificationMapping([216], 'phosphorylation', 'P');
addModificationMapping([224], 'ubiquitination', 'U');
/*addModificationMapping([111100], 'glycosylphosphatidylinositolation', 'GPI');
addModificationMapping([111101], 'PTM_active1', 'active');
addModificationMapping([111101], 'PTM_active2', 'active');
addModificationMapping([111100], 'PTM_farnesylation', 'F');
addModificationMapping([111100], 'geranylgeranylation', 'GER');
addModificationMapping([111100], 'PTM_glycosaminoglycan', 'GA');
addModificationMapping([111100], 'PTM_oxidation', '0');
addModificationMapping([111100], 'PTM_sumoylation', 'S');
*/
