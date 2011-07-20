# -*- coding: utf-8 -*-

def index():
	if session.bioGraph is not None:
		session.bioGraph.exportJSON()
	return dict()

def BioLayout():
	return dict()

def JSON():
	return dict()

def Dijkstra():
	if request.vars.ID is None:
		return redirect( URL(r=request, c="Workbench", f="index") )
	if request.vars.radius is not None:
		session.bioGraph.Dijkstra( session.bioGraph.getNodeByID(request.vars.ID), request.vars.radius )
	return dict( ID=request.vars.ID )
