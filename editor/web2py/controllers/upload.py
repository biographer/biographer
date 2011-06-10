# -*- coding: utf-8 -*-

def upload():
	if request.vars.File or request.vars.JSON:
		if request.vars.Type == "ODP":
			session.ODP = request.vars.ODP
			return redirect(URL(r=request,c="ODP",f="importer"))
		elif request.vars.Type == "JSON":
			session.JSON = request.vars.JSON
			return redirect(URL(r=request,c="JSON",f="parser"))
	response.flash = "Come on! Give me some JSON!"
	return dict()

def help():
	return dict()
