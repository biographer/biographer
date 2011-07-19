# -*- coding: utf-8 -*-

# TEMPORARY BUG WORKAROUND
import sys
hardcoded = "/var/www/web2py/applications/biographer/modules"
if not hardcoded in sys.path:
	sys.path.append(hardcoded)
import biographer
# END WORKAROUND

import os

def Layout():
	if session.bioGraph is not None:
		session.bioGraph.doBioLayout( os.path.join( request.folder, "static/Layout/build/layout" ) )
		return dict()
	else:
		response.flash = "Please import a Graph first !"
		return dict( url="", dot="" )

