# -*- coding: utf-8 -*-

import sys
sys.path.append("/var/www/web2py/applications/biographer/modules")
import biographer

def importer():
	return dict()

def upload():
	reload(biographer)
	session.SBML = request.vars.File.file.read()
	session.bioGraph = biographer.Graph().importSBML( session.SBML )
	return redirect( URL(r=request,c='Workbench',f='index') )

