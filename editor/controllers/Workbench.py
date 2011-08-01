# -*- coding: utf-8 -*-

from copy import deepcopy

def index():
#	if session.bioGraph is None:
#		session.flash = "No graph is defined. Please load one !"
#		return redirect( URL(r=request, c="BioModels", f="importer")+"?returnto="+URL(r=request, c="Workbench", f="index") )
#	session.bioGraph.exportJSON()
#	session.bioGraph.exportBioLayout()
	return dict()

def BioLayout():
	if session.bioGraph is not None:
		session.bioGraph.exportBioLayout()
	return dict()

def JSON():
	if session.bioGraph is not None:
		session.bioGraph.exportJSON()
	return dict()

def Dijkstra():
	if session.bioGraph is None:
		session.flash = "Error: No graph to cut !"
		return redirect( URL(r=request, c="Workbench", f="index") )
	if request.vars.ID is None:
		session.flash = "Error: Dijkstra without ID !"
		return redirect( URL(r=request, c="Workbench", f="index") )
	if request.vars.distance is not None:
		bioGraph = deepcopy( session.bioGraph )
		bioGraph.Dijkstra( session.bioGraph.getNodeByID(request.vars.ID), request.vars.distance )
		session.bioGraph = bioGraph
		session.flash = "Network cut into pieces !"
		return redirect( URL(r=request, c="Workbench", f="index") )
	return dict( ID=request.vars.ID )

def Editor():
	return dict()
