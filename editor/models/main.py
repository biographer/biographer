#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

def reset_current_session():
	global session

	session.JSON = None				# reset
	session.SBML = None

	if session.bioGraph is not None:		# delete old graph
		del session.bioGraph

	from graph import Graph
	session.bioGraph = Graph()			# new graph


def importBioModel( BioModelID ):
	...


def import_Reactome( ReactomeStableIdentifier ):
	...


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


