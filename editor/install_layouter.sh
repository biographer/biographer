#!/bin/bash

# cleanup
rm layout -fR

# clone
hg clone https://code.google.com/p/biographer.layout/ --rev experimental layout

# we need only the layout sources
if [ ! -e 'layout' ]; then
	echo 'checkout failed'
	exit 1
	fi
cd layout
rm article example_networks perl pictures -fR
rm .hg* -fR

# resolve dependencies
sudo apt-get update; apt-get install gcc make libjson-glib-dev libcairo2-dev --yes

# build
make

