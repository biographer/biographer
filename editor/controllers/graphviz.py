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
	response.flash = boundaries
	return dict()

def Layout():
	if session.bioGraph is None:
		session.flash = "Import a graph first !"
		return redirect( URL(r=request, c="Workbench", f="index") )
	graphviz()
	return dict()

def Visualization():
	if session.bioGraph is None:
		session.flash = "Import a graph first !"
		return redirect( URL(r=request, c="Workbench", f="index") )
	graphviz()
	Map = '<map name="DijkstraMap">\n'
	for node in session.bioGraph.Nodes:
		x1 = str( int(float(node.data['x'])) )
		y1 = str( int(float(node.data['y'])) )
		x2 = str( int(float(node.data['x']) + float(node.data['width'])*100) )
		y2 = str( int(float(node.data['y']) + float(node.data['height'])*100) )
		Map += '\t<area shape="rect" coords="'+x1+','+y1+','+x2+','+y2+'" href="'+URL(r=request, c="Workbench", f="Dijkstra")+'?id='+node.id+'" alt="'+node.data['label']+'" title="'+node.data['label']+'">\n'
	Map += "</map>"
	return dict( DijkstraMap=Map )

