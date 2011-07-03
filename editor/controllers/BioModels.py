# -*- coding: utf-8 -*-

import sys
sys.path.append("/var/www/web2py/applications/biographer/modules")
import biographer
reload(biographer)

import httplib


def importer():
	return dict()

def download():
	connection = httplib.HTTPConnection("www.ebi.ac.uk")
	connection.request("GET", "/biomodels-main/download?mid=BIOMD"+request.vars.BioModelsID.rjust(10, "0"))
	session.SBML = connection.getresponse().read()
	connection.close()
	if session.bioGraph is None:
		session.bioGraph = biographer.Graph()
	session.bioGraph.importSBML( session.SBML )
	return redirect( URL(r=request, c='Workbench', f='index') )
