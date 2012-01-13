#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

# wrapper for layout sub-project

def layout(graph, path_to_layout_binary, execution_folder='/tmp'):

	import os
	from subprocess import Popen
	from shlex import split

	infile = os.path.join(execution_folder, 'layout.infile')
	outfile = os.path.join(execution_folder, 'layout.outfile')

	graph.log("Now executing the layouter: "+path_to_layout_binary)
	graph.log("in "+execution_folder+" ...")

	open(infile, 'w').write( graph.export_to_Layouter() )
	os.path.delete(outfile)

	timeout = 30
	start = time()									# start a timer
	process = Popen( split(path_to_layout_binary) )					# run layout binary
	graph.log("Executable started. Waiting for process to complete ...")
	runtime = 0
	while (layouter.poll is None) and (runtime < timeout):				# wait until timeout
		sleep(2)
		runtime = time()-start
		graph.log("Timeout is set to "+str(timeout)+"s. Runtime is now: "+str(runtime)+"s.")

	if runtime < timeout:
		graph.log(path_to_layout_binary+" finished.")
	else:
		graph.log("Sorry, process timed out.")
		return False

	graph.import_from_Layouter( open(outfile).read() )
	os.path.delete(outfile)
	os.path.delete(infile)

	graph.log("Layouting completed successfully.")

