#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

#### defaults & constants ####

DefaultIndent = 9	# for JSON output string formatting, 9 spaces per indent

MandatoryNodeKeys	= ['id','type','sbo','is_abstract']
NodeKeys		= MandatoryNodeKeys + ['data']
OptionalNodeKeys	= ['clone_marker', 'x', 'y', 'width', 'height', 'radius', 'label', 'compartment', 'subcomponents', 'modifications']
NodeKeyAliases		= { 'modification':'modifications', 'subnodes':'subcomponents' }
DefaultNode		= { "type":"simple_species", "sbo":"252", "is_abstract":False, "data":{ "clone_marker":-1, "x":10, "y":10, "width":50, "height":20, "radius":30, "label":"Orphan Node", "compartment":0, "subcomponents":[], "modifications":[] } }

MandatoryEdgeKeys	= ['id','sbo','source','target']
EdgeKeys		= MandatoryEdgeKeys + ['data']
OptionalEdgeKeys	= ['type', 'style', 'thickness', 'label', 'label_x', 'label_y', 'handles']
EdgeKeyAliases		= {}
DefaultEdge		= { "sbo":13, "source":0, "target":0, "data":{ "type":"straight", "style":"solid", "thickness":1, "label":"Orphan Edge", "label_x":10, "label_y":10, "handles":[] } }

# end defaults

#### SBO Terms ####

TYPE = { "Entitiy Pool Node":0, "Auxiliary Unit":1, "Compartment Node":2, "Container Node":3, "Process Node":4, "Reference Node":5 }

def getType(text):
	return TYPE[text]			# für's erste

def getLayoutNodeType(type):			# -> Acer/Thomas
	if type == TYPE["process node"]:
		return "Reaction"
	else:
		return "Compound"

NodeSBO = EdgeSBO = ModificationSBO = {}

NodeSBO[285] = NodeSBO[167] = "Unspecified Entity"
NodeSBO[247] = NodeSBO[240] = "Simple Chemical"

NodeSBO[245] = NodeSBO[252] = "Macromolecule"
NodeSBO[250] = NodeSBO[251] = "Nucleic Acid Feature"
NodeSBO[253] = "Complex"
NodeSBO[290] = "Compartment"
NodeSBO[375] = "Process"

EdgeSBO[10] = EdgeSBO[336] = "Reactant"
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

def getSBO(key):
	if key in NodeSBO.values():
		result = str(NodeSBO[NodeSBO.values().index(text)])
	elif key in EdgeSBO.values():
		result = str(EdgeSBO[EdgeSBO.values().index(text)])
	elif key in ModificationSBO.values():
		result = str(ModificationSBO[ModificationSBO.values().index(text)])
	return rjust(result, 7, "0")

##############################
