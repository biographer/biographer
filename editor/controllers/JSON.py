# -*- coding: utf-8 -*-

import sys
sys.path.append("/var/www/web2py/applications/biographer/modules")
import biographer

def importer():
	return dict()

def load():
	reload(biographer)
	session.JSON = request.vars.File.file.read()
	session.bioGraph = biographer.Graph( JSON = session.JSON )
	session.flash= request.vars.File.filename+" uploaded and parsed"
	return redirect( URL(r=request, c="Workbench", f="index") )

def details():
	return dict()

