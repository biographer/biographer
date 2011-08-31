# -*- coding: utf-8 -*-

import os, sys, httplib

hardcoded = request.folder + "/modules"
if not hardcoded in sys.path:
	sys.path.append(hardcoded)
import biographer


def reset_current_session():
	global session
	session.JSON = None							# drop imported stuff
	session.SBML = None
	session.BioPAX = None
	if session.bioGraph is not None:					# delete old Graph
		del session.bioGraph
	session.bioGraph = biographer.Graph()					# initialize new Graph


#################### JSON ####################

def importJSON( JSONstring ):
	global session
	reset_current_session()
	session.bioGraph.importJSON( JSONstring )

def JSON():									# function: import JSON
	if request.env.request_method == "GET":
		return dict()

	if request.env.request_method == "POST":
		if request.vars.File != "":					# a file was uploaded
			session.JSON = request.vars.File.file.read()
			session.flash = request.vars.File.filename+" retrieved and parsed."
		else:								# the example JSON was requested
			session.JSON = open( os.path.join(request.folder, "static/examples/example.json") ).read()
			session.flash = "Example JSON loaded."

		importJSON( session.JSON )					# import JSON

		return redirect( URL(r=request, c="Workbench", f="index") )

def JSONdebug():								# function: show JSON details
	return dict()


#################### SBML ####################

def importSBML( SBMLstring ):
	global session
	reset_current_session()
	session.bioGraph.importSBML( SBMLstring )

def SBML():									# function: import SBML
	if request.env.request_method == "GET":
		return dict()

	if request.env.request_method == "POST":
		session.JSON = ""
		session.BioPAX = ""
		if request.vars.File != "":					# a file was uploaded
			session.SBML = request.vars.File.file.read()
			session.flash = "SBML uploaded."
		else:								# the example was requested
			session.SBML = open( os.path.join(request.folder, "static/examples/reactome.sbml") ).read()
			session.flash = "Example SBML loaded."

		importSBML( session.SBML )					# import SBML

		Layouter = request.vars.Layouter				# goto selected Layouter page
		if Layouter == "Ask":
			return redirect( URL(r=request,c='Layout',f='choose')+"?returnto="+URL(r=request,c='Workbench',f='index') )
		if Layouter == "biographer":
			return redirect( URL(r=request,c='Layout',f='biographer')+"?returnto="+URL(r=request,c='Workbench',f='index') )
		if Layouter == "graphviz":
			return redirect( URL(r=request,c='Layout',f='graphviz')+"?returnto="+URL(r=request,c='Workbench',f='index') )
		return redirect( URL(r=request, c='Workbench',f='index') )


#################### BioModels ####################

def importBioModel( BioModelID ):
	global session, request, db

	reset_current_session()								# reset session

	session.BioModelsID = BioModelID.rjust(10, "0")					# adjust BioModel's ID
	print "BioModel requested: ID "+session.BioModelsID

	cachefolder = os.path.join( request.folder, "static/BioModels.net" )
	if not os.path.exists( cachefolder ):
		os.mkdir( cachefolder )
	cachename = os.path.join( cachefolder, session.BioModelsID+".sbml" )		# what's the cache filename ?
	print "BioModel cache filename: "+cachename

	def UpdateDatabase(SBML, ID):							# in case we find a model, store meta info in the database
		global db
		key = 'name="'
		p = SBML.find(key)
		if p > -1:
			p += len(key)
			q = SBML.find('"',p)
			title = SBML[p:q].replace("_"," ")
			if len( db( db.BioModels.BIOMD == ID ).select() ) == 0:
				db.BioModels.insert( BIOMD=ID, Title=title )

	if os.path.exists( cachename ):							# BioModel in cache ?
		session.SBML = open(cachename).read()
		session.bioGraph.importSBML( session.SBML )				# import
		UpdateDatabase( session.SBML, session.BioModelsID )			# DB update
		session.flash = "BioModel loaded from cache"
		print "BioModel "+session.BioModelsID+" loaded from cache"
	else:										# No, download it from EBI
		connection = httplib.HTTPConnection("www.ebi.ac.uk")
		connection.request("GET", "/biomodels-main/download?mid=BIOMD"+session.BioModelsID)
		session.SBML = connection.getresponse().read()
		connection.close()
		if session.SBML.find("There is no model associated") > -1:		# error: no such model
			session.SBML = None						# drop downloaded content
			session.flash = "Error: No such BioModel"
			print "No such BioModel: "+session.BioModelsID
		else:									# SBML downloaded successfully
			open(cachename,'w').write( session.SBML )
			session.bioGraph.importSBML( session.SBML )			# import
			UpdateDatabase( session.SBML, session.BioModelsID )		# DB update
			session.flash = "BioModel imported successfully"
			print "BioModel "+session.BioModelsID+" downloaded and imported"

