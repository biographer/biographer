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
fileIS = javaIO.FileInputStream("biopax-level3.owl")
model = io.convertFromOWL(fileIS)

io.convertToOWL(model, java.lang.System.out)

# Shutdown Java Virtual Machine
shutdownJVM() 

