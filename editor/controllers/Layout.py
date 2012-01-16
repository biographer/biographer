# -*- coding: utf-8 -*-

def index():
	return redirect( URL(r=request, c="Layout", f="choose") )

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

		return redirect( returnto )

def internal():
	if session.bioGraph is None:
		session.flash = "No graph is loaded. Do you want to import a model from BioModels.net ?"
		return redirect( URL(r=request, c="Import", f="BioModels")+"?returnto="+URL(r=request, c="Layout", f="biographer") )

	layout( session.bioGraph, path_to_layout_binary=os.path.join(request.folder, "layout/build/layout"), execution_folder=os.path.join(request.folder, "cache") )

	return redirect( URL(r=request, c="Workbench", f="index") )

def graphviz():
	if session.bioGraph is None:
		session.flash = "No graph is loaded. Do you want to import a model from BioModels.net ?"
		return redirect( URL(r=request, c="Import", f="BioModels")+"?returnto="+URL(r=request, c="Layout", f="graphviz") )

	server_object = deepcopy( session.bioGraph )	# without these two lines, some caching problem occurs,
	del session.bioGraph				# and session.bioGraph does not get updated

	png = layout_using_graphviz( server_object, execution_folder=os.path.join(request.folder, "cache"), png_output_folder=os.path.join(request.folder, "static/graphviz") )

	session.bioGraph	= server_object
	session.graphviz_png	= '../static/graphviz/'+png
	session.graphviz_layout = session.bioGraph.graphviz_layout

	session.flash = "graphviz layout completed"

	return redirect( URL(r=request, c="Visualization", f="graphviz") )

def graphviz_layout():
	response.headers['Content-Type'] = 'text/vnd.graphviz'
	response.headers['Content-Disposition'] = 'attachment; filename=model.dot'
	return session.graphviz_layout

