#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

from subprocess import Popen, PIPE
from shlex import split
from time import sleep

results = Popen(split("ps aux"), stdout=PIPE).communicate()[0]

def isnumeric(s):
	try:
		int(s)
		return True
	except:
		return False

for result in results.splitlines():
	if result.find("web2py.py --nogui") > -1:
		p = 0
		print result
		while not isnumeric(result[p]):
			p += 1
		q = p
		while isnumeric(result[q]):
			q += 1

		cmd = "kill -s KILL "+result[p:q]
		print cmd
		Popen(split(cmd)).communicate()

