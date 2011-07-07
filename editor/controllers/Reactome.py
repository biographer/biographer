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

def upload():
	session.RSI = request.vars.RSI
	connection = httplib.HTTPConnection("www.reactome.org")					# retrieve page for Reactome ID
	 #"/cgi-bin/eventbrowser_st_id?ST_ID="+str(session.RSI))
	connection.request("GET", "/cgi-bin/eventbrowser?DB=gk_current&ID=168254&ZOOM=2&CLASSIC=1")
	page = connection.getresponse().read()
	if page.lower().find("internal error") > -1:						# page not found
		session.flash = "Error: Invalid Reactome stable identifier"			# -> invalid ID
	else:	
		p = page.find('/cgi-bin/sbml_export?')						# find SBML export link
		q = page.find('"', p)
		if p > -1:
			connection.request("GET", page[p:q])					# download SBML
			session.SBML		= connection.getresponse().read()
			if session.bioGraph is None:
				session.bioGraph = biographer.Graph()
			session.bioGraph.importSBML( session.SBML )
			session.flash		= "SBML retrieved successfully"
		else:										# link not found
			session.flash		= "Sorry: SBML for this pathway not found"
	connection.close()
	return redirect( URL(r=request, c='Workbench', f='index') )

