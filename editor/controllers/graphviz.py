# -*- coding: utf-8 -*-

# TEMPORARY BUG WORKAROUND
import sys
hardcoded = "/var/www/web2py/applications/biographer/modules"
if not hardcoded in sys.path:
	sys.path.append(hardcoded)
import biographer
# END WORKAROUND

import os
from copy import deepcopy

def graphviz():
	server_object		= deepcopy( session.bioGraph )
	del session.bioGraph
	session.graphvizDOT, filename, cached, boundaries = server_object.exportGraphviz( folder=os.path.join(request.folder, "static/graphviz"), useCache=True, updateNodeProperties=True )
	session.bioGraph	= server_object
	session.graphvizURL	= URL(r=request, c="static/graphviz", f=filename)
	if cached:
		response.flash = "graphviz layout loaded from cache"
	else:
		response.flash = "graphviz layout completed"
	return dict()

def Layout():
	if session.bioGraph is None:
		session.flash = "Import a graph first !"
		return redirect( URL(r=request, c="BioModels", f="importer")+"?returnto="+URL(r=request, c="graphviz", f="Layout") )
	graphviz()
	return dict()

def Visualization():
	if session.bioGraph is None:
		session.flash = "Import a graph first !"
		return redirect( URL(r=request, c="BioModels", f="importer")+"?returnto="+URL(r=request, c="graphviz", f="Visualization") )
	graphviz()
	Map = ""
	for node in session.bioGraph.Nodes:
		left	= str( int(float(node.data['x'])) )
		top	= str( int(float(node.data['y'])) )
		width	= str( int(float(node.data['width'])) )
		height	= str( int(float(node.data['height'])) )
		if left > 0 and top > 0 and width > 0 and height > 0:
			Map 	+= '<div class=area style="left:'+left+'px; top:'+top+'px; width:'+width+'px; height:'+height+'px;" onClick="gotoDijkstra(\''+str(node.id)+'\');">'+node.data['label']+'</div>\n'
	return dict( DijkstraMap=Map )

