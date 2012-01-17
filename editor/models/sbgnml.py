#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

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


