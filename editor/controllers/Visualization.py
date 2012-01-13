# -*- coding: utf-8 -*-

def index():
	return redirect(URL(r=request, c="Visualization", f="biographer"))

def internal():								# Ben's JavaScripts
	if session.bioGraph is None:
		session.flash = "Unable to visualize: No graph is loaded. But look at this pretty example!"
		return redirect(URL(r=request, c="Visualization", f="example"))
	return dict( network=session.bioGraph.exportJSON() )

def example():									# Ben's example
	return dict()

def graphviz():									# graphviz
	if session.bioGraph is None:
		session.flash = "Unable to visualize: No graph is loaded. Import a model from BioModels.net ?"
		return redirect( URL(r=request, c="Import", f="BioModels")+"?returnto="+URL(r=request, c="Visualization", f="graphviz")+"&BioModelsID=8" )

	Map = ""								# create a HTML map of the nodes in the picture, so we click 'em
	_left = 3
	_height = 685
	xfactor = 1.34
	yfactor = 1.33
	for node in session.bioGraph.Nodes:
		print str(node.data.__dict__)
		width	= int(float(node.data.width)*xfactor)
		height	= int(float(node.data.height)*yfactor)
		left	= str(int(_left + float(node.data.x)*xfactor - width/2.))
		top	= str(int(_height - float(node.data.y)*yfactor - height/2.))
		width	= str(width)
		height	= str(height)
		if left > 0 and top > 0 and width > 0 and height > 0:
			Map 	+= '<div class=area style="left:'+left+'px; top:'+top+'px; width:'+width+'px; height:'+height+'px;" onClick="gotoDijkstra(\''+str(node.id)+'\');">'+node.data.label+'</div>\n'

	return dict( DijkstraMap=Map )

