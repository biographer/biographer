# -*- coding: utf-8 -*-

biographer = local_import("biographer")

def importer():
	return dict()

def load():
	session.JSON = request.vars.JSON
	session.bioGraph = biographer.Graph()
	session.bioGraph.importJSON( JSON=session.JSON )
	return redirect("/biographer/JSON/details")

def details():
	return dict()

