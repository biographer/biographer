# -*- coding: utf-8 -*-

biographer = local_import("biographer")
import httplib

def importer():
	return dict()

def download():
	session.BioModelsID = request.vars.BioModelsID.rjust(10, "0")		# string of length 10, padded right justified with zeroes
	connection = httplib.HTTPConnection("www.ebi.ac.uk")
	connection.request("GET", "/biomodels-main/download?mid=BIOMD"+str(session.BioModelsID))
	session.SBML = connection.getresponse().read()
	connection.close()
	session.bioGraph = biographer.Graph( SBMLinput=session.SBML )
	return redirect("/biographer/Workbench")
