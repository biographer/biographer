CC=g++
XINC=-Isrc
#CCFLAGS=-fPIC -g -O0 -Wall -fno-rtti $(XINC) -DPROGRESSLINUX -DUSEJSON `pkg-config --cflags glib-2.0 json-glib-1.0` -lglib-2.0 -ljson-glib-1.0
#CCFLAGS=-fPIC -g -O0 -Wall -fno-rtti $(XINC) -DUSEJSON `pkg-config --cflags glib-2.0`  -lglib-2.0 -rpath=/local/home/handorf/lib -I/local/home/handorf/hg/biographer-layout/json-glib-0.12.6/ -L/local/home/handorf/lib -ljson-glib-1.0
CCFLAGS=-fPIC -g -O0 -Wall -fno-rtti $(XINC) -DPROGRESSLINUX -DSHOWPROGRESS `pkg-config --cflags cairo` -lcairo
SRC=src/
BDIR=build/
VPATH=$(SRC):$(BDIR)

default: dolayout.cpp reactionlayout.cpp network.o layout.o functions.o plugins.o netdisplay.o
	$(CC) $(CCFLAGS) $(BDIR)network.o $(BDIR)layout.o $(BDIR)functions.o $(BDIR)plugins.o $(BDIR)netdisplay.o -o $(BDIR)layout $<
#json:	layout_json.cpp network.o layout.o functions.o
#	$(CC) $(CCFLAGS) $(BDIR)network.o $(BDIR)layout.o $(BDIR)functions.o -o $(BDIR)layoutJson $<
network.o: network.cpp network.h types.h
	$(CC) -o $(BDIR)network.o $(CCFLAGS) -c $<
layout.o: layout.cpp plugins.h layout.h functions.h network.h types.h defines.h
	$(CC) -o $(BDIR)layout.o $(CCFLAGS) -c $<
functions.o: functions.cpp functions.h types.h defines.h
	$(CC) -o $(BDIR)functions.o $(CCFLAGS) -c $<	
plugins.o: plugins.cpp plugins.h layout.h functions.h network.h types.h defines.h
	$(CC) -o $(BDIR)plugins.o $(CCFLAGS) -c $<
netdisplay.o: netdisplay.cpp netdisplay.h network.h types.h
	$(CC) -o $(BDIR)netdisplay.o $(CCFLAGS) -c $<

#test: layout_test.cpp network.o layout.o functions.o
#	$(CC) $(CCFLAGS) $(BDIR)network.o $(BDIR)layout.o $(BDIR)functions.o -o $(BDIR)test $<
#
dist_edges: test_dist_edges.cpp default
	$(CC) $(CCFLAGS) $(BDIR)network.o $(BDIR)layout.o $(BDIR)functions.o $(BDIR)plugins.o $(BDIR)netdisplay.o -o $(BDIR)test_dist_edges $<
rea_torque: test_rea_torque.cpp default
	$(CC) $(CCFLAGS) $(BDIR)network.o $(BDIR)layout.o $(BDIR)functions.o $(BDIR)plugins.o $(BDIR)netdisplay.o -o $(BDIR)test_rea_torque $<
min_cross: test_min_cross.cpp default
	$(CC) $(CCFLAGS) $(BDIR)network.o $(BDIR)layout.o $(BDIR)functions.o $(BDIR)plugins.o $(BDIR)netdisplay.o -o $(BDIR)test_min_cross $<