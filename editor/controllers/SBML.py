# -*- coding: utf-8 -*-

biographer = local_import("biographer")

def importer():
	return dict()

def upload():
	session.SBML = request.vars.SBML
	session.bioGraph = biographer.Graph( SBMLinput=session.SBML )
	return redirect("/biographer/Workbench")

