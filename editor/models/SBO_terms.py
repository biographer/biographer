#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

### SBO definitions ###

NodeSBO = EdgeSBO = ModificationSBO = {}

NodeSBO[285] = NodeSBO[167] = "Unspecified"
NodeSBO[247] = NodeSBO[240] = "Simple Chemical"

NodeSBO[245] = NodeSBO[252] = "Macromolecule"
NodeSBO[250] = NodeSBO[251] = "Nucleic Acid Feature"
NodeSBO[253] = "Complex"
NodeSBO[290] = "Compartment"
NodeSBO[375] = "Process"

EdgeSBO[10] = EdgeSBO[336] = "Reactant"
EdgeSBO[393] = "Production"
EdgeSBO[394] = "Consumption"
EdgeSBO[19] = "Modulation"
EdgeSBO[20] = "Inhibition"
EdgeSBO[459] = EdgeSBO[15] = EdgeSBO[11] = "Stimulation"
EdgeSBO[461] =  "Necessary Stimulation"
EdgeSBO[13] = "Catalysis"

ModificationSBO[215] = 'Acetylation'
ModificationSBO[111101] = 'Active'
ModificationSBO[217] = 'Glycosylation'
ModificationSBO[111100] = 'Glycosylphosphatidylinositolation'
ModificationSBO[233] = 'Hydroxylation'
ModificationSBO[111102] = 'Inactive'
ModificationSBO[214] = 'Methylation'
ModificationSBO[219] = 'Myristoylation'
ModificationSBO[218] = 'Palmitoylation'
ModificationSBO[216] = 'Phosphorylation'
ModificationSBO[224] = 'Ubiquitination'
ModificationSBO[111100] = 'Unknown Modification'
ModificationSBO[111101] = 'PTM Active1'
ModificationSBO[111101] = 'PTM Active2'
ModificationSBO[111100] = 'PTM Farnesylation'
ModificationSBO[111100] = 'Geranylgeranylation'
ModificationSBO[111100] = 'PTM Glycosaminoglycan'
ModificationSBO[111100] = 'PTM Oxidation'
ModificationSBO[111100] = 'PTM Sumoylation'

NodeTypes = { "Entitiy Pool Node":"reaction", "Auxiliary Unit":"simple_species", "Compartment Node":"compartment", "Container Node":"complex_species", "Process Node":"reaction", "Reference Node":"info" }

LayoutEdgeTypes = ["Substrate", "Product", "Catalyst", "Activator", "Inhibitor"]

#EdgeSBO[10] = EdgeSBO[336] = "Reactant"			->	Substrate
#EdgeSBO[393] = "Production"					->	Product
#EdgeSBO[394] = "Consumption"					->	Substrate
#EdgeSBO[19] = "Modulation"					->	Catalyst
#EdgeSBO[20] = "Inhibition"					->	Inhibitor
#EdgeSBO[459] = EdgeSBO[15] = EdgeSBO[11] = "Stimulation"	->	Activator
#EdgeSBO[461] =  "Necessary Stimulation"			->	Activator
#EdgeSBO[13] = "Catalysis"					->	Catalyst

SBODefinedEdgeType2LayoutEdgeTypeMapping = {	"Reactant":		"Substrate",
						"Production":		"Product",
						"Consumption":		"Substrate",
						"Modulation":		"Catalyst",
						"Inhibition":		"Inhibitor",
						"Stimulation":		"Activator",
						"Necessary Stimulation":"Activator",
						"Catalysis":		"Catalyst"	}


### SBO helper functions ###

def keyOf(dictionary, value):					# return the first key, having the given value inside the dictionary
	for key in dictionary.keys():
		if dictionary[key] == value:
			return key
	return None

def getSBO(term):						# return SBO of text SBO term
	if term in NodeSBO.values():
		result = keyOf(NodeSBO, term)			# Node SBO
	elif term in EdgeSBO.values():
		result = keyOf(EdgeSBO, term)			# Edge SBO
	elif term in ModificationSBO.values():
		result = keyOf(ModificationSBO, term)		# Modification SBO
	elif term == -1 or term == "-1":
		result = 285 # Unspecified
	else:
		result = 285 # Unspecified			# default SBO, if nothing matches
		print "Error: Unknown SBO term '"+str(term)+"' !"
	return str(result)

def getNodeType(text):
	if text in NodeTypes.keys():
		return NodeTypes[text]
	if text+" Node" in NodeTypes.keys():
		return NodeTypes[text+" Node"]
	return 0

def getLayoutNodeType(type):					# QUICKFIX -> Acer/Thomas
	if type == NodeTypes["Process Node"]:
		return "Reaction"
	else:
		return "Compound"

def getEdgeType(SBO):
	t = LayoutEdgeTypes[0]						# fallback value: "Substrate"
	if SBO in EdgeSBO.keys():					# define type by SBO
		t = EdgeSBO[SBO]
	if t in SBODefinedEdgeType2LayoutEdgeTypeMapping.keys():	# translate to a value the Layouter understands
		t = SBODefinedEdgeType2LayoutEdgeTypeMapping[t]
	return t

