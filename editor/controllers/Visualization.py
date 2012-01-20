# -*- coding: utf-8 -*-

def index():
	return redirect(URL(r=request, c="Visualization", f="biographer"))

def internal():								# Ben's JavaScripts
	if session.bioGraph is None:
		session.flash = "Unable to visualize: No graph is loaded. But look at this pretty example!"
		return redirect(URL(r=request, c="Visualization", f="example"))

	return dict( network=export_JSON() )

def example():									# Ben's example
	return dict()

def graphviz():									# graphviz
	if session.bioGraph is None:
		session.flash = "Unable to visualize: No graph is loaded. Import a model from BioModels.net ?"
		return redirect( URL(r=request, c="Import", f="BioModels")+"?returnto="+URL(r=request, c="Visualization", f="graphviz")+"&BioModelsID=8" )

	Map = ""								# create a HTML map of the nodes in the picture, so we click 'em
	image_width = 4863
	image_height = 1883
	for node in session.bioGraph.Nodes:
		left	= str(int(node.data.x))
		top	= str(int(node.data.y))
		width	= str(int(node.data.width))
		height	= str(int(node.data.height))
		if left > 0 and top > 0 and width > 0 and height > 0:
			label	= node.data.label
			if label in [None, '']:
				label = node.id
			Map 	+= '\t<div class=area style="left:'+left+'px; top:'+top+'px; width:'+width+'px; height:'+height+'px;"/>'+label+'</div>\n'

	return dict( BoundingBoxes=Map )

