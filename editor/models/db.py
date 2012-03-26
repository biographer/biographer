#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

import sys
# http://www.web2py.com/book/default/chapter/06

db = DAL('sqlite://cache.sqlite')

db.define_table('BioModels',    Field('BIOMD','string'),    Field('Title','string'),    Field('File','string') )
db.define_table('Reactome', Field('ST_ID','string'),    Field('Title','string'),    Field('File','string') )


#########################################################################
if session.debug:
    APP_URL = request.env.http_host+'/biographer'
else:
    APP_URL = 'biographer.biologie.hu-berlin.de'
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

    #page = _download('http://www.reactome.org/cgi-bin/eventbrowser_st_id?ST_ID='+ReactomeStableIdentifier')
    connection = httplib.HTTPConnection("www.reactome.org")
    connection.request("GET", '/cgi-bin/eventbrowser_st_id?ST_ID='+ReactomeStableIdentifier, None, {"Cookie":"ClassicView=1"} )
    page = connection.getresponse().read()

    p = page.find('/cgi-bin/sbml_export?')
    if p > -1:
        q = page.find('"', p)
        connection.request("GET", page[p:q])                    # download SBML
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

def reset_current_session():
    global session

    session.JSON = None             # reset
    session.SBML = None
    session.BioModelsID = None

    if session.bioGraph is not None:        # delete old graph
        del session.bioGraph

    from graph import Graph
    from defaults import progress
    session.bioGraph = Graph(verbosity=progress)    # new graph

