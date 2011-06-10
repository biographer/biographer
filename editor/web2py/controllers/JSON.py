# -*- coding: utf-8 -*-

bioJSON = local_import("bioJSON")

def parser():
	if session.JSON.find("{") == -1:
		request.flash = "Please! This is not JSON ..."
	session.bioGraph = bioJSON.Graph( session.JSON )
	request.flash = session.bioGraph.DEBUG
	return dict()

def details():
	return dict()

def recompile():
	return dict()

