# -*- coding: utf-8 -*-

biographer = local_import("biographer")

def importer():
	return dict()

def upload():
	example = "/var/www/web2py/applications/biographer/doc/demograph/demograph.odp"	# hardcoded example
	if session.bioGraph is None:
		session.bioGraph = biographer.Graph()
	session.bioGraph.importfile( example )
	return redirect( URL(r=request, c='Workbench', f='index') )

