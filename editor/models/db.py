#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

# http://www.web2py.com/book/default/chapter/06

db = DAL('sqlite://cache.sqlite')

db.define_table('BioModels',	Field('BIOMD','string'),	Field('Title','string'),	Field('File','string') )
db.define_table('Reactome',	Field('ST_ID','string'),	Field('Title','string'),	Field('File','string') )


#########################################################################
#this is a config helper 
db.define_table('config',
        Field('section'),
        Field('option'),
        Field('value')
        )
class Config:
    '''configure general things needed'''

    def __init__(self):
        self.create('smtp','login','user:password')
        self.create('smtp','server','server:portx')
        self.create('smtp','sender','name@server.org')
    def get(self, section, option):
        '''get a value'''
        record = db(db.config.option == option)(db.config.section == section).select(db.config.value).first()
        if record:
            return record.value.strip()

    def create(self, section, option, value):
        '''create value if it does not exist'''
        if not db(db.config.option == option)(db.config.section == section).count():
            print 'create: ',option,section,value
            db.config.insert(section = section, option = option, value = value)

    def set(self, section, option, value):
        '''set or update a value'''
        record = db(db.config.option == option)(db.config.section == section).select().first()
        if record:
            print 'setting val',record
            #record.update_record(value = value)
            db.config[record.id] = dict(section = section, option = option, value = value)
        else:
            print 'inserting val'
            db.config.insert(section = section, option = option, value = value)
        print 'fuuuuck',db.config[record.id]
    def write(self):
        pass
config = Config()
#########################################################################

from gluon.tools import *
from gluon.contrib import simplejson
mail = Mail()                                  # mailer
auth = Auth(globals(),db)                      # authentication/authorization
crud = Crud(globals(),db)                      # for CRUD helpers using auth
service = Service(globals())                   # for json, xml, jsonrpc, xmlrpc, amfrpc
plugins = PluginManager()

mail.settings.server = config.get('smtp', 'server') # your SMTP server
mail.settings.sender = config.get('smtp', 'sender') # your email
mail.settings.login = config.get('smtp', 'login') # your credentials or None

auth.settings.hmac_key = 'sha512:96779a30-57c0-40a7-a874-0b464c56e825'   # before define_tables()
auth.define_tables()                           # creates all needed tables
auth.settings.mailer = mail                    # for user email verification
auth.settings.actions_disabled.append('register')
auth.settings.registration_requires_verification = True
auth.settings.registration_requires_approval = True
auth.messages.verify_email = 'Click on the link http://'+request.env.http_host+URL(r=request,c='default',f='user',args=['verify_email'])+'/%(key)s to verify your email'
auth.settings.reset_password_requires_verification = True
auth.messages.reset_password = 'Click on the link http://'+request.env.http_host+URL(r=request,c='default',f='user',args=['reset_password'])+'/%(key)s to reset your password'

#########################################################################
## If you need to use OpenID, Facebook, MySpace, Twitter, Linkedin, etc.
## register with janrain.com, uncomment and customize following
# from gluon.contrib.login_methods.rpx_account import RPXAccount
# auth.settings.actions_disabled=['register','change_password','request_reset_password']
# auth.settings.login_form = RPXAccount(request, api_key='...',domain='...',
#    url = "http://localhost:8000/%s/default/user/login" % request.application)
## other login methods are in gluon/contrib/login_methods
#########################################################################

crud.settings.auth = None                      # =auth to enforce authorization on crud

#########################################################################
#login as first user if user comes from localhost
#########################################################################
import os.path
if not auth.is_logged_in() and db(db.auth_user.id>0).count() and not os.path.exists(os.path.join(request.folder, 'LOCK')) and (request.env.remote_addr in '127.0.0.1 localhost'.split()):
    from gluon.storage import Storage
    user = db(db.auth_user.id==1).select().first()
    auth.user = Storage(auth.settings.table_user._filter_fields(user, id=True))
    auth.environment.session.auth = Storage(user=user, last_visit=request.now,
                                            expiration=auth.settings.expiration)
    response.flash = 'You were automatically logged in as %s %s.<br/> To prevent this create the file %s'%(user.first_name, user.last_name, os.path.join(request.folder, 'LOCK'))
