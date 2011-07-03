# -*- coding: utf-8 -*-

import sys
sys.path.append("/var/www/web2py/applications/biographer/modules")
import biographer

def draw():
	reload(biographer)
	if session.bioGraph is not None:
		session.graphviz = session.bioGraph.exportGraphvizScript()
		session.bioGraph.exportGraphvizPNG( tempfile="/var/www/web2py/applications"+URL(r=request, c='static', f='images')+"/graphviz.png" )
	else:
		session.graphviz = ""
	return dict()

