#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

def download_Reactome_model( ReactomeStableIdentifier ):

	import httplib

	connection = httplib.HTTPConnection("www.reactome.org")
	connection.request("GET", URL, None, {"Cookie":"ClassicView=1"} )
	page = connection.getresponse().read()

	p = page.find('/cgi-bin/sbml_export?')
	q = page.find('"', p)
	if p > -1:
		connection.request("GET", page[p:q])					# download SBML
		return connection.getresponse().read()
		connection.close()
	else:										# SBML export link not found
		connection.close()
		return None

	return Model