def export_JSON():                  # workaround for web2py bug
    from copy import deepcopy
    global session
    session.bioGraph.exportJSON()
    temp = deepcopy( session.bioGraph )
    del session.bioGraph
    session.bioGraph = temp
    return session.bioGraph.JSON

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
    start = time()                                  # start a timer
    process = Popen( split(path_to_layout_binary+' '+infile+' '+outfile) )      # run layout binary
    graph.log(info, "Executable started. Timeout is set to "+str(timeout)+" seconds. Waiting for process to complete ...")
    runtime = 0
    while (process.poll() is None) and (runtime < timeout):             # wait until timeout
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
def sbml2jsbgn(sbml_str, rxncon=False):
    try:
        import libsbml
    except ImportError:
        raise HTTP(500, 'Your need to install libsbml-python to use this function. For Debian/Ubuntu see http://sbos.eu/doku.php?id=installation_instructions')
    doc = libsbml.readSBMLFromString(sbml_str)
    model = doc.getModel()
    graph = dict(nodes = [], edges = [])
    compartment2species = {}
    seen_species = set()
    #------------------------------------------
    if rxncon or request.vars.rxncon:
        import re
        pattern_nd = re.compile('(.+)\(([^\)]*)\)')
    def modification2statevariable(mod):
        if '~' in mod:
            mod_split = mod.split('~')
            if mod_split[1] == 'U':
                mod_split[1] = ' '
                print 'replaced U'
            if mod_split[0]=='bd':
                return mod_split[1]
            else:
                return '%s@%s'%(mod_split[1],mod_split[0])
        return ''
    #------------------------------------------
    name_or_id = lambda x : x.getName() or x.getId()
    #------------------------------------------
    def add_node(species_id, source_id, target_id, edge_sbo):
        species = model.getSpecies(species_id)
        if species_id not in seen_species:
            seen_species.add(species_id)
            #-------------------------------------
            if rxncon or request.vars.rxncon:
                if '.' in species.getName():
                    complex_item = dict( id = species_id, sbo = 253, is_abstract = 0, data = dict ( x = 0.0, y = 0.0, width = 60, height = 60,subnodes=[]))
                    for subnode_id in species.getName().split('.'):
                        match = re.search(pattern_nd, subnode_id)
                        subnode_id, mods = match.group(1),match.group(2)
                        if ('rna' in subnode_id.lower()) or ('dna' in subnode_id.lower()):
                            sbo = 250
                        else:
                            sbo = 252
                        node_item = dict( id = species_id+subnode_id, sbo = sbo, is_abstract = 0, data = dict ( x = 0.0, y = 0.0, width = 60, height = 60, label=subnode_id))
                        if mods:
                            show_mods = [modification2statevariable(mod) for mod in mods.split(',') if '!' not in mod]
                            node_item['data']['statevariable'] = [x for x in show_mods if x]
                        complex_item['data']['subnodes'].append(species_id+subnode_id)
                        graph['nodes'].append(node_item)
                    graph['nodes'].append(complex_item)
                else:
                    match = re.search(pattern_nd, species.getName())
                    spec_id, mods = match.group(1),match.group(2)
                    if ('rna' in spec_id.lower()) or ('dna' in spec_id.lower()):
                        sbo = 250
                    else:
                        sbo = 252
                    node_item = dict( id = species_id, sbo = sbo, is_abstract = 0, data = dict ( x = 0.0, y = 0.0, width = 60, height = 60, label=spec_id))
                    if mods:
                        show_mods = [modification2statevariable(mod) for mod in mods.split(',') if '!' not in mod]
                        node_item['data']['statevariable'] = [x for x in show_mods if x]
                    graph['nodes'].append(node_item)
                    #-------------------------------------
            else:
                if 'sink' in species_id or name_or_id(species).lower() == 'emptyset':
                    sbo = 291
                    label = ''
                else:
                    sbo = 285
                    #-------------------------------------
                    #guess sbo
                    for n in range(species.getNumCVTerms()):
                        cvt = species.getCVTerm(n)
                        res = cvt.getResources()
                        for m in range(res.getLength()):
                            resource = res.getValue(m)
                            if 'urn:miriam:obo.chebi' in resource:
                                sbo = 247
                                break
                            if 'urn:miriam:pubchem' in resource:
                                sbo = 247
                                break
                            if 'urn:miriam:uniprot' in resource:
                                sbo = 245
                                break
                    if ('rna' in name_or_id(species).lower()) or ('dna' in name_or_id(species).lower()):
                        sbo = 250
                    #if 'complex' in name_or_id(species).lower():
                    #    sbo = 253
                    label = name_or_id(species)
                #-------------------------------------
                #create node
                node_item = dict(
                    id = species_id,
                    sbo = sbo,
                    is_abstract = 0,
                    data = dict (
                        x = 0.0,
                        y = 0.0,
                        width = 60,
                        height = 60,
                        )
                    )
                if label:
                    node_item['data']['label'] = label
                #-------------------------------------
                graph['nodes'].append(node_item)
        #-------------------------------------
        #create edge
        edge_item = dict(
            id = 'x',
            source = source_id,
            target = target_id,
            sbo = edge_sbo,
            )
        graph['edges'].append(edge_item)
        #-------------------------------------
        #add compartment (compartments are linked from the compartment as subnodes)
        if species:
            #node_item['data']['compartment'] = species.getCompartment()
            try:
                compartment2species[species.getCompartment()].append(species.getId())
            except KeyError:
                compartment2species[species.getCompartment()] = [species.getId()]
            return species.getCompartment()
    #------------------------------------------
    for reaction in model.getListOfReactions():
        node_item = dict(
            id = reaction.getId(),
            sbo = 375,
            is_abstract = 0,
            data = dict (
                x = 0.0,
                y = 0.0,
                label = name_or_id(reaction),
                width = 20,
                height = 20,
                )
            )
        graph['nodes'].append(node_item)
        #---------------
        #reactands
        comp = None
        has_sink = False
        if len(reaction.getListOfReactants())==0:
            add_node(reaction.getId()+'sink', reaction.getId()+'sink', reaction.getId(), 394)
            has_sink = reaction.getId()+'sink'
        else:
            for substrate in reaction.getListOfReactants():
                comp = add_node(substrate.getSpecies(), substrate.getSpecies(), reaction.getId(), 394)
                if comp:
                    compartment2species[comp].append(reaction.getId())
        #---------------
        #products
        if len(reaction.getListOfProducts())==0:
            add_node(reaction.getId()+'sink', reaction.getId(), reaction.getId()+'sink', 393)
            has_sink = reaction.getId()+'sink'
        else:
            for product in reaction.getListOfProducts():
                comp = add_node(product.getSpecies(), reaction.getId(), product.getSpecies(), 393)
                if comp:
                    compartment2species[comp].append(reaction.getId())
        if has_sink:
            compartment2species[comp].append(has_sink)
        #---------------
        #modifiers
        for modifier in reaction.getListOfModifiers():
            #FIXME check sbo for edge_sbo
            add_node(modifier.getSpecies(), modifier.getSpecies(), reaction.getId(), 168)
    #------------------------------------------
    for compartment in model.getListOfCompartments():
        node_item = dict(
            id = compartment.getId(),
            sbo = 290,
            is_abstract = 0,
            data = dict (
                x = 10.0,
                y = 10.0,
                label = name_or_id(compartment),
                height = 200,
                width = 200,
                )
            )
        if compartment.getId() in compartment2species:
            node_item['data']['subnodes'] = list(set(compartment2species[compartment.getId()]))
        graph['nodes'].append(node_item)
    for i in range(len(graph['edges'])):
        graph['edges'][i]['id'] = 'edge%s'%i
    #print graph
    return graph

