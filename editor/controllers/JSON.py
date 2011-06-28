# -*- coding: utf-8 -*-

biographer = local_import("biographer")

def importer():
	return dict()

def upload():
	session.JSON = request.vars.JSON
	session.bioGraph = biographer.Graph( JSONinput=session.JSON )
	return redirect("/biographer/Workbench")

def details():
	return dict()

