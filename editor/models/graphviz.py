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

def layout_using_graphviz(graph, execution_folder="/tmp", png_output_folder="/tmp", algorithm="dot"):

	import os, pygraphviz

	mkdir_and_parents(execution_folder)
	mkdir_and_parents(png_output_folder)

	graphviz_model = graph.export_to_graphviz()

	graph.log("Executing graphviz ...")

	png_filename = graph.MD5+".png"
	png = os.path.join(png_output_folder, png_filename)
	if os.path.exists(png):
		os.remove(png)

	graphviz_model.dpi = 70;
	graphviz_model.layout( prog=algorithm )
	graphviz_model.draw( png )
	graph.graphviz_layout = graphviz_model.string()
	graph.log("graphviz completed.")

	graph.import_from_graphviz( graph.graphviz_layout )

	return png_filename