def BioModels():		# import from BioModels.net

	if (request.env.request_method == "POST") or (request.vars.BioModelsID is not None):	# allows direct calls in the way /biographer/Import/BioModel?BioModelsID=8

		importBioModel( request.vars.BioModelsID )			# import

		if type(request.vars.returnto) == type([]):			# evaluate returnto parameters
			returnto = str(request.vars.returnto[0])
		else:
			returnto = str(request.vars.returnto)
		if (returnto is not None) and (returnto != ""):			# explicit redirection
			return redirect( returnto )

		Layouter = request.vars.Layouter				# implicit redirection: a Layouter was chosen
		if Layouter == "Ask":
			return redirect( URL(r=request,c='Layout',f='choose')+"?returnto="+URL(r=request,c='Workbench',f='index') )
		if Layouter == "biographer":
			return redirect( URL(r=request,c='Layout',f='biographer')+"?returnto="+URL(r=request,c='Workbench',f='index') )
		if Layouter == "graphviz":
			return redirect( URL(r=request,c='Layout',f='graphviz')+"?returnto="+URL(r=request,c='Workbench',f='index') )

		return redirect( URL(r=request, c='Workbench', f='index') )	# else: goto Workbench

	if request.env.request_method == "GET":
		session.PreviousBioModels = db( db.BioModels.Title != None ).select()
		return dict( returnto=request.vars.returnto )


#################### Reactome ####################

def importReactome( ReactomeStableIdentifier ):
	global session, request, db

	reset_current_session()

	def UpdateDatabase(SBML, ID):						# function: in case we find a SBML, update database
		global db
		key = 'name="'
		p = SBML.find(key)
		if p > -1: 							# is there a title in this SBML?
			p += len(key)
			q = SBML.find('"',p)
			title = SBML[p:q].replace("_"," ")			# what is the title?
			if len( db( db.Reactome.ST_ID == ID ).select() ) == 0:	# do we know it already?
				db.Reactome.insert( ST_ID=ID, Title=title )	# No, save it

	session.ST_ID = ReactomeStableIdentifier
	print "Request for RSI:"+session.ST_ID							# RSI

	cachename = os.path.join( request.folder, "static/Reactome/"+session.ST_ID+".sbml" )	# cachename
	print "Reactome cache filename: "+cachename

	if os.path.exists( cachename ):						# exists in cache
		session.SBML = open(cachename).read()
		session.bioGraph.importSBML( session.SBML )
		UpdateDatabase( session.SBML, session.ST_ID )
		session.flash = "Reactome Pathway loaded from cache"
		print "Reactome pathway "+session.ST_ID+" loaded from cache"
	else:									# does not exist in cache, request it from reactome.org
		connection = httplib.HTTPConnection("www.reactome.org")
		connection.request("GET", "/cgi-bin/eventbrowser_st_id?ST_ID="+str(session.ST_ID) )
		page = connection.getresponse().read()

		if page.lower().find("internal error") > -1:						# page not found
			session.flash = "Error: Invalid Reactome Stable Identifier"
			print "www.reactome.org has no model for RSI:"+session.ST_ID
		else:											# page found
			print "www.reactome.org confirmed a valid model for RSI:"+session.ST_ID
			p = page.find('/cgi-bin/sbml_export?')						# find SBML export link!
			q = page.find('"', p)
			if p > -1:
				connection.request("GET", page[p:q])					# download SBML
				session.SBML = connection.getresponse().read()
				open(cachename,'w').write( session.SBML )
				session.bioGraph.importSBML( session.SBML )
				UpdateDatabase( session.SBML, session.ST_ID )
				session.flash = "Reactome Pathway downloaded successfully"
				print "Reactome pathway "+session.ST_ID+" downloaded successfully"
			else:										# SBML export link not found
				session.flash = "Sorry: Reactome Pathway seems not to offer SBML export"
				print "Could not find SBML export link for Reactome pathway "+session.ST_ID
				debugname = cachename.replace(".sbml",".html")
				open(debugname, "w").write(page)
				print "Reactome response saved for debugging: "+debugname

		connection.close()

def Reactome():									# function: import Reactome
	if request.env.request_method == "GET":
		return dict()

	if request.env.request_method == "POST":

		importReactome( request.vars.ST_ID )				# import Reactome

		return redirect( URL(r=request, c='Workbench', f='index') )


#################### unstable stuff ####################

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