#########################################################################
#########################################################################
#Cache functions
def BioModel_to_cache(SBML, ID):
	global db

	key = 'name="'
	p = SBML.find(key)
	if p > -1:
		p += len(key)
		q = SBML.find('"',p)
		title = SBML[p:q].replace("_"," ")

		if len( db( db.BioModels.BIOMD==ID ).select() ) == 0:
			db.BioModels.insert( BIOMD=ID, Title=title, File=SBML )

def BioModel_from_cache( BioModelID ):
	global db

	select = db( db.BioModels.BIOMD==BioModelID ).select()

	if len( select ) == 1:
		return select[0].File
	else:
		return None

def Reactome_to_cache(SBML, ID):
	global db

	key = 'name="'
	p = SBML.find(key)
	if p > -1:
		p += len(key)
		q = SBML.find('"',p)
		title = SBML[p:q].replace("_"," ")

		if len( db( db.Reactome.ST_ID==ID ).select() ) == 0:
			db.Reactome.insert( ST_ID=ID, Title=title, File=SBML )

def Reactome_from_cache( ReactomeStableIdentifier ):
	global db

	select = db( db.Reactome.ST_ID==ReactomeStableIdentifier ).select()

	if len( select ) == 1:
		return select[0].File
	else:
		return None

def download_Reactome( ReactomeStableIdentifier ):

	import httplib

	connection = httplib.HTTPConnection("www.reactome.org")
	connection.request("GET", '/cgi-bin/eventbrowser_st_id?ST_ID='+ReactomeStableIdentifier, None, {"Cookie":"ClassicView=1"} )
	page = connection.getresponse().read()

	p = page.find('/cgi-bin/sbml_export?')
	if p > -1:
		q = page.find('"', p)
		connection.request("GET", page[p:q])					# download SBML
		return connection.getresponse().read()

	if page.find('has been updated in the most recent release of Reactome') > -1:

		print 'This Reactome model is superseded.'

		key = '="eventbrowser_st_id?ST_ID='
		p = page.find(key)+len(key)
		q = page.find('"', p)
		new_RSI = page[p:q]
		if new_RSI.find('REACT_') == 0:
			print 'New RSI is '+new_RSI+'.'
			return download_Reactome( new_RSI )

	return None

def download_BioModel( BioModelsID ):

	import httplib

	connection = httplib.HTTPConnection("www.ebi.ac.uk")
	connection.request("GET", "/biomodels-main/download?mid=BIOMD"+str(BioModelsID).rjust(10, "0"))
	Model = connection.getresponse().read()
	connection.close()

	if Model.find("There is no model associated") > -1:	# no such model
		return None
	else:							# SBML download successful
		return Model

def reset_current_session():
	global session

	session.JSON = None				# reset
	session.SBML = None
	session.BioModelsID = None

	if session.bioGraph is not None:		# delete old graph
		del session.bioGraph

	from graph import Graph
    from defaults import progress
	session.bioGraph = Graph(verbosity=progress)	# new graph

def import_JSON( JSONstring ):
	global session
	reset_current_session()
	session.bioGraph.importJSON( JSONstring )

def export_JSON():					# workaround for web2py bug
    from copy import deepcopy
	global session
	session.bioGraph.exportJSON()
	temp = deepcopy( session.bioGraph )
	del session.bioGraph
	session.bioGraph = temp
	return session.bioGraph.JSON

def import_SBML( SBMLstring ):
	global session
	reset_current_session()
	session.bioGraph.importSBML( SBMLstring )

def import_BioModel( BioModelsID ):
	global session, request, db

	BioModelsID = BioModelsID.rjust(10, "0")	# adjust BioModel's ID
	print "BioModel requested: BIOMD"+BioModelsID

	model = BioModel_from_cache( BioModelsID )
	if model is None:
		print "Not in cache. Downloading ..."
		model = download_BioModel( BioModelsID )
		if model is None:
			print "Error: Download failed"
			session.flash = "Error: BioModel download failed"
			return False
		else:
			print "Downloaded successful."
			session.flash = "BioModel downloaded"
			BioModel_to_cache( model, BioModelsID )
	else:
		print "Loaded from cache."
		session.flash = "BioModel loaded from cache"
	
	reset_current_session()
	session.BioModelsID = BioModelsID
	session.SBML = model
	session.bioGraph.importSBML( session.SBML )
	return model

