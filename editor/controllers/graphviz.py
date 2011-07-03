# -*- coding: utf-8 -*-

import sys
sys.path.append("/var/www/web2py/applications/biographer/modules")
import biographer

def draw():
	reload(biographer)
	session.graphviz = session.bioGraph.exportGraphviz()
	return dict()

