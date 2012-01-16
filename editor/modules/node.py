#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

from copy import deepcopy
from randomid import randomID
import json				# JSON exchange format
import re				# regular expressions, used for graphviz output parsing

from defaults import *
from sbo import *
from data import Data


### Node object definition ###

class Node:
	def __init__(self, JSON=None, defaults=True):			# input may be string or dictionary
		if defaults:
			self.__dict__.update( deepcopy(DefaultNode) )
			# conversion of data dictionary to data object happens below
			# this is necessary, to ensure takeover of the data default values during update

		if JSON is not None:
			if type(JSON) == type(""):
				JSON = json.loads(JSON)			# converts JSON to dictionary
			backup = deepcopy(self.data)			# save it, since it will be overwritten by .update
			self.__dict__.update( deepcopy(JSON) )		# import all input key/value pairs to the python object

			new_data = deepcopy(self.data)			# self.data will be a dictionary
			self.data.update(backup)			# put old data settings back in place
			self.data.update(new_data)			# perform a separate update for data subobject

		if not self.owns('data'):
			self.data = {}
		# in any case, after that self.data will be a dictionary
		# we don't want that, we want to access all parameters in the way node.data.subnodes etc...
		if type(self.data) == type( {} ):
			self.data = Data(self.data)

	def owns(self, key1, key2=None, key3=None):
		if key2 is None:
			return key1 in self.__dict__.keys()
		if key3 is None:
			return self.owns(key1) and self.owns(key2)
		return self.owns(key1) and self.owns(key2) and self.owns(key3)

	def update_from_graphviz_node( self, layout ):
		if not self.owns("data"):
			self.data = Data()

		r = re.compile('[\d\.]+')

		key = 'pos="'
		p = layout.find(key)
		if p == -1:
			return False
		p += len(key)
		q = layout.find('"', p)
		pos = r.findall( layout[p:q] )
		self.data.x = pos[0]
		self.data.y = pos[1]

		key = 'width="'
		p = layout.find(key)
		if p == -1:
			return False
		p += len(key)
		q = layout.find('"', p)
		self.data.width = int( float( r.findall(layout[p:q])[0] ) *70)		# temporary workaround	# future

		key = 'height="'
		p = layout.find(key)
		if p == -1:
			return False
		p += len(key)
		q = layout.find('"', p)
		self.data.height = int( float( r.findall(layout[p:q])[0] ) *70)		# temporary workaround

#		return str(self.id)+" is now at ( "+str(self.data.x)+" | "+str(self.data.y)+" ), width = "+str(self.data.width)+", height = "+str(self.data.height)

	def update_from_graphviz_subgraph( self, layout ):
		if not self.owns("data"):
			self.data = Data()

		p = layout.find('[bb="')	# subgraph bounding box
		if p == -1:
			return False
		p += 5
		q = layout.find('"', p)
		haystack = layout[p:q].split(',')
		if len(haystack) != 4:
			print "skipping bogus subgraph haystack: "+str(haystack)
			return False

		self.data.x = float(haystack[0])
		self.data.y = float(haystack[1])
		self.data.width = float(haystack[2])-self.data.x
		self.data.height = float(haystack[3])-self.data.y

	def exportJSON(self, Indent=DefaultIndent):			# export Node as JSON string
		return json.dumps( self.exportDICT(), indent=Indent )

	def exportDICT(self):
		export = deepcopy(self.__dict__)			# convert self to dictionary
		export['data'] = self.data.exportDICT()
		
		if "edges" in export.keys():
#			del export['edges']
			replacement = []
			for edge in export['edges']:
				replacement.append( edge.id )
			export['edges'] = replacement
		if "connections" in export.keys():
#			del export['connections']
			replacement = []
			for node in export['connections']:
				replacement.append( node.id )
			export['connections'] = replacement
		return export

	def export_to_Layouter(self):
		return {
			'id'		: self.id, \
			'type'		: self.type, \
			'compartment'	: self.data.compartment, \
			'x'		: self.data.x, \
			'y'		: self.data.y, \
			'width'		: self.data.width, \
			'height'	: self.data.height, \
			'direction'	: ''
			}

	def import_from_Layouter(self, layout):
		self.type		= layout['type']
		self.id			= layout['id']
		self.data.compartment 	= layout['compartment']
		self.data.x		= float(layout['x'])
		self.data.y		= float(layout['y'])
		self.data.width		= float(layout['width'])
		self.data.height	= float(layout['height'])

	def check_if_primary_keys_recognized(self, verbosity):
		result = ""

		for key in self.__dict__.keys():
			if not key in ["connections", "edges"]:		# don't check these, they are internal

				if key in NodeKeyAliases.keys():			# is it an alias ...
					renameto = NodeKeyAliases[key]
					self.__dict__[renameto] = self.__dict__[key]
					del self.__dict__[key]
					key = renameto

					if verbosity >= 2:
						result += 'Warning: '+self.id+'.'+key+' renamed to '+self.id+'.'+renameto+'\n'

				if not key in NodeKeys:
					if key in OptionalNodeKeys:			# is it an optional key ...
						self.data.__dict__[key] = self.__dict__[key]
						del self.__dict__[key]
						if verbosity >= 2:
							result += 'Warning: '+self.id+'.'+key+'" moved to '+self.id+'.data.'+key+'\n'
					else:
						if verbosity >= 2:
							result += 'Warning: Ignoring unrecognized Node property "'+key+'"\n'
		return result

	def check_if_data_keys_recognized(self, verbosity):
		result = ""

		for key in self.data.__dict__.keys():

			if key in NodeKeyAliases.keys():				# is it an alias ...
				renameto = NodeKeyAliases[key]
				self.data.__dict__[renameto] = self.data.__dict__[key]
				del self.data.__dict__[key]

				if verbosity >= 2:
					result += 'Warning: '+self.id+'.data.'+key+' renamed to '+self.id+'.data.'+renameto+'\n'
				key = renameto

			if not key in OptionalNodeKeys:					# it does not belong here
				if key == 'id':
					if not self.owns('id'):
						self.id = self.data.id
						self.data.id = randomID()
						if verbosity >= 2:
							result += 'Warning: Parent lacks id. '+self.id+'.data.id moved to '+self.id+'.id\n'

				elif key in NodeKeys:					# is it a mandatory key ...
					self.__dict__[key] = self.data.__dict__[key]
					del self.data.__dict__[key]
					if verbosity >= 2:
						result += 'Warning: '+self.id+'.data.'+key+' moved to '+self.id+'.'+key+'\n'
				else:
					if verbosity >= 2:
						result += 'Warning: Ignoring unrecognized optional Node property "'+key+'"\n'
		return result

	def check_mandatory_keys(self, verbosity):
		result = ''

		for key in MandatoryNodeKeys:
			if not self.owns(key):
				if verbosity >= 1:
					result += 'Error: '+self.id+'.'+key+' undefined but mandatory. Expect global failure !\n'

		return result

	def check_visual_properties(self, verbosity):
		result = ""

		if self.data.owns("x"):
			self.data.x = float(self.data.x)
		if self.data.owns("y"):
			self.data.y = float(self.data.y)
		if self.data.owns("width"):
			self.data.width = float(self.data.width)
		if self.data.owns("height"):
			self.data.height = float(self.data.height)

		return result

	def selfcheck(self, verbosity=1):				# perform some integrity checks
		result = ""

		result += self.check_if_primary_keys_recognized(verbosity)
		result += self.check_if_data_keys_recognized(verbosity)
		result += self.check_mandatory_keys(verbosity)
		result += self.check_visual_properties(verbosity)

		return result

