# -*- coding: utf-8 -*-

# TEMPORARY BUG WORKAROUND
import sys
hardcoded = "/var/www/web2py/applications/biographer/modules"
if not hardcoded in sys.path:
	sys.path.append(hardcoded)
import biographer
reload(biographer)
# END WORKAROUND

def importer():
	return dict()

def upload():
	example = "/var/www/web2py/applications/biographer/doc/demograph/demograph.odp"	# hardcoded example
	if session.bioGraph is None:
		session.bioGraph = biographer.Graph()
	session.bioGraph.importfile( example )
	return redirect( URL(r=request, c='Workbench', f='index') )