def sbgnml2jsbgn(sbgnml_str):
    graph = dict(nodes = [], edges = [])
    import xmlobject
    xml = xmlobject.XMLFile(raw=sbgnml_str)
    port2node = {}
    class2sbo = {
            'compartment' : 290,
            'macromolecule' : 245,
            'macromolecule multimer' : 245,#FIXME
            'simple chemical' : 247,
            'simple chemical multimer' : 247,#FIXME
            'complex' : 253,
            'process' : 375,
            'omitted process' : 379,
            'uncertain process' : 396,
            'annotation' : 110003,
            'phenotype' : 358,
            'nucleic acid feature' : 250,
            'nucleic acid feature multimer' : 250,#FIXME
            'association' : 177,
            'dissociation' : 180,
            'entity' : 245,
            'submap' : 395,
            'terminal' : 110004,
            'perturbing agent' : 405,
            'variable value': 110001,
            'implicit xor': -1,
            'tag' : 110002,
            'and' : 173,
            'or' : 174,
            'not' : 238,
            'delay' : 225,
            'source and sink' : 291,
            'stimulation' : 459,
            'consumption' : 15,
            'production' : 393,
            'catalysis' : 13,
            'equivalence arc' : 15,
            'logic arc' : 15,
            'necessary stimulation': 461,
            'assignment' : 464,
            'interaction' : 342,
            'absolute inhibition': 407,
            'modulation' : 168,
            'inhibition' : 169,
            'absolute stimulation' : 411,
            #AF------------------
            'biological activity' : 412,
            'unknown influence' : 168,
            'positive influence' : 170,
            'negative influence' : 169,
            'perturbation' : 405,
            }
    def get_node(node, parent = None):
        '''
        recursive funciton to get one node/glyph and its sub nodes/glyphs
        '''

        x = float(node.bbox[0].x)
        y = float(node.bbox[0].y)
        if parent:
            x -= parent['data']['x']
            y -= parent['data']['y']
        node_item = dict(
            id = node.id,
            sbo = class2sbo[node.get('class')],
            is_abstract = 0,
            #type = node.get('class'),
            data = dict (
                x = x,
                y = y,
                height = float(node.bbox[0].h),
                width = float(node.bbox[0].w),
                )
            )
        #---------
        if hasattr(node, 'label'):
            node_item['data']['label'] = node.label[0].text
        #---------
        if hasattr(node, 'orientation'):
            node_item['data']['orientation'] = node.orientation
        #---------
        if hasattr(node, 'clone'):
            node_item['data']['clone_marker'] = True
        #---------
        if hasattr(node, 'glyph'):#subnodes present
            node.glyph
            node_item['data']['subnodes'] = []
            for sub_node in node.glyph:
                if sub_node.get('class') == 'location':
                    try: node_item['data']['statevariable'].append( 'location' )
                    except KeyError: node_item['data']['statevariable'] = ['location']
                    port2node[sub_node.id] = '%s:%s'%(node.id,'location')
                if sub_node.get('class') == 'existence':
                    try: node_item['data']['statevariable'].append( 'existence' )
                    except KeyError: node_item['data']['statevariable'] = ['existence']
                    port2node[sub_node.id] = '%s:%s'%(node.id,'existence')
                elif sub_node.get('class') == 'state variable':
                    try: var = sub_node.state[0].get('variable')
                    except AttributeError: var = ''
                    try: val = sub_node.state[0].get('value')
                    except AttributeError: val = ''

                    if not var and not val: state = ''
                    elif var and val: state = '%s@%s'%(var,val)
                    else: state = var if var else val

                    try: node_item['data']['statevariable'].append( state )
                    except KeyError: node_item['data']['statevariable'] = [state]
                    if state:
                        port2node[sub_node.id] = '%s:%s'%(node.id,state)
                elif sub_node.get('class') == 'unit of information':
                    label = sub_node.label[0].text if hasattr(sub_node, 'label') else ''
                    try:
                        node_item['data']['unitofinformation'].append( label )
                    except KeyError:
                        node_item['data']['unitofinformation'] = [label]
                elif sub_node.get('class') in class2sbo.keys():
                    get_node(sub_node, parent = node_item)
                    node_item['data']['subnodes'].append(sub_node.id)
        if hasattr(node, 'port'):
            for port in node.port:
                port2node[port.id] = node.id
        graph['nodes'].append(node_item)

    #------------------------------
    #iterate through nodes
    for node in xml.root.map[0].glyph:
        get_node(node)
    count = 0
    if hasattr(xml.root.map[0], 'arc'):
        for edge in xml.root.map[0].arc:
            if hasattr(edge, 'glyph'):
                for glyph in edge.glyph:
                    port2node[glyph.id] = edge.id
            if hasattr(edge, 'port'):
                for port in edge.port:
                    port2node[port.id] = edge.id
    if hasattr(xml.root.map[0], 'arc'):
        for edge in xml.root.map[0].arc:
            source = edge.source if edge.source not in port2node else port2node[edge.source]
            target = edge.target if edge.target not in port2node else port2node[edge.target]
            edge_item = dict(
                id = edge.id,
                source = source,
                    target = target,
                sbo = class2sbo[edge.get('class')]
                )
            count += 1
            if hasattr(edge, 'next'):
                for point in edge.get('next'):
                    x = float(point.x)
                    y = float(point.y)
                    try:
                        edge_item['data']['points'].insert(0, y)
                        edge_item['data']['points'].insert(0, x)
                    except KeyError:
                        edge_item['data'] = dict(points = [x, y])
            if hasattr(edge, 'glyph'):
                for glyph in edge.glyph:
                    if glyph.get('class') == 'cardinality':
                        try:
                            edge_item['data']['cis_trans'] = glyph.label[0].text
                        except KeyError:
                            edge_item['data'] = dict(cis_trans = glyph.label[0].text)
            graph['edges'].append(edge_item)

    #print graph
    lang2lang = {'entity relationship': 'ER', 'process description': 'PD', 'activity flow': 'AF'}
    graph['sbgnlang'] = lang2lang[xml.root.map[0].language]
    return graph
