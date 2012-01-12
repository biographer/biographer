# -*- coding: utf-8 -*-

def index():
	return redirect( URL(r=request, c="Export", f="JSON") )

def JSON():
	if session.bioGraph is None:
		session.flash = "Unable to export: No Model is loaded"
		return redirect( URL(r=request, c="Workbench", f="index") )

	return session.bioGraph.exportJSON()

def Layout():
	if session.bioGraph is None:
		session.flash = "Unable to export: No Model is loaded"
		return redirect( URL(r=request, c="Workbench", f="index") )

	return session.bioGraph.export_to_Layouter()

def Picture():
	import os
	from subprocess import Popen, PIPE
	from shlex import split

	formats_supported = ['jpeg', 'png', 'pdf', 'svg', 'tiff', 'eps']

	if session.bioGraph is None:							# Error: no model loaded
		session.flash = "Unable to export: No Model is loaded"
		return redirect( URL(r=request, c="Workbench", f="index") )

	if not request.vars.format in formats_supported:				# Error: format not specified
		session.flash = "Error: No export format specified or format not supported"
		return redirect( URL(r=request, c="Workbench", f="index") )

	if request.vars.svg is None or request.vars.svg == "":				# Error: no input
		session.flash = "Error: No SVG input provided"
		return redirect( URL(r=request, c="Workbench", f="index") )

	if request.vars.format == "svg":
		content = request.vars.svg
	else:
		java = "/usr/bin/java"										# prepare for Java execution
		jar = os.path.join( request.folder, "static/Exporter/svg-export-0.2.jar" )
		applet = java+" -jar "+jar+" -si -so -f "+request.vars.format

		result = Popen(split(applet), stdin=PIPE, stdout=PIPE).communicate(request.vars.svg)		# call Ben's Java Exporter Applet
		content = result[0]	# stdout
		error = result[1]	# stderr
		session.bioGraph.log(error)

	if len(content) > 0:
		return content

	else:
		session.flash = "Exporter failed: No output"
		return redirect( URL(r=request, c="Workbench", f="index") )

