#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

def BioModel_to_cache(SBML, ID):
	global db

	key = 'name="'
	p = SBML.find(key)
	if p > -1:
		p += len(key)
		q = SBML.find('"',p)
		title = SBML[p:q].replace("_"," ")

		if len( db( db.BioModels.BIOMD==ID ).select() ) == 0:
			db.BioModels.insert( BIOMD=ID, Title=title, File=SBML )

def BioModel_from_cache( BioModelID ):
	global db

	select = db( db.BioModels.BIOMD==BioModelID ).select()

	if len( select ) == 1:
		return select.File
	else:
		return None

def Reactome_to_cache(SBML, ID):
	global db

	key = 'name="'
	p = SBML.find(key)
	if p > -1:
		p += len(key)
		q = SBML.find('"',p)
		title = SBML[p:q].replace("_"," ")

		if len( db( db.Reactome.ST_ID==ID ).select() ) == 0:
			db.Reactome.insert( ST_ID=ID, Title=title, File=SBML )

def Reactome_from_cache( ReactomeStableIdentifier ):
	global db

	select = db( db.Reactome.ST_ID==ReactomeStableIdentifier ).select()

	if len( select ) == 1:
		return select.File
	else:
		return None

