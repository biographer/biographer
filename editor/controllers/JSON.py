# -*- coding: utf-8 -*-

# TEMPORARY BUG WORKAROUND
import sys
hardcoded = "/var/www/web2py/applications/biographer/modules"
if not hardcoded in sys.path:
	sys.path.append(hardcoded)
import biographer
reload(biographer)
# END WORKAROUND

import os

def importer():
	return dict()

def load():
	session.SBML = ""
	session.BioPAX = ""
	if request.vars.File != "":
		session.JSON = request.vars.File.file.read()
		session.flash = request.vars.File.filename+" retrieved and parsed."
	else:
		session.JSON = open( os.path.join(request.folder, "static/examples/example.json") ).read()
		session.flash = "Example JSON loaded."

	if session.bioGraph is None:
		session.bioGraph = biographer.Graph()
	session.bioGraph.importJSON( session.JSON )

	return redirect( URL(r=request, c="Workbench", f="index") )

def details():
	return dict()

