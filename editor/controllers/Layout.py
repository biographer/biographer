# -*- coding: utf-8 -*-

import os, sys

hardcoded = request.folder + "/modules"
if not hardcoded in sys.path:
	sys.path.append(hardcoded)
import biographer

from copy import deepcopy

def biographer():
	if session.bioGraph is not None:
		session.bioGraph.doBioLayout( os.path.join( request.folder, "static/Layout/build/layout" ) )
		return dict()
	else:
		response.flash = "Please import a Graph first !"
		return dict( url="", dot="" )

def dographviz():							# also used by Visualization/graphviz
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
		session.flash = "Import a graph first !"
		return redirect( URL(r=request, c="BioModels", f="importer")+"?returnto="+URL(r=request, c="graphviz", f="Layout") )
	dographviz()
	return dict()

