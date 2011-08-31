#!/bin/bash

# cleanup
rm Layouter -fR

# download
hg clone https://code.google.com/p/biographer.layout/ Layouter

# we don't need pictures
cd Layouter
rm pictures -fR
rm .hg* -fR

# build
apt-get install gcc make libjson-glib-dev --yes
make
