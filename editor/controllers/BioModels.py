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
import httplib

def importer():
	return dict()

def download():
	session.JSON = ""
	session.BioPAX = ""
	if session.bioGraph is None:
		session.bioGraph = biographer.Graph()

	session.BioModelsID = request.vars.BioModelsID.rjust(10, "0")
	cachename = os.path.join( request.folder, "static/BioModels.net", session.BioModelsID+".sbml" )

	if os.path.exists( cachename ):
		session.SBML = open(cachename).read()
		session.flash = "SBML loaded from cache"
		session.bioGraph.importSBML( session.SBML )
	else:
		connection = httplib.HTTPConnection("www.ebi.ac.uk")
		connection.request("GET", "/biomodels-main/download?mid=BIOMD"+session.BioModelsID)
		session.SBML = connection.getresponse().read()
		connection.close()
		if session.SBML.lower()[:6] == "<?xml ":
			open(cachename,'w').write( session.SBML )
			session.bioGraph.importSBML( session.SBML )
		else:
			session.flash = "Error: Retrieved file is not SBML"

	return redirect( URL(r=request, c='Workbench', f='index') )
