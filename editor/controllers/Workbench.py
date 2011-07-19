# -*- coding: utf-8 -*-

def index():
	if session.bioGraph is not None:
		session.bioGraph.exportJSON()
	return dict()

def BioLayout():
	return dict()

def JSON():
	return dict()
