#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

def download_BioModel( BioModelID ):

    import os
    import httplib
    global session, request, db

    reset_current_session()                         			# reset session

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