#########################################################################

class ContentTooShortError(Exception):
    def __init__(self,message):
        self.errorMessage = 'Bla: %s'% message

status_fkt = lambda message,close=False: sys.stderr.write(message)

def download_status_fkt(size_known,num_done,start=False,stop=False,url=''):
    ''' internal default function if no external UI functions were set (see L{setUIFunctions})'''
    if size_known: 
        percent = int(num_done*100/size_known)
    else:
        percent = int(num_done)
    if start: sys.stderr.write("Loading %s\n"%url)
    elif stop: 
        sys.stderr.write("\nLoading Finished\n")
        return
    if not size_known: sys.stderr.write("%s B\r"%percent)
    else: sys.stderr.write( str(percent) + "% \r")
    sys.stdout.flush()

def _download(url,post_data=None):
    '''
    Function download is downloading and returning the database flatfiles.
    @param url     : url of a database flatfile
    @type url      : string            
    @param post_data : data for POST requests e.g. {'submit':'Download'}
    @type post_data : dict
    @return: downloaded page
    @rtype: str
    '''
    #-----------------------------------------------------
    #create a realistic user agent
    import urllib2
    headers = {
    'User-Agent' : 'Mozilla/4.0 (compatible; MSIE 5.5; Windows NT)',
    'Accept' :
    'text/xml,application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5',
    'Accept-Language' : 'fr-fr,en-us;q=0.7,en;q=0.3',
    'Accept-Charset' : 'ISO-8859-1,utf-8;q=0.7,*;q=0.7'
    }
    #-----------------------------------------------------
    #check if we got an internet connetction
    #self.status_fkt('Checking connection ...')
    #if not self.checkConnection(): raise DatabaseError('No Internet Connection')
    #-----------------------------------------------------
    status_fkt("Loading %s\n"%url)
    #-----------------------------------------------------
    reqObj = urllib2.Request(url, post_data, headers)
    fp = urllib2.urlopen(reqObj)
    headers = fp.info()
    ##    This function returns a file-like object with two additional methods:
    ##    * geturl() -- return the URL of the resource retrieved
    ##    * info() -- return the meta-information of the page, as a dictionary-like object
    ##Raises URLError on errors.
    ##Note that None may be returned if no handler handles the request (though the default installed global OpenerDirector uses UnknownHandler to ensure this never happens). 
    #-----------------------------------------------------
    #read & write fileObj to filename
    filename = 'outfile'
    outcontents=''
    result = filename, headers
    bs = 1024*8
    size = -1
    read = 0
    blocknum = 0
    #-----------------------------------------------------
    size_known = "content-length" in headers
    if size_known: 
        size_known = int(headers["Content-Length"])
        size = int(headers["Content-Length"])
    download_status_fkt(size_known,0,True,url=url)
    #-----------------------------------------------------
    while 1:
        block = fp.read(bs)
        if block == "":
            break
        read += len(block)
        outcontents+=block
        blocknum += 1
        #-------------------------------------------
        download_status_fkt(size_known,(blocknum*bs),False,False)
    #-----------------------------------------------------
    download_status_fkt(size_known,size_known,False,True) 
    fp.close()
    del fp
    #-----------------------------------------------------
    # raise exception if actual size does not match content-length header
    if size >= 0 and read < size:
        raise ContentTooShortError("retrieval incomplete: got only %i out of %i bytes %s" % (read, size))

    #-----------------------------------------------------
    # taking care of gzipped content
    if url.endswith(".gz"):
        import StringIO, gzip
        stream = StringIO.StringIO(outcontents)
        zfile = gzip.GzipFile(fileobj=stream)
        outcontents = zfile.read()
    #-----------------------------------------------------

    return outcontents

def import_file(file_content, file_name = ''):
    file_content = file_content.strip()
    action = ''
    graph = {}
    if file_content.startswith('{') and file_content.endswith('}'):#basic check
        json_string = file_content
        try:
            graph = simplejson.loads(file_content)
        except simplejson.JSONDecodeError:
            action = 'loaded %s but could not parse json'%file_name
            graph = dict(nodes = [], edges = [])
        else:
            action = 'loaded %s'%file_name
    elif ('http://sbgn.org/libsbgn/' in file_content):
        graph = sbgnml2jsbgn(file_content)
        json_string = simplejson.dumps(graph)
        action = 'loaded %s'%file_name
    elif 'http://www.sbml.org/sbml/' in file_content:
        graph = sbml2jsbgn(file_content)
        json_string = simplejson.dumps(graph)
        action = 'loaded %s'%file_name
    if action and graph and json_string:
        return action, graph, json_string
    else:
        print 'action: ',action
        print 'graph: ',graph
        print 'sbgnml? :',('http://sbgn.org/libsbgn/pd' in file_content) or ('http://sbgn.org/libsbgn/0.2' in file_content)
        #print 'file_content: ',file_content

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

