# -*- coding: utf-8 -*-

# TEMPORARY BUG WORKAROUND
import sys
hardcoded = "/var/www/web2py/applications/biographer/modules"
if not hardcoded in sys.path:
	sys.path.append(hardcoded)
import biographer
reload(biographer)
# END WORKAROUND

def Layout():
	if session.bioGraph is not None:
		# ...
		return dict( url=url, dot=dot )
	else:
		response.flash = "Please import a Graph first !"
		return dict( url="", dot="" )

