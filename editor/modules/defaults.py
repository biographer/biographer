#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

info = 1
error = 2
warning = 3
debug = 4

DefaultIndent = 9	# for JSON output string formatting, 9 spaces per indent

TopCompartmentID = 0

MandatoryNodeKeys	= ['id','type','sbo','is_abstract']
NodeKeys		= MandatoryNodeKeys + ['data']
OptionalNodeKeys	= ['clone_marker', 'x', 'y', 'width', 'height', 'radius', 'label', 'compartment', 'subnodes', 'modifications']
NodeKeyAliases		= { 'modification':'modifications', 'subcomponents':'subnodes' }
DefaultNode		= { "type":"simple_species", "sbo":"252", "is_abstract":False, "data":{ "clone_marker":-1, "x":10, "y":10, "width":50, "height":20, "radius":30, "label":"", "compartment":TopCompartmentID, "subnodes":[], "modifications":[] } }

MandatoryEdgeKeys	= ['id','sbo','type','source','target']
EdgeKeys		= MandatoryEdgeKeys + ['data']
OptionalEdgeKeys	= ['type', 'style', 'thickness', 'label', 'label_x', 'label_y', 'handles']
EdgeKeyAliases		= {}
DefaultEdge		= { "sbo":13, "type":"Substrate", "source":0, "target":0, "data":{ "type":"straight", "style":"solid", "thickness":1, "label":"", "label_x":10, "label_y":10, "handles":[] } }

