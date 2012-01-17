#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

# wrapper for layout sub-project

def layout(graph, path_to_layout_binary, execution_folder='/tmp'):

	import os
	from subprocess import Popen
	from shlex import split
	from time import time, sleep
	from defaults import info, error

	if not os.path.exists(path_to_layout_binary):
		graph.log(error, "Fatal: layout binary not found.")
		return False

	infile = os.path.join(execution_folder, 'layout.infile')
	outfile = os.path.join(execution_folder, 'layout.outfile')

	open(infile, 'w').write( graph.export_to_Layouter() )
	if os.path.exists(outfile):
		os.remove(outfile)

	graph.log(info, "Now executing the layouter: "+path_to_layout_binary)
	graph.log(info, "in "+execution_folder+" ...")

	timeout = 120
	start = time()									# start a timer
	process = Popen( split(path_to_layout_binary+' '+infile+' '+outfile) )		# run layout binary
	graph.log(info, "Executable started. Timeout is set to "+str(timeout)+" seconds. Waiting for process to complete ...")
	runtime = 0
	while (process.poll() is None) and (runtime < timeout):				# wait until timeout
		sleep(1)
		runtime = time()-start
		graph.log(info, "Runtime is now: "+str(int(runtime))+" seconds")

	if runtime < timeout:
		graph.log(info, path_to_layout_binary+" finished.")
	else:
		graph.log(info, "Sorry, process timed out.")
		process.kill()
		return False

	if os.path.exists(outfile):
		graph.log(info, 'Output found in '+outfile)
	else:
		graph.log(error, 'Outfile not found: '+outfile)
		return False

	graph.import_from_Layouter( open(outfile).read() )
	os.remove(outfile)
	os.remove(infile)

	graph.log(info,"Layouting completed successfully.")

