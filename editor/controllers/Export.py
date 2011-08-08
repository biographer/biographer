# -*- coding: utf-8 -*-

import os
from subprocess import Popen, PIPE
from shlex import split

def index():
	return redirect(URL(r=request, c="Export", f="JSON"))				# default behaviour: export JSON

def JSON():
	if session.bioGraph is None:
		session.flash = "Unable to export: No Model is loaded !"
		return redirect( URL(r=request, c="Workbench", f="index") )

	content = session.bioGraph.exportJSON()						# export JSON

	IP = response.session_id.split("-")[0]
	filename = IP+".json"
	open(request.folder+"/static/Export/"+filename, "w").write(content)		# save it to file

	return redirect(URL(r=request, c="static", f="Export")+"/"+filename)		# pass the file to the client

def Layout():
	if session.bioGraph is None:
		session.flash = "Unable to export: No Model is loaded !"
		return redirect( URL(r=request, c="Workbench", f="index") )

	content = session.bioGraph.export_to_Layouter()					# export Layout

	IP = response.session_id.split("-")[0]
	filename = IP+".layout"
	open(request.folder+"/static/Export/"+filename, "w").write(content)		# save it to file

	return redirect(URL(r=request, c="static", f="Export")+"/"+filename)		# pass the file to the client

def Picture():
	formats_supported = ['jpeg', 'png', 'pdf', 'svg', 'tiff', 'eps']

	print "Hi!"

#	if session.bioGraph is None:
#		session.flash = "Unable to export: No Model is loaded !"
#		return redirect( URL(r=request, c="Workbench", f="index") )

	if not request.vars.format in formats_supported:				# Error: format not specified
		session.flash = "No export format specified or format not supported !"
		return redirect( URL(r=request, c="Workbench", f="index") )

	if request.vars.svg is None or request.vars.svg == "":				# Error: no input
		session.flash = "Unable to export: No SVG input provided !"
		return redirect( URL(r=request, c="Workbench", f="index") )

	if request.vars.format == "svg":
		content = request.vars.svg
	else:
		java = "/usr/bin/java"										# prepare for Java execution
		jar = os.path.join( request.folder, "static/Exporter/svg-export-0.2.jar" )
		applet = java+" -jar "+jar+" -si -so -f "+request.vars.format

		content = Popen(split(applet), stdin=PIPE, stdout=PIPE).communicate(request.vars.svg)[0]	# call Ben's Java Exporter Applet

	if len(content) > 0:
		IP = response.session_id.split("-")[0]						# save output to file
		filename = IP+"."+request.vars.format
		open(request.folder+"/static/Exporter/"+filename, "w").write(content)

		return redirect(URL(r=request, c="static", f="Exporter")+"/"+filename)		# pass file to the client

	else:
		session.flash = "Exporter failed: No output !"					# no content? what happened?
		return redirect(URL(r=request, c="Workbench", f="index"))


