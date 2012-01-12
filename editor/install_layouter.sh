#!/bin/bash

# cleanup
rm Layouter -fR

# clone
hg clone https://code.google.com/p/biographer.layout/ --rev experimental Layouter
cp Layouter.Makefile Layouter/Makefile

# we don't need the pictures
cd Layouter
rm pictures -fR
rm .hg* -fR

# build
apt-get install gcc make libjson-glib-dev --yes
make
