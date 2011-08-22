# -*- coding: utf-8 -*-

request_folder = "/var/www/web2py/applications/biographer"

import os, sys

hardcoded = request_folder + "/modules"
if not hardcoded in sys.path:
	sys.path.append(hardcoded)
import biographer

from copy import deepcopy

def choose():
	if request.env.request_method == "GET":
		return dict( returnto=str(request.vars.returnto) )

	elif request.env.request_method == "POST":
		if type(request.vars.returnto) == type([]):			# some strange error, I don't fully understand,
			returnto = str(request.vars.returnto[0])		# where two returnto parameters are provided as a list
		else:								# same, as in Import.py
			returnto = str(request.vars.returnto)
		if returnto == "":
			returnto = URL(r=request,c='Workbench',f='index')

		Layouter = request.vars.Layouter
		if Layouter == "biographer":
			return redirect( URL(r=request,c='Layout',f='biographer')+"?returnto="+returnto )
		if Layouter == "graphviz":
			return redirect( URL(r=request,c='Layout',f='graphviz')+"?returnto="+returnto )
		return redirect( returnto )

def biographer():
	if session.bioGraph is None:
		session.flash = "Unable to layout: No graph is loaded. Import a model from BioModels.net ?"
		return redirect( URL(r=request, c="Import", f="BioModels")+"?returnto="+URL(r=request, c="Layout", f="biographer") )

	executable = os.path.join(request.folder, "static/Layouter/build/layout")

	if os.path.exists(executable):
		session.bioGraph.Layout( executable )
	else:
		session.flash = "Layouter not installed."
		return redirect( URL(r=request, c="Workbench", f="index") )

	if request.vars.returnto is not None:
		return redirect(str(request.vars.returnto))
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

