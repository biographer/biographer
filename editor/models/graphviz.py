#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

# wrapper for graphviz

def mkdir_and_parents( path ):
	import os

	fullpath = ""
	for part in path.split("/"):
		fullpath += part+"/"
		if (len(fullpath) > 1) and (not os.path.exists(fullpath)):
			os.mkdir(fullpath)

def layout_using_graphviz(graph, execution_folder="/tmp", image_output_folder="/tmp", algorithm="dot"):

	import os, pygraphviz
	from defaults import info

	mkdir_and_parents(execution_folder)
	mkdir_and_parents(image_output_folder)

	graphviz_model = graph.export_to_graphviz()

	graph.log(info, "Executing graphviz ...")

	out_filename = graph.MD5+".svg"
	out = os.path.join(image_output_folder, out_filename)
	if os.path.exists(out):
		os.remove(out)

#	graphviz_model.dpi = 70;
	graphviz_model.layout( prog=algorithm )
	graphviz_model.draw( out )
	graph.graphviz_layout = graphviz_model.string()
	graph.log(info, "graphviz completed.")

	graph.import_from_graphviz( graph.graphviz_layout )

	return out_filename

