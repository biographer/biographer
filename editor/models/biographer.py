
def reset_current_session():
    global session
    import biographer
    session.JSON = None                         # drop imported stuff
    session.SBML = None
    session.BioPAX = None
    if session.bioGraph is not None:                    # delete old Graph
        del session.bioGraph
    session.bioGraph = biographer.Graph()                   # initialize new Graph

def importBioModel( BioModelID ):
    import os
    import httplib
    global session, request, db

    reset_current_session()                             # reset session

    session.BioModelsID = BioModelID.rjust(10, "0")                 # adjust BioModel's ID
    print "BioModel requested: ID "+session.BioModelsID

    cachefolder = os.path.join( request.folder, "static/BioModels.net" )
    if not os.path.exists( cachefolder ):
        os.mkdir( cachefolder )
    cachename = os.path.join( cachefolder, session.BioModelsID+".sbml" )        # what's the cache filename ?
    print "BioModel cache filename: "+cachename

    def UpdateDatabase(SBML, ID):                           # in case we find a model, store meta info in the database
        global db
        key = 'name="'
        p = SBML.find(key)
        if p > -1:
            p += len(key)
            q = SBML.find('"',p)
            title = SBML[p:q].replace("_"," ")
            if len( db( db.BioModels.BIOMD == ID ).select() ) == 0:
                db.BioModels.insert( BIOMD=ID, Title=title )

    if os.path.exists( cachename ):                         # BioModel in cache ?
        session.SBML = open(cachename).read()
        session.bioGraph.importSBML( session.SBML )             # import
        UpdateDatabase( session.SBML, session.BioModelsID )         # DB update
        session.flash = "BioModel loaded from cache"
        print "BioModel "+session.BioModelsID+" loaded from cache"
    else:                                       # No, download it from EBI
        connection = httplib.HTTPConnection("www.ebi.ac.uk")
        connection.request("GET", "/biomodels-main/download?mid=BIOMD"+session.BioModelsID)
        session.SBML = connection.getresponse().read()
        connection.close()
        if session.SBML.find("There is no model associated") > -1:      # error: no such model
            session.SBML = None                     # drop downloaded content
            session.flash = "Error: No such BioModel"
            print "No such BioModel: "+session.BioModelsID
        else:                                   # SBML downloaded successfully
            open(cachename,'w').write( session.SBML )
            session.bioGraph.importSBML( session.SBML )         # import
            UpdateDatabase( session.SBML, session.BioModelsID )     # DB update
            session.flash = "BioModel imported successfully"
            print "BioModel "+session.BioModelsID+" downloaded and imported"

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

def importLayout(graph, lines):
    type2sbo = dict(Protein = 252,SimpleCompound=247,Complex=253,Reaction=167,Compartment=290,Compound=285)
    nodeh={}#nodeid to index
    for cc,node in enumerate(graph['nodes']):
      nodeh[node['id']] = cc

    minx=1000000000000000000
    miny=1000000000000000000
    i = 0
    while i < len(lines):
        node_type=lines[i+1].strip()
        node_id=lines[i+2].strip()
        compartment=lines[i+3].strip()
        x=float(lines[i+4].strip())
        y=float(lines[i+5].strip())
        w=float(lines[i+6].strip())
        h=float(lines[i+7].strip())
        i+=9
        print 'node_type: ',node_type,'node_id',node_id,'compartment',compartment,'x',x,'y',y,'w',w,'h',h

        if node_id not in nodeh:
            print 'continue id not in nodeh'
            continue

        if node_type == 'Compartment':
            graph['nodes'][nodeh[node_id]]['data']['x'] = 1*x
            graph['nodes'][nodeh[node_id]]['data']['y'] = -y-h
            graph['nodes'][nodeh[node_id]]['data']['width'] = 1*w
            graph['nodes'][nodeh[node_id]]['data']['height'] = 1*h
        elif node_type in type2sbo:
            graph['nodes'][nodeh[node_id]]['data']['x'] = 1*x-w/2
            graph['nodes'][nodeh[node_id]]['data']['y'] = -y-h/2
        else:
            print 'eeeerrroroor'
            raise HTTP(500, 'nooo')

        if graph['nodes'][nodeh[node_id]]['data']['x'] < minx:
            minx= graph['nodes'][nodeh[node_id]]['data']['x']
        if graph['nodes'][nodeh[node_id]]['data']['y'] < miny:
            miny= graph['nodes'][nodeh[node_id]]['data']['y']

    for node in graph['nodes']:
        if node['data'].has_key('x'):
            node['data']['x'] -= minx
        if node['data'].has_key('y'):
            node['data']['y'] -= miny
    #node_id2node = dict([(node['id'],node) for node in graph['nodes']])
    for node in graph['nodes']:
        print node
        if node['data'].has_key('compartment') and node['data']['compartment']:
            cp = nodeh[node['data']['compartment']]
            node['data']['x'] -= graph['nodes'][cp]['data']['x']
            node['data']['y'] -= graph['nodes'][cp]['data']['y']

def sbgnml2json(sbgnml_str):
    graph = dict(nodes = [], edges = [])
    import xmlobject
    xml = xmlobject.XMLFile(raw=sbgnml_str)
    class2sbo = {
            'compartment' : 290,
            'macromolecule' : 245,
            'simple chemical' : 247,
            'complex' : 253,
            'process' : 375,
            'association' : 285,#FIXME this is not correct but our json lib does not have this node type
            'phenotype' : 285,#FIXME this is not correct but our json lib does not have this node type
            'submap' : 285,#FIXME this is not correct but our json lib does not have this node type
            #addMapping(nodeMapping, [285], bui.UnspecifiedEntity);
            #addMapping(nodeMapping, [250, 251], bui.NucleicAcidFeature);
            }
    def get_node(node):
        '''
        recursive funciton to get one node/glyph and its sub nodes/glyphs
        '''
        node_item = dict(
            id = node.id,
            sbo = class2sbo[node.get('class')],
            is_abstract = 0,
            type = node.get('class'),
            data = dict (
                x = float(node.bbox[0].x),
                y = float(node.bbox[0].y),
                )
            )
        #---------
        if hasattr(node, 'label'):
            node_item['data']['label'] = node.label[0].text,
        #---------
        if hasattr(node, 'glyph'):#subnodes present
            node.glyph
            node_item['data']['subnodes'] = []
            for sub_node in node.glyph:
                if sub_node.get('class') in class2sbo.keys():
                    get_node(sub_node)
                    node_item['data']['subnodes'].append(sub_node.id)
        graph['nodes'].append(node_item)
    #------------------------------
    #iterate through nodes
    for node in xml.root.map[0].glyph:
        get_node(node)
    return graph
