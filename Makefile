.PHONY=all bui layout editor

all: tbui tlayout teditor
tbui: 
	$(MAKE) -C bui
tlayout: 
	$(MAKE) -C flowlayout
teditor:
	$(MAKE) -C editor


