#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

### parse console arguments ###

import sys, getopt
json_format = 'json'
layouter = 'layouter'
dot = 'dot'
stdout = 'stdout'

def usage():
	print "Usage: standalone.py [--biomodel=123] [--sbml=model.sbml] [--json=model.json] [--output=json|layouter|dot] [--saveto=stdout|<filename>]"
	sys.exit()

if len(sys.argv) < 2:
	usage()

biomodel = None
sbml = None
json = None
output = json
saveto = stdout

opts, args = getopt.getopt(sys.argv[1:], "", ['biomodel=', 'sbml=', 'json=', 'output=', 'saveto='])

for o, a in opts:
	if o == '--biomodel':
		biomodel = int(a)
	elif o == '--sbml':
		sbml = a
	elif o == '--json':
		JSON = a
	elif o == '--output':
		if a in [json_format, layouter, dot]:
			output = a
		else:
			print "Error: Invalid output format '"+a+"'"
			sys.exit(1)
	elif o == '--saveto':
		saveto = a
	else:
		print 'Warning: Ignoring unrecognized parameter "'+o+'".'


### import model ###

from graph import Graph
from defaults import error, info, progress, warning, debug
model = Graph( verbosity=progress )

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

result = None
if output == json_format:
	result = model.exportJSON()
elif output == layouter:
	result = model.export_to_Layouter()
elif output == dot:
	result = model.export_to_graphviz().string()

if result is not None:
	if saveto == stdout:
		print result
	else:
		open(saveto, 'w').write(result)
		print saveto+' saved.'

