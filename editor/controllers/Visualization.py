# -*- coding: utf-8 -*-

import sys

hardcoded = request.folder + "/modules"
if not hardcoded in sys.path:
	sys.path.append(hardcoded)
import biographer

from Layout import dographviz

def index():									# REDIRECT to biographer
	return redirect(URL(r=request, c="Visualization", f="biographer"))

def biographer():								# Ben's JavsScripts
	return dict()

def graphiz():									# graphviz
	if session.bioGraph is None:
		session.flash = "Import a graph first !"
		return redirect( URL(r=request, c="BioModels", f="importer")+"?returnto="+URL(r=request, c="graphviz", f="Visualization") )

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

