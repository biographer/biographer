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
	session.PreviousBioModels = db( db.BioModels.Title != None ).select()
	return dict()

def download():
	session.JSON = None
	session.BioPAX = None
	if session.bioGraph is None:
		session.bioGraph = biographer.Graph()

	session.BioModelsID = request.vars.BioModelsID.rjust(10, "0")
	cachename = os.path.join( request.folder, "static/BioModels.net", session.BioModelsID+".sbml" )

	if os.path.exists( cachename ):
		session.SBML = open(cachename).read()
		session.bioGraph.importSBML( session.SBML )
		session.flash = "BioModel's SBML loaded from cache"
	else:
		connection = httplib.HTTPConnection("www.ebi.ac.uk")
		connection.request("GET", "/biomodels-main/download?mid=BIOMD"+session.BioModelsID)
		session.SBML = connection.getresponse().read()
		connection.close()
		if session.SBML.find("There is no model associated") > -1:
			session.SBML = None
			session.flash = "Sorry: No model with ID "+session.BioModelsID
		else:
			open(cachename,'w').write( session.SBML )
			session.bioGraph.importSBML( session.SBML )
			session.flash = "BioModel's SBML retrieved successfully"

	return redirect( URL(r=request, c='Workbench', f='index') )
