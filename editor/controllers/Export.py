# -*- coding: utf-8 -*-

def index():
	return redirect(URL(r=request, c="Export", f="JSON"))

def JSON():
	return dict()

def SBML():
	return dict()

def BioPAX():
	return dict()

