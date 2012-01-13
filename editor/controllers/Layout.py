# -*- coding: utf-8 -*-

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
		session.flash = "No graph is loaded. Do you want to import a model from BioModels.net ?"
		return redirect( URL(r=request, c="Import", f="BioModels")+"?returnto="+URL(r=request, c="Layout", f="biographer") )

	executable = os.path.join(request.folder, "layout/build/layout")

	if os.path.exists(executable):
		session.bioGraph.execute_layout( executable )
	else:
		session.flash = "Layouter not installed."
		return redirect( URL(r=request, c="Workbench", f="index") )

	if request.vars.returnto is not None:
		return redirect(str(request.vars.returnto))
	return dict()

def graphviz():
	if session.bioGraph is None:
		session.flash = "No graph is loaded. Do you want to import a model from BioModels.net ?"
		return redirect( URL(r=request, c="Import", f="BioModels")+"?returnto="+URL(r=request, c="Layout", f="graphviz") )

	server_object		= deepcopy( session.bioGraph )	# without these two lines, some caching problem occurs,
	del session.bioGraph					# and session.bioGraph does not get updated

	session.graphvizDOT, filename, cached, boundaries = server_object.execute_graphviz( execution_folder=os.path.join(request.folder, "cache"), use_cache=True, update_nodes=True )
	session.bioGraph	= server_object
#	session.graphvizURL	= URL(r=request, c="static/graphviz", f=filename)

	# no, this won't work anymore
	# layouts are stored to database

	if cached:
		response.flash = "graphviz layout loaded from cache"
	else:
		response.flash = "graphviz layout completed"

	if request.vars.returnto is not None:
		return redirect(str(request.vars.returnto))
	return dict()

