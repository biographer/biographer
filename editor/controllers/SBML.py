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
	session.JSON = ""
	session.BioPAX = ""
	if request.vars.File != "":
		session.SBML = request.vars.File.file.read()
		session.flash = "SBML uploaded."
	else:
		session.SBML = open( os.path.join(request.folder, "static/examples/reactome.sbml") ).read()
		session.flash = "Example SBML loaded."

	if session.bioGraph is None:
		session.bioGraph = biographer.Graph()
	session.bioGraph.importSBML( session.SBML )

	return redirect( URL(r=request,c='Workbench',f='index') )