def import_Reactome( ReactomeStableIdentifier ):
	global session, request, db

	print "Request for RSI:"+ReactomeStableIdentifier

	model = Reactome_from_cache( ReactomeStableIdentifier )
	if model is None:
		print "Not in cache. Downloading ..."
		model = download_Reactome( ReactomeStableIdentifier )
		if model is None:
			print "Error: Download failed"
			session.flash = "Error: Reactome download failed"
			return False
		else:
			print "Downloaded successful."
			session.flash = "Reactome model downloaded"
			Reactome_to_cache( model, ReactomeStableIdentifier )
	else:
		print "Loaded from cache."
		session.flash = "Reactome model loaded from cache"

	reset_current_session()
	session.ST_ID = ReactomeStableIdentifier
	session.SBML = model
	session.bioGraph.importSBML( session.SBML )
	return model

#########################################################################
#########################################################################
def layout(graph, path_to_layout_binary, execution_folder='/tmp'):

	global session
	import os
	from subprocess import Popen
	from shlex import split
	from time import time, sleep
	from defaults import info, error

	if not os.path.exists(path_to_layout_binary):
		graph.log(error, "Fatal: layout binary not found.")
		return False

	infile = os.path.join(execution_folder, 'layout.infile')
	outfile = os.path.join(execution_folder, 'layout.outfile')

	open(infile, 'w').write( graph.export_to_Layouter() )
	if os.path.exists(outfile):
		os.remove(outfile)

	graph.log(info, "Now executing the layouter: "+path_to_layout_binary)
	graph.log(info, "in "+execution_folder+" ...")

	timeout = 120
	start = time()									# start a timer
	process = Popen( split(path_to_layout_binary+' '+infile+' '+outfile) )		# run layout binary
	graph.log(info, "Executable started. Timeout is set to "+str(timeout)+" seconds. Waiting for process to complete ...")
	runtime = 0
	while (process.poll() is None) and (runtime < timeout):				# wait until timeout
		sleep(1)
		runtime = time()-start
		graph.log(info, "Runtime is now: "+str(int(runtime))+" seconds")

	if runtime < timeout:
		graph.log(info, path_to_layout_binary+" finished.")
	else:
		graph.log(info, "Sorry, process timed out.")
		process.kill()
		return False

	if os.path.exists(outfile):
		graph.log(info, 'Output found in '+outfile)
	else:
		graph.log(error, 'Outfile not found: '+outfile)
		return False

	session.last_layout = open(outfile).read()
	graph.import_from_Layouter( session.last_layout )
	os.remove(outfile)
	os.remove(infile)

	graph.log(info,"Layouting completed successfully.")
#########################################################################
def import_Layout(graph, lines):
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
#########################################################################

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

#########################################################################
#########################################################################
# wrapper for graphviz
def mkdir_and_parents( path ):
	import os

	fullpath = ""
	for part in path.split("/"):
		fullpath += part+"/"
		if (len(fullpath) > 1) and (not os.path.exists(fullpath)):
			os.mkdir(fullpath)

def layout_using_graphviz(graph, execution_folder="/tmp", image_output_folder="/tmp", algorithm="dot"):

	import os, pygraphviz
	from defaults import info

	mkdir_and_parents(execution_folder)
	mkdir_and_parents(image_output_folder)

	graphviz_model = graph.export_to_graphviz()

	graph.log(info, "Executing graphviz ...")

	out_filename = graph.MD5+".svg"
	out = os.path.join(image_output_folder, out_filename)
	if os.path.exists(out):
		os.remove(out)

    #graphviz_model.dpi = 70;
	graphviz_model.layout( prog=algorithm )
	graphviz_model.draw( out )
	graph.graphviz_layout = graphviz_model.string()
	graph.log(info, "graphviz completed.")

	graph.import_from_graphviz( graph.graphviz_layout )

	return out_filename

