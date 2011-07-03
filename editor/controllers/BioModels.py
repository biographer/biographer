# -*- coding: utf-8 -*-

import sys
sys.path.append("/var/www/web2py/applications/biographer/modules")

import biographer
import httplib

def importer():
	return dict()

def download():
	reload(biographer)
	session.BioModelsID = request.vars.BioModelsID.rjust(10, "0")		# string of length 10, padded right justified with zeroes
	connection = httplib.HTTPConnection("www.ebi.ac.uk")
	connection.request("GET", "/biomodels-main/download?mid=BIOMD"+str(session.BioModelsID))
	session.SBML = connection.getresponse().read()
	connection.close()
	session.bioGraph = biographer.Graph( SBMLinput=session.SBML )
	del session.bioGraph.SBML
	return redirect( URL(r=request, c='Workbench', f='index') )
