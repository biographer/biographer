# -*- coding: utf-8 -*-

def index():
	return redirect( URL(r=request, c="Import", f="BioModels") )


def JSON():
	if request.env.request_method == "GET":
		return dict()

	if request.env.request_method == "POST":
		if request.vars.File != "":					# a file was uploaded
			session.JSON = request.vars.File.file.read()
			session.flash = request.vars.File.filename+" retrieved and parsed."
		else:								# the example JSON was requested
			session.JSON = open( os.path.join(request.folder, "static/examples/apoptosis_biom220_reacp.xjson") ).read()
			session.flash = "Example JSON loaded."

		import_JSON( session.JSON )					# import JSON

		return redirect( URL(r=request, c="Layout", f="graphviz") )


def JSONdebug():								# function: show JSON details
	return dict()


def SBML():
	if request.env.request_method == "GET":
		return dict()

	if request.env.request_method == "POST":
		session.JSON = ""
		if request.vars.File != "":					# a file was uploaded
			session.SBML = request.vars.File.file.read()
			session.flash = "SBML uploaded."
		else:								# the example was requested
			session.SBML = open( os.path.join(request.folder, "static/examples/reactome.sbml") ).read()
			session.flash = "Example SBML loaded."

		import_SBML( session.SBML )					# import SBML

		Layouter = request.vars.Layouter				# goto selected Layouter page
		if Layouter == "ask":
			return redirect( URL(r=request,c='Layout',f='choose') )
		if Layouter == "internal":
			return redirect( URL(r=request,c='Layout',f='internal') )
		if Layouter == "graphviz":
			return redirect( URL(r=request,c='Layout',f='graphviz') )

		return redirect( URL(r=request, c="Layout", f="graphviz") )


def BioModels():

	if (request.env.request_method == "POST") or (request.vars.BioModelsID is not None):	# allows direct calls like /biographer/Import/BioModel?BioModelsID=220

		if not import_BioModel( request.vars.BioModelsID ):
			session.flash = 'BioModel import failed. See web2py log for details.'
			return redirect( URL(r=request, c='Workbench', f='index') )

		if type(request.vars.returnto) == type([]):			# evaluate returnto parameters
			returnto = str(request.vars.returnto[0])
		else:
			returnto = str(request.vars.returnto)
		if (returnto is not None) and (returnto != ""):
			return redirect( returnto )

		Layouter = request.vars.Layouter				# a Layouter was chosen
		if Layouter == "ask":
			return redirect( URL(r=request,c='Layout',f='choose') )
		if Layouter == "internal":
			return redirect( URL(r=request,c='Layout',f='internal') )
		if Layouter == "graphviz":
			return redirect( URL(r=request,c='Layout',f='graphviz') )

		return redirect( URL(r=request, c='Workbench', f='index') )	# else: goto Workbench

	if request.env.request_method == "GET":

		session.PreviousBioModels = db( db.BioModels.Title != None ).select()

		return dict( returnto=request.vars.returnto )


def Reactome():
	if request.env.request_method == "GET":
		return dict()

	if request.env.request_method == "POST":

		if not import_Reactome( request.vars.ST_ID ):
			session.flash = 'Reactome import failed. See web2py log for details.'
			return redirect( URL(r=request, c='Workbench', f='index') )

		Layouter = request.vars.Layouter				# a Layouter was chosen
		if Layouter == "ask":
			return redirect( URL(r=request,c='Layout',f='choose') )
		if Layouter == "internal":
			return redirect( URL(r=request,c='Layout',f='internal') )
		if Layouter == "graphviz":
			return redirect( URL(r=request,c='Layout',f='graphviz') )

		return redirect( URL(r=request, c='Workbench', f='index') )	# else: goto Workbench

def BooleanNet():
	if request.env.request_method == "GET":
		return dict()

	if request.env.request_method == "POST":

		reset_current_session()
		if request.vars.File == '':
			session.bioGraph.importBooleanNet( open('/home/Master/Network/Whi2p.boolenet').read() )
		else:
			session.bioGraph.importBooleanNet( request.vars.File.file.read() )

		Layouter = request.vars.Layouter				# a Layouter was chosen
		if Layouter == "ask":
			return redirect( URL(r=request,c='Layout',f='choose') )
		if Layouter == "internal":
			return redirect( URL(r=request,c='Layout',f='internal') )
		if Layouter == "graphviz":
			return redirect( URL(r=request,c='Layout',f='graphviz') )

		return redirect( URL(r=request, c='Workbench', f='index') )	# else: goto Workbench

