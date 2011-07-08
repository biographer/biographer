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
	connection = httplib.HTTPConnection("pid.nci.nih.gov")			# retrieve page for specified Pathway ID
	connection.request("GET", "/search/pathway_landing.shtml?source=NCI-Nature%20curated&what=graphic&jpg=on&ppage=1&pathway_id="+request.vars.PIDPID)
	page = connection.getresponse().read()
	URL = ""
	p = page.find('<a class="button-style" href="')				# find BioPAX link
	while p > -1:
		q = page.find('</a>', p)
		partial = page[p:q]
		if partial.find("BioPAX") > -1:
			r = partial.find('href="')+6
			s = partial.find('"', r)
			URL = partial[r:s]
			break
		p = page.find('<a class="button-style" href="', q)
	if URL != "":
		connection.request("GET", URL)					# download BioPAX
		biopax = connection.getresponse().read()
		if session.bioGraph is None:
			session.bioGraph = biographer.Graph()
		session.bioGraph.importBioPAX( biopax )				# load bioGraph from BioPAX
		session.flash = "BioPAX loaded successfully"
	else:									# BioPAX link not found
		session.flash = "Error: BioPAX for this pathway could not be downloaded"
	connection.close()
	return redirect( URL(r=request, c='Workbench', f='index') )

