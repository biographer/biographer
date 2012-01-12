#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

def download_Reactome_model( ReactomeStableIdentifier ):
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
		print "SBML found in cache."
		session.SBML = open(cachename).read()
		session.bioGraph.importSBML( session.SBML )
		UpdateDatabase( session.SBML, session.ST_ID )
		session.flash = "Reactome Pathway loaded from cache"
		print "Reactome pathway "+session.ST_ID+" loaded from cache"
	else:									# does not exist in cache, request it from reactome.org
		print "No such file."
		URL = "/cgi-bin/eventbrowser_st_id?ST_ID="+str(session.ST_ID)
		print "Trying to download from http://www.reactome.org"+URL+" :"
		print "Connecting ..."
		connection = httplib.HTTPConnection("www.reactome.org")
		print "Connected."
		print "GET ..."
		connection.request("GET", URL, None, {"Cookie":"ClassicView=1"} )
		print "Awaiting response ..."
		page = connection.getresponse().read()
		print "Response received."

		p = page.find('/cgi-bin/sbml_export?')						# search SBML export link
		q = page.find('"', p)
		if p > -1:
			print "Link to SBML found. Downloading ..."
			connection.request("GET", page[p:q])					# download SBML
			session.SBML = connection.getresponse().read()
			open(cachename,'w').write( session.SBML )
			print "Downloaded. Importing ..."
			session.bioGraph.importSBML( session.SBML )
			print "Imported. Updating database ..."
			UpdateDatabase( session.SBML, session.ST_ID )
			session.flash = "Reactome Pathway downloaded successfully"
		else:										# SBML export link not found
			print "Link to SBML not found. Aborting."
			session.flash = "Internal Error. Check web2py console output."
			debugname = cachename.replace(".sbml",".html")
			open(debugname, "w").write(page)
			print "Reactome response saved for debugging: "+debugname

		connection.close()
		print "Done."

