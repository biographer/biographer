#!/bin/bash

# remove old installation
rm Visualization -f
rm biographer.visualization -fR

# download
hg clone https://code.google.com/p/biographer.visualization/
ln biographer.visualization/target/distribution Visualization -s

# build
cd biographer.visualization
rm .hg* -fR
python src/build/python/manage.py clean build test jslint jsdoc compress createDistribution
