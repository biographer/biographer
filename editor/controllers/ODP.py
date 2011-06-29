# -*- coding: utf-8 -*-

biographer = local_import("biographer")

def importer():
	return dict()

def upload():
	example = "/var/www/web2py/applications/biographer/doc/demograph/demograph.odp"	# hardcoded example
	session.bioGraph = biographer.Graph( ODPfile=example )
	return redirect("/biographer/Workbench")

