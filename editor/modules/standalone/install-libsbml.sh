#!/bin/bash

apt-get update
apt-get install subversion libxml2-dev make g++ gcc -y

svn co http://sbml.svn.sourceforge.net/viewvc/sbml/tags/rel-4-3-1/ libsbml
cd libsbml
./configure --with-python
make
make install

