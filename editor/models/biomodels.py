#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

def download_BioModel( BioModelID ):

	import httplib

	connection = httplib.HTTPConnection("www.ebi.ac.uk")
	connection.request("GET", "/biomodels-main/download?mid=BIOMD"+BioModelsID)
	Model = connection.getresponse().read()
	connection.close()

	if session.SBML.find("There is no model associated") > -1:	# no such model
		return None
	else:               				                # SBML download successful
		return Model

