#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

### SBO definitions ###

SBOs = {}

# Visualizer wrapper

nodeMapping = SBOs
processNodeMapping = SBOs
edgeMarkerMapping = SBOs

# node keywords
UnspecifiedEntity = 'Unspecified'
SimpleChemical = 'Simple Chemical'
Macromolecule = 'Macromolecule'
NucleicAcidFeature = 'Nucleic Acid Feature'
Complex = 'Complex'
Compartment = 'Compartment'
Process = 'Process'
Helper = 'Helper'

NodeTypes = [UnspecifiedEntity, SimpleChemical, Macromolecule, NucleicAcidFeature, Complex, Compartment, Process]

# edge keywords
modulation = 'Modulation'
inhibition = 'Inhibition'
absoluteInhibition = 'Absolute Inhibition'
assignment = 'Assignment'
interaction = 'Interaction'
stimulation = 'Stimulation'
substrate = 'Substrate'
product = 'Product'
necessaryStimulation = 'Necessary Stimulation'
catalysis = 'Catalysis'

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
addMapping(edgeMarkerMapping, [342], interaction);
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


# translations for the Layouter
# see http://code.google.com/p/biographer/wiki/SBO

## what the Layouter understands

# nodes
Reaction = "Reaction"
Compound = "Compound"
_Compartment = "Compartment"
Other = "Other"

# edges
Directed = "Directed"
Undirected = "Undirected"
Substrate = "Substrate"
Product = "Product"
Catalyst = "Catalyst"
Activator = "Activator"
Inhibitor = "Inhibitor"

SBO_Translations_for_Layouter = {	# nodes
					UnspecifiedEntity:	Compound,
					SimpleChemical:		Compound,
					Macromolecule:		Compound,
					NucleicAcidFeature:	Compound,
					Complex:		Compound,
					Compartment:		_Compartment,
					Process:		Reaction,
					Helper:			Compound,

					# edges
					modulation:		Activator,
					inhibition:		Inhibitor,
					absoluteInhibition:	Inhibitor,
					assignment:		Undirected,
					interaction:		Undirected,
					stimulation:		Activator,
					substrate:		Substrate,
					product:		Product,
					necessaryStimulation:	Activator,
					catalysis:		Catalyst
				}

def global2layouter(text):
	if text in SBO_Translations_for_Layouter.keys():
		return SBO_Translations_for_Layouter[text]
	else:
		return Compound	# fallback value

#def layouter2global(text):	# don't translate back, just keep the loaded types

# end translation section


### SBO related functions ###

def keyOf(dictionary, value):						# return the first key, having the given value inside the dictionary
	for key in dictionary.keys():
		if dictionary[key].lower() == value.lower():
			return key
	return None

def getSBO(term):							# return SBO number of SBO term
#	print term
	term = str(term).lower()

	if term in [x.lower() for x in SBOs.values()]:
		result = keyOf(SBOs, term)
	else:
		result = UnspecifiedEntity

#	print '->'+str(result)

	return str(result)

def getNodeType(text):
	print text
	text = str(text).lower()

	for key in SBOs.keys():
		if str(text) == str(key) or text == SBOs[key].lower() or text == SBOs[key].lower()+' node' or text+' node' == SBOs[key].lower():
			print '->'+SBOs[key]
			return SBOs[key]

	return UnspecifiedEntity

def getEdgeType(number):
	print str(number)

	try:
		if int(number) in EdgeSBO.keys():
			print '->'+SBOs[int(number)]
			return SBOs[int(number)]
	except:
		pass

	return substrate

