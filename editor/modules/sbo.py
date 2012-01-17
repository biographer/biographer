#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

### SBO definitions ###

SBOs = {}

# Visualizer definition wrapping

nodeMapping = SBOs
processNodeMapping = SBOs
edgeMarkerMapping = SBOs

UnspecifiedEntity = ''
SimpleChemical
Macromolecule
NucleicAcidFeature
Complex
Compartment
Process
Helper

Process

modulation
inhibition
absoluteInhibition
assignment
interaction
stimulation
substrate
product
necessaryStimulation
catalysis

def addMapping(which, numbers, term):
	for number in numbers:
		which[number] = term

def addModificationMapping(numbers, term, trash):
	addMapping(SBOs, numbers, term)

### paste below the global SBO definitions
### from http://code.google.com/p/biographer/source/browse/src/main/javascript/sboMappings.js?repo=visualization
### and remove all
###	bui.
###	connectingArcs.
###	.id

addMapping(nodeMapping, [285], UnspecifiedEntity);
addMapping(nodeMapping, [247, 240], SimpleChemical);
addMapping(nodeMapping, [245, 252], Macromolecule);
addMapping(nodeMapping, [250, 251], NucleicAcidFeature);
addMapping(nodeMapping, [253], Complex);
addMapping(nodeMapping, [290], Compartment);
addMapping(nodeMapping, [375, 167], Process);
addMapping(nodeMapping, [-1], Helper);

addMapping(processNodeMapping, [375, 167], Process);
addMapping(processNodeMapping, [-1], Helper);

addMapping(edgeMarkerMapping, [19], modulation);
addMapping(edgeMarkerMapping, [20], inhibition);
addMapping(edgeMarkerMapping, [407], absoluteInhibition);
addMapping(edgeMarkerMapping, [464], assignment);
//addMapping(edgeMarkerMapping, [342], interaction);
addMapping(edgeMarkerMapping, [459,462], stimulation);
addMapping(edgeMarkerMapping, [15], substrate);
addMapping(edgeMarkerMapping, [11], product);
addMapping(edgeMarkerMapping, [461], necessaryStimulation);
addMapping(edgeMarkerMapping, [13], catalysis);

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

### end of pasted content


# translations for Layouter "specials"
# see http://code.google.com/p/biographer/wiki/SBO , section "Layouter specials"


SBODefinedEdgeType2LayoutEdgeTypeMapping = {	"Reactant":		"Substrate",
						"Production":		"Product",
						"Consumption":		"Substrate",
						"Modulation":		"Catalyst",
						"Inhibition":		"Inhibitor",
						"Stimulation":		"Activator",
						"Necessary Stimulation":"Activator",
						"Catalysis":		"Catalyst"	}

# end translation section


### SBO related functions ###

def keyOf(dictionary, value):						# return the first key, having the given value inside the dictionary
	for key in dictionary.keys():
		if dictionary[key].lower() == value.lower():
			return key
	return None

def getSBO(term):							# return SBO number of SBO term
	term = str(term).lower()
	if term in [x.lower() for x in NodeSBO.values()]:
		result = keyOf(NodeSBO, term)				# Node SBO
	elif term in [x.lower() for x in EdgeSBO.values()]:
		result = keyOf(EdgeSBO, term)				# Edge SBO
	elif term in [x.lower() for x in ModificationSBO.values()]:
		result = keyOf(ModificationSBO, term)			# Modification SBO
	elif term == -1 or term == "-1":
		result = 285 # Unspecified
	else:
		result = 285 # Unspecified				# default SBO, if nothing matches
		print "Error: Unknown SBO term '"+str(term)+"' !"
	return str(result)

def getNodeType(text):
	text = text.lower()
	for key in NodeTypes.keys():
		if text == key.lower() or text+' node' == key.lower():
			return NodeTypes[key]
	return 0

def getLayoutNodeType(type):						# QUICKFIX -> Acer/Thomas
	if type == NodeTypes["Process Node"]:
		return "Reaction"
	else:
		return "Compound"

def getEdgeType(SBO):							# get Edge type by SBO number
	t = LayoutEdgeTypes[0]	# fallback: Substrate

	if SBO in EdgeSBO.keys():
		t = EdgeSBO[SBO]

	if SBO in SBODefinedEdgeType2LayoutEdgeTypeMapping.keys():
		t = SBODefinedEdgeType2LayoutEdgeTypeMapping[SBO]

	return t

