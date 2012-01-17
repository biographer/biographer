#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

def download_Reactome( ReactomeStableIdentifier ):

	import httplib

	connection = httplib.HTTPConnection("www.reactome.org")
	connection.request("GET", '/cgi-bin/eventbrowser_st_id?ST_ID='+ReactomeStableIdentifier, None, {"Cookie":"ClassicView=1"} )
	page = connection.getresponse().read()

	p = page.find('/cgi-bin/sbml_export?')
	if p > -1:
		q = page.find('"', p)
		connection.request("GET", page[p:q])					# download SBML
		return connection.getresponse().read()

	if page.find('has been updated in the most recent release of Reactome') > -1:

		print 'This Reactome model is superseded.'

		key = '="eventbrowser_st_id?ST_ID='
		p = page.find(key)+len(key)
		q = page.find('"', p)
		new_RSI = page[p:q]
		if new_RSI.find('REACT_') == 0:
			print 'New RSI is '+new_RSI+'.'
			return download_Reactome( new_RSI )

	return None
