# SBO terms and types #

## UI ##
  * the terms, the UI understands, are defined as the proper ones
  * see [sboMappings.js](http://code.google.com/p/biographer/source/browse/src/main/javascript/sboMappings.js?repo=visualization)

## Layouter ##

  * concerning SBO terms, the Layouter is much more basic
  * the terms understood are defined in [types.h](http://code.google.com/p/biographer/source/browse/src/types.h?repo=layout)
  * the translation layouter2global and global2layouter is done by the server, see [sbo.py](http://code.google.com/p/biographer/source/browse/modules/sbo.py?repo=server)

## Server ##

The server obeys the global definitions. They are imported from the UI's [sboMappings.js](http://code.google.com/p/biographer/source/browse/src/main/javascript/sboMappings.js?repo=visualization) by [sbo.py](http://code.google.com/p/biographer/source/browse/modules/sbo.py?repo=server)