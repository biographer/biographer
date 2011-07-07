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
import random
import string

def draw():
	reload(biographer)
	if session.bioGraph is not None:
		random_string	= ''.join( random.choice(string.ascii_uppercase + string.digits) for x in range(12) ) + '.png'
		path		= os.path.join(request.folder, "static/graphviz", random_string)
		url		= URL(r=request, c="static/graphviz", f=random_string)
		dot, png	= session.bioGraph.doGraphviz( tempfile=path )
		return dict( url=url, dot=dot )
	else:
		session.flash = "You must import a Graph first !"
		return dict( url="", dot="" )
