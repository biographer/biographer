#!/usr/bin/env python
# -*- coding: iso-8859-15 -*-

from jpype import *
paxtools = "/usr/lib/paxtools.jar"

# start Java Virtual Machine
startJVM(getDefaultJVMPath(), "-ea","-Djava.class.path="+paxtools)

paxtools = JPackage("org.biopax.paxtools")
javaIO = JPackage("java.io")

# export to BioPAX OWL
io = paxtools.io.SimpleIOHandler( paxtools.model.BioPAXLevel.L3 )

# read from file
fileIS = javaIO.FileInputStream("caspase_pathway.biopax")
model = io.convertFromOWL(fileIS)

# get all proteins, example:
#<bp:protein rdf:ID="pid_m_200229" >
#  <bp:ORGANISM rdf:resource="#Homo_sapiens" />
#  <bp:DATA-SOURCE rdf:resource="#PID_DataSource" />
#  <bp:NAME rdf:datatype="http://www.w3.org/2001/XMLSchema#string">Gelsolin (cleaved)</bp:NAME>
#  <bp:XREF rdf:resource="#pid_b_200229_201653" />
#  <bp:XREF rdf:resource="#pid_b_200229_201652" />
#</bp:protein>

io.convertToOWL(model, java.lang.System.out)

# Shutdown Java Virtual Machine
shutdownJVM() 

