#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

from decimal import *
import os, zipfile

### das hier ist sehr brute force
### veraltet!
### use python-odf instead

class ODP:
	def __init__(self, filename=None):
		self.DEBUG = ""
		if filename is not None:
			self.loadODP( filename )

	def empty(self):
		self.Nodes = []
		self.Edges = []

	def loadODP(self, filename):

		if not ( os.path.exists(filename) and os.path.isfile(filename) ):	# exists ?
			self.DEBUG += "input file not found\n"
			return False

		if not zipfile.is_zipfile(filename): 					# valid zipfile ?
			self.DEBUG += "not a valid zip file\n"
			return False

		self.zip = zipfile.ZipFile(filename)
		if self.zip.namelist().index("content.xml") < 0:	 		# valid ODP ?
			self.DEBUG += "content.xml not found\n"
			return False

		self.filename = filename
		self.content = self.zip.open("content.xml","r").read()			# read content.xml from ODP
		self.parse()

	def parse(self):								# parse content.xml to find boxes
		self.empty()

		mainkey = "<draw:custom-shape"				
		labelkey = "<text:p "
		xkey = 'svg:x="'
		ykey = 'svg:y="'
		widthkey = 'svg:width="'
		heightkey = 'svg:height="'

		p = self.content.find(mainkey)
		while p > -1:
			q = self.content.find(">",p)
			element = self.content[p:q]
			# id ....
			ID		= 0
			# ...
			r		= element.find(xkey)+len(xkey)
			x		= 	Decimal(element[r:element.find('"',r)].replace("cm",""))
			r		= element.find(ykey)+len(ykey)
			y		= 	Decimal(element[r:element.find('"',r)].replace("cm",""))
			r		= element.find(widthkey)+len(widthkey)
			width		= 	Decimal(element[r:element.find('"',r)].replace("cm",""))
			r		= element.find(heightkey)+len(heightkey)
			height		= 	Decimal(element[r:element.find('"',r)].replace("cm",""))
			r		= content.find(labelkey, q)
			label		= 	content[content.find(">",r)+1:content.find("<",r+1)]
			self.Nodes.append( { 'id':ID, 'data':{'x':x, 'y':y, 'width':width, 'height':height, 'label':label} } )
			p = self.content.find(mainkey,q)

	def export(self):								# insert boxes and arrows into template ODP

		template = "/var/www/web2py/applications/biographer/modules/template.odp"	# is a directory! (unzipped ODP for better editing)

		self.content = template+"/content.xml"	# open template
		
		# make a ZIP-file and rename it to ".odp"
		
		return "blablabla"

	def saveas(self, filename):
		open( filename, "w" ).write( self.export() )


