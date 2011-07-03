# -*- coding: utf-8 -*-

import biographer

def importer():
	return dict()

def upload():
	session.SBML = request.vars.SBML
	session.bioGraph = biographer.Graph( SBMLinput=session.SBML )
	del session.bioGraph.SBML
	return redirect(URL(r=request,c='Workbench',f='index'))

