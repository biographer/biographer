# -*- coding: utf-8 -*-

# TEMPORARY BUG WORKAROUND
import sys
hardcoded = "/var/www/web2py/applications/biographer/modules"
if not hardcoded in sys.path:
	sys.path.append(hardcoded)
import biographer
reload(biographer)
# END WORKAROUND

import httplib

def importer():
	return dict()

def download():
	session.JSON = ""
	session.BioPAX = ""
	connection = httplib.HTTPConnection("www.ebi.ac.uk")
	connection.request("GET", "/biomodels-main/download?mid=BIOMD"+request.vars.BioModelsID.rjust(10, "0"))
	session.SBML = connection.getresponse().read()
	connection.close()
	if session.bioGraph is None:
		session.bioGraph = biographer.Graph()
	session.bioGraph.importSBML( session.SBML )
	return redirect( URL(r=request, c='Workbench', f='index') )
