# -*- coding: utf-8 -*-

request_folder = "/var/www/web2py/applications/biographer"

import sys

hardcoded = request_folder + "/modules"
if not hardcoded in sys.path:
	sys.path.append(hardcoded)
import biographer

hardcoded = request_folder + "/controllers"
if not hardcoded in sys.path:
	sys.path.append(hardcoded)
from Layout import dographviz

def biographer():								# Ben's JavsScripts
	if session.bioGraph is None:
		session.flash = "Unable to visualize: No graph is loaded. Import a model from BioModels.net ?"
		return redirect( URL(r=request, c="Import", f="BioModels")+"?returnto="+URL(r=request, c="Visualization", f="biographer") )

	return dict()

def graphviz():									# graphviz
	if session.bioGraph is None:
		session.flash = "Unable to visualize: No graph is loaded. Import a model from BioModels.net ?"
		return redirect( URL(r=request, c="Import", f="BioModels")+"?returnto="+URL(r=request, c="Visualization", f="graphviz") )

	dographviz()

	Map = ""								# create a HTML map of the nodes in the picture, so we click 'em
	for node in session.bioGraph.Nodes:
		left	= str( int(float(node.data['x'])) )
		top	= str( int(float(node.data['y'])) )
		width	= str( int(float(node.data['width'])) )
		height	= str( int(float(node.data['height'])) )
		if left > 0 and top > 0 and width > 0 and height > 0:
			Map 	+= '<div class=area style="left:'+left+'px; top:'+top+'px; width:'+width+'px; height:'+height+'px;" onClick="gotoDijkstra(\''+str(node.id)+'\');">'+node.data['label']+'</div>\n'

	return dict( DijkstraMap=Map )

