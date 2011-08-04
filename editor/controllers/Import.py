# -*- coding: utf-8 -*-

import os, sys, httplib

hardcoded = request.folder + "/modules"
if not hardcoded in sys.path:
	sys.path.append(hardcoded)
import biographer

def JSON():									# import JSON
	if request.env.request_method == "GET":
		return dict()

	if request.env.request_method == "POST":
		session.SBML = ""
		session.BioPAX = ""
		if request.vars.File != "":
			session.JSON = request.vars.File.file.read()
			session.flash = request.vars.File.filename+" retrieved and parsed."
		else:
			session.JSON = open( os.path.join(request.folder, "static/examples/example.json") ).read()
			session.flash = "Example JSON loaded."

		if session.bioGraph is None:
			session.bioGraph = biographer.Graph()
		session.bioGraph.importJSON( session.JSON )

		return redirect( URL(r=request, c="Workbench", f="index") )

def JSONdebug():								# show JSON details
	return dict()

def SBML():									# import SBML
	if request.env.request_method == "GET":
		return dict()

	if request.env.request_method == "POST":
		session.JSON = ""
		session.BioPAX = ""
		if request.vars.File != "":
			session.SBML = request.vars.File.file.read()
			session.flash = "SBML uploaded."
		else:
			session.SBML = open( os.path.join(request.folder, "static/examples/reactome.sbml") ).read()
			session.flash = "Example SBML loaded."

		if session.bioGraph is None:
			session.bioGraph = biographer.Graph()
		session.bioGraph.importSBML( session.SBML )

		return redirect( URL(r=request,c='Workbench',f='index') )

def BioModels():								# import from BioModels.net
	if request.env.request_method == "GET":
		session.PreviousBioModels = db( db.BioModels.Title != None ).select()
		return dict( returnto=request.vars.returnto )

	def BioModel_to_Database():
		key = 'name="'
		p = session.SBML.find(key)
		if p > -1:
			p += len(key)
			q = session.SBML.find('"',p)
			name = session.SBML[p:q].replace("_"," ")
			if len( db( db.BioModels.BIOMD == session.BioModelsID ).select() ) == 0:
				db.BioModels.insert( BIOMD=session.BioModelsID, Title=name )

	if request.env.request_method == "POST":
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
			BioModel_to_Database()
			session.flash = "BioModel.net SBML loaded from cache"
		else:
			connection = httplib.HTTPConnection("www.ebi.ac.uk")
			connection.request("GET", "/biomodels-main/download?mid=BIOMD"+session.BioModelsID)
			session.SBML = connection.getresponse().read()
			connection.close()
			if session.SBML.find("There is no model associated") > -1:
				session.SBML = None
				session.flash = "Sorry: No BioModel with ID "+session.BioModelsID
			else:
				open(cachename,'w').write( session.SBML )
				session.bioGraph.importSBML( session.SBML )
				BioModel_to_Database()
				session.flash = "BioModel.net SBML retrieved successfully"

		if request.vars.returnto is not None:
			return redirect( request.vars.returnto )

		return redirect( URL(r=request, c='Workbench', f='index') )

def Reactome():									# import from Reactome
	if request.env.request_method == "GET":
		return dict()

	if request.env.request_method == "POST":
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

def BioPAX():									# import a file in BioPAX format
	if request.env.request_method == "GET":
		return dict()

	if request.env.request_method == "POST":
		session.JSON = ""
		session.SBML = ""
		# ... magic, that doesn't work right now
		return dict()

def PID():									# import from Pathway Interaction Database
	if request.env.request_method == "GET":
		return dict()

	if request.env.request_method == "POST":
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

def ODP():									# import graph from OpenOffice
	if request.env.request_method == "GET":
		return dict()

	if request.env.request_method == "POST":
		example = "/var/www/web2py/applications/biographer/doc/demograph/demograph.odp"	# hardcoded example
		if session.bioGraph is None:
			session.bioGraph = biographer.Graph()
		session.bioGraph.importfile( example )
		return redirect( URL(r=request, c='Workbench', f='index') )

