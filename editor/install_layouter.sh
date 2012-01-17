#!/bin/bash

# cleanup
rm layout -fR

# clone
hg clone --rev c2f3bf5d6985 https://code.google.com/p/biographer.layout/ --rev experimental layout

# we need only the layout sources
cd layout
rm article example_networks perl pictures -fR
rm .hg* -fR

# resolve dependencies
apt-get update
apt-get install gcc make libjson-glib-dev libcairo2-dev --yes

# build
make

