# -*- coding: utf-8 -*-

import sys
import os.path
import random
import string
sys.path.append("/var/www/web2py/applications/biographer/modules")
import biographer

def draw():
	reload(biographer)
	if session.bioGraph is not None:
		session.graphviz = session.bioGraph.exportGraphvizScript()
		random_string = ''.join(random.choice(string.ascii_uppercase + string.digits) for x in range(12)) + '.png'
		local_filename = os.path.join(request.folder,"static/tmp",random_string)
		web_filename = URL(r=request, c="static/tmp", f=random_string)
		session.bioGraph.exportGraphvizPNG( tempfile=local_filename )
	else:
		session.graphviz = ""
	return dict(web_filename=web_filename)

