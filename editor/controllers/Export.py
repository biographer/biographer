# -*- coding: utf-8 -*-

def index():
	return redirect(URL(r=request, c="Export", f="JSON"))

def JSON():
	if session.bioGraph is None:
		session.flash = "Unable to export: No Model is loaded !"
		return redirect( URL(r=request, c="Workbench", f="index") )

	content = session.bioGraph.exportJSON()
	IP = response.session_id.split("-")[0]
	filename = IP+".json"
	open(request.folder+"/static/Export/"+filename, "w").write(content)
	return redirect(URL(r=request, c="static", f="Export")+"/"+filename)

def Layout():
	if session.bioGraph is None:
		session.flash = "Unable to export: No Model is loaded !"
		return redirect( URL(r=request, c="Workbench", f="index") )

	content = session.bioGraph.export_to_Layouter()
	IP = response.session_id.split("-")[0]
	filename = IP+".layout"
	open(request.folder+"/static/Export/"+filename, "w").write(content)
	return redirect(URL(r=request, c="static", f="Export")+"/"+filename)

