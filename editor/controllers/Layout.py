# -*- coding: utf-8 -*-

request_folder = "/var/www/web2py/applications/biographer"

import os, sys

hardcoded = request_folder + "/modules"
if not hardcoded in sys.path:
	sys.path.append(hardcoded)
import biographer

from copy import deepcopy

def biographer():
	if session.bioGraph is None:
		session.flash = "Unable to layout: No graph is loaded. Import a model from BioModels.net ?"
		return redirect( URL(r=request, c="Import", f="BioModels")+"?returnto="+URL(r=request, c="Layout", f="biographer") )

	session.bioGraph.doBioLayout( os.path.join( request.folder, "static/Layout/build/layout" ) )
	return dict()

def dographviz():								# also used by Visualization/graphviz
	server_object		= deepcopy( session.bioGraph )
	del session.bioGraph
	session.graphvizDOT, filename, cached, boundaries = server_object.exportGraphviz( folder=os.path.join(request.folder, "static/graphviz"), useCache=True, updateNodeProperties=True )
	session.bioGraph	= server_object
	session.graphvizURL	= URL(r=request, c="static/graphviz", f=filename)
	if cached:
		response.flash = "graphviz layout loaded from cache"
	else:
		response.flash = "graphviz layout completed"
	return dict()

def graphviz():
	if session.bioGraph is None:
		session.flash = "Unable to layout: No graph is loaded. Import a model from BioModels.net ?"
		return redirect( URL(r=request, c="Import", f="BioModels")+"?returnto="+URL(r=request, c="Layout", f="graphviz") )
	dographviz()
	return dict()

