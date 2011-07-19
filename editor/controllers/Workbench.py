# -*- coding: utf-8 -*-

import os

def index():
	if session.bioGraph is not None:
		session.bioGraph.exportJSON()
		session.bioGraph.doBioLayout( os.path.join( request.folder, "static/Layout/build/layout" ) )
	return dict()

