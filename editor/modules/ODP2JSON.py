#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

# input parameters

import sys, os, zipfile

try:
	infile = sys.argv[1]				# parameter
except:
	print "no input file specified"
	sys.exit(1)

if not ( os.path.exists(infile) and os.path.isfile(infile) ):	# exists ?
	print "input file not found"
	sys.exit(1)

if not zipfile.is_zipfile(infile): 			# valid zipfile ?
	print "not a valid zip file"
	sys.exit(1)

ODP = zipfile.ZipFile(infile)
if ODP.namelist().index("content.xml") < 0: 		# valid ODP ?
	print "content.xml not found"
	sys.exit(1)

# output file exists ?

outfile = infile.replace(".odp",".json").replace(".ODP",".json")	# generate filename for output

#if os.path.exists( outfile ):
#	print "warning: outfile will be overwritten. press enter to confirm, ctrl+c to quit"
#	readline()

# unzip content.xml from odp

content = ODP.open("content.xml","r").read()		# read content.xml from ODP

# work with content

from decimal import *
import bioJSON

def findEPNs( content ):			# find boxes
	nodes = []

	mainkey = "<draw:custom-shape"				
	labelkey = "<text:p "
	xkey = 'svg:x="'
	ykey = 'svg:y="'
	widthkey = 'svg:width="'
	heightkey = 'svg:height="'

	p = content.find(mainkey)
	while p > -1:
		q = content.find(">",p)
		element = content[p:q]
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
		nodes.append( { 'id':ID, 'data':{'x':x, 'y':y, 'width':width, 'height':height, 'label':label} } )
		p = content.find(mainkey,q)
	return nodes

def findEdges( content ):			# find arrows
#	...
	return None

print findEPNs( content )
