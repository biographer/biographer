# -*- coding: utf-8 -*-

def index():
	if session.bioGraph is not None:
		if session.JSON is None or session.JSON == "":
			session.JSON = session.bioGraph.exportJSON()
			# export of SBML or BioPAX is not supported (yet)
	return dict()

