#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

### parse console arguments ###

import sys, getopt
json = 'json'
layouter = 'layouter'
dot = 'dot'

def usage():
	print "Usage: standalone.py [--biomodel=123] [--sbml=model.sbml] [--json=model.json] [--output=json|layouter|dot]"
	sys.exit()

if len(sys.argv) < 2:
	usage()

biomodel = None
sbml = None
json = None
output = json

opts, args = getopt.getopt(sys.argv[1:], "", ['biomodel=', 'sbml=', 'json=', 'output='])

for o, a in opts:
	if o == '--biomodel':
		biomodel = int(a)
	elif o == '--sbml':
		sbml = a
	elif o == '--json':
		json = a
	elif o == '--output':
		if a in [json, layouter, dot]:
			output = a
		else:
			print "Error: Invalid output format '"+a+"'"
			sys.exit(1)
	else:
		print 'Warning: Ignoring unrecognized parameter "'+o+'".'


### import model ###

from graph import Graph
from defaults import info, error, warning, debug
model = Graph( verbosity=info )

if sbml is not None:
	sbml = open(sbml).read()

elif biomodel is not None:
	from biomodels import download_BioModel
	print 'Downloading BioModel BIOMD'+str(biomodel).rjust(10, '0')+' ...'
	sbml = download_BioModel( biomodel )
	if sbml is None:
		print 'BioModel '+str(biomodel)+': no model associated'
		sys.exit()

if sbml is not None:
	model.importSBML( sbml )

elif json is None:
	json = open(json).read()
	mode.importJSON( json )

else:
	usage()


### export model ###

if output == json:
	print model.exportJSON()
elif output == layouter:
	print model.export_to_Layouter()
elif output == dot:
	print model.export_to_graphviz().string()

