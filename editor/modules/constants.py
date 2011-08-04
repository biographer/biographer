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
DefaultEdge		= { "sbo":10, "source":0, "target":0, "data":{ "type":"straight", "style":"solid", "thickness":1, "label":"Orphan Edge", "label_x":10, "label_y":10, "handles":[] } }

# Node types
TYPE = { "entitiy pool node":0, "auxiliary unit":1, "compartment node":2, "container node":3, "process node":4, "reference node":5 }

def LayoutNodeType(type):
	if type == TYPE["process node"]:
		return "Reaction"
	else:
		return "Compound"

# Node SBOs
SBO = { "unspecified":0, "compartment":1, "simple chemical":247, "macromolecule":245, "nucleic acid feature":250, "complex":253, "source sink":291, "perturbing agent":405 }

# Edge SBOs
SBO.update({ "consumption":10, "production":11, "modulation":19, "stimulation":459, "catalysis":13, "inhibition":20, "enzymatic catalyst":460, "necessary stimulation":461 })

##############################
