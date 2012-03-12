#!/bin/bash

# remove old installation
cd static
rm Visualization -fR
rm biographer.visualization -fR

# download
hg clone --rev ce0138fb634d https://code.google.com/p/biographer.visualization/
if [ ! -e 'biographer.visualization' ]; then
	echo 'checkout failed'
	exit 1
	fi
ln biographer.visualization/target/distribution Visualization -s
cd biographer.visualization
rm .hg* -fR

# resolve dependencies
sudo apt-get update; apt-get install libnode-uglify nodejs --yes

# build
python src/build/python/manage.py clean build test jslint jsdoc compress createDistribution

