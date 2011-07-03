# -*- coding: utf-8 -*-

import sys
sys.path.append("/var/www/web2py/applications/biographer/modules")
import biographer
reload(biographer)

def importer():
	return dict()

def upload():
	session.SBML = request.vars.File.file.read()
	if session.bioGraph is None:
		session.bioGraph = biographer.Graph()
	session.bioGraph.importSBML( session.SBML )
	return redirect( URL(r=request,c='Workbench',f='index') )

