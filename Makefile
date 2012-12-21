PREFIX=build/
# web2py port 
PORT=8002
# port for layout webservice
LYPORT=8099
CUR=$(shell pwd)
TDIR := $(CUR)/$(PREFIX)
ABSPREFIX=$(shell readlink -f $(TDIR))
.PHONY=all bui layout editor

all: tbui tlayout teditor
tbui: 
	$(MAKE) -C bui
tlayout: 
	$(MAKE) -C flowlayout
teditor:
	$(MAKE) -C editor
installlinux: all
	@echo installing into $(PREFIX) ...
	@echo $(TDIR)
	
	# create necessary directories
	test -e $(PREFIX) ||  mkdir $(PREFIX)
	test -e $(PREFIX)/applications ||  mkdir $(PREFIX)/applications
	test -e $(PREFIX)/applications/biographer ||  mkdir $(PREFIX)/applications/biographer
	test -e $(PREFIX)/flowlayout ||  mkdir $(PREFIX)/flowlayout
	
	# copy application to PREFIX
	cp flowlayout/build/layout $(PREFIX)/flowlayout
	cp flowlayout/webservice/flow-serve.py $(PREFIX)/flowlayout
	cp -a editor/* $(PREFIX)/applications/biographer
	
	# adapt index.html to query local flow-layout webservice
	cat editor/views/default/index.html | sed 's/url_layout.*/url_layout : \"http:\/\/localhost:$(LYPORT)\/layout\",/' >$(PREFIX)/applications/biographer/views/default/index.html
	# adapt start.sh to PORTs
	cat start.in | sed 's/W2PORT/$(PORT)/' | sed 's/LYPORT/$(LYPORT)/' | sed 's#PATH#$(ABSPREFIX)#'> $(PREFIX)/start.sh
	chmod +x $(PREFIX)/start.sh # make start.sh executable
	
