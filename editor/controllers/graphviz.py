# -*- coding: utf-8 -*-

# TEMPORARY BUG WORKAROUND
import sys
hardcoded = "/var/www/web2py/applications/biographer/modules"
if not hardcoded in sys.path:
	sys.path.append(hardcoded)
import biographer
reload(biographer)
# END WORKAROUND

import os

def draw():
	reload(biographer)
	if session.bioGraph is not None:
		dot, filename	= session.bioGraph.doGraphviz( folder=os.path.join(request.folder, "static/graphviz") )
		url		= URL(r=request, c="static/graphviz", f=filename)
		return dict( url=url, dot=dot )
	else:
		session.flash = "You must import a Graph first !"
		return dict( url="", dot="" )
