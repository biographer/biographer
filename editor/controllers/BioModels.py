# -*- coding: utf-8 -*-

# TEMPORARY BUG WORKAROUND
import sys
hardcoded = "/var/www/web2py/applications/biographer/modules"
if not hardcoded in sys.path:
	sys.path.append(hardcoded)
import biographer
# END WORKAROUND

import os
import httplib

def importer():
	session.PreviousBioModels = db( db.BioModels.Title != None ).select()
	return dict( returnto=request.vars.returnto )

def update_database():
	key = 'name="'
	p = session.SBML.find(key)
	if p > -1:
		p += len(key)
		q = session.SBML.find('"',p)
		name = session.SBML[p:q].replace("_"," ")
		if len( db( db.BioModels.BIOMD == session.BioModelsID ).select() ) == 0:
			db.BioModels.insert( BIOMD=session.BioModelsID, Title=name )

def download():
	session.JSON = None
	session.BioPAX = None
	if session.bioGraph is None:
		session.bioGraph = biographer.Graph()

	session.BioModelsID = request.vars.BioModelsID.rjust(10, "0")
	cachefolder = os.path.join( request.folder, "static/BioModels.net" )
	if not os.path.exists( cachefolder ):
		os.mkdir( cachefolder )
	cachename = os.path.join( cachefolder, session.BioModelsID+".sbml" )

	if os.path.exists( cachename ):
		session.SBML = open(cachename).read()
		session.bioGraph.importSBML( session.SBML )
		update_database()
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
			update_database()
			session.flash = "BioModel's SBML retrieved successfully"

	if request.vars.returnto is not None:
		return redirect( request.vars.returnto )

	return redirect( URL(r=request, c='Workbench', f='index') )

