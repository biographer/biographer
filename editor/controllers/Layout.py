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

	session.bioGraph.doBioLayout( os.path.join(request.folder, "static/Layouter/build/layout") )
	return dict()

def graphviz():
	if session.bioGraph is None:
		session.flash = "Unable to layout: No graph is loaded. Import a model from BioModels.net ?"
		return redirect( URL(r=request, c="Import", f="BioModels")+"?returnto="+URL(r=request, c="Layout", f="graphviz") )

	server_object		= deepcopy( session.bioGraph )
	session.graphvizDOT, filename, cached, boundaries = server_object.exportGraphviz( folder=os.path.join(request.folder, "static/graphviz"), useCache=True, updateNodeProperties=True )
	del session.bioGraph
	session.bioGraph	= server_object
	session.graphvizURL	= URL(r=request, c="static/graphviz", f=filename)
	if cached:
		response.flash = "graphviz layout loaded from cache"
	else:
		response.flash = "graphviz layout completed"

	if request.vars.returnto is not None:
		return redirect(str(request.vars.returnto))
	return dict()

