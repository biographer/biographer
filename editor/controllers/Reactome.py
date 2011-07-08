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

def upload():
	session.JSON = ""
	session.BioPAX = ""
	if session.bioGraph is None:
		session.bioGraph = biographer.Graph()

	session.RSI = request.vars.RSI
	cachename = os.path.join( request.folder, "static/Reactome", session.RSI+".sbml" )

	if os.path.exists( cachename ):
		session.SBML = open(cachename).read()
		session.flash = "SBML loaded from cache"
		session.bioGraph.importSBML( session.SBML )
	else:
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
				session.flash		= "SBML retrieved successfully"
				open(cachename,'w').write( session.SBML )
				session.bioGraph.importSBML( session.SBML )
			else:										# link not found
				session.flash		= "Sorry: SBML for this pathway not found"
		connection.close()
	
	return redirect( URL(r=request, c='Workbench', f='index') )

