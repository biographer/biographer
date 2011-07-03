# -*- coding: utf-8 -*-

import sys
sys.path.append("/var/www/web2py/applications/biographer/modules")

import biographer
import httplib

def importer():
	return dict()

def upload():
	session.RSI = request.vars.RSI
	connection = httplib.HTTPConnection("www.reactome.org")
	connection.request("GET", "/cgi-bin/eventbrowser_st_id?ST_ID="+str(session.RSI))
	page = connection.getresponse().read()
	if page.lower().find("internal error") > -1:
		session.flash = "Error: Invalid Reactome stable identifier"
	else:	
		p = page.find('/cgi-bin/sbml_export?')
		q = page.find('"', p)
		print ""
		print ""
		print page[p:q]
		if p > -1:
			connection.request("GET", page[p:q])
			session.SBML = connection.getresponse().read()

			reload(biographer)
			session.bioGraph = biographer.Graph( SBMLinput=session.SBML )
			del session.bioGraph.SBML

		else:
			session.flash = "Sorry: SBML for this pathway not found"
	connection.close()
	return redirect( URL(r=request, c='Workbench', f='index') )

