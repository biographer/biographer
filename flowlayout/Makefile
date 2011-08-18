CC=g++
XINC=-Isrc
CCFLAGS=-fPIC -g -O0 -Wall -fno-rtti $(XINC) -DPROGRESSLINUX -DUSEJSON `pkg-config --cflags glib-2.0 json-glib-1.0` -lglib-2.0 -ljson-glib-1.0
#CCFLAGS=-fPIC -g -O0 -Wall -fno-rtti $(XINC) -DUSEJSON `pkg-config --cflags glib-2.0`  -lglib-2.0 -rpath=/local/home/handorf/lib -I/local/home/handorf/hg/biographer-layout/json-glib-0.12.6/ -L/local/home/handorf/lib -ljson-glib-1.0
#CCFLAGS=-fPIC -g -O0 -Wall -fno-rtti $(XINC)
SRC=src/
BDIR=build/
VPATH=$(SRC):$(BDIR)

default: dolayout.cpp network.o layout.o functions.o
	$(CC) $(CCFLAGS) $(BDIR)network.o $(BDIR)layout.o $(BDIR)functions.o -o $(BDIR)layout $<
json:	layout_json.cpp network.o layout.o functions.o
	$(CC) $(CCFLAGS) $(BDIR)network.o $(BDIR)layout.o $(BDIR)functions.o -o $(BDIR)layoutJson $<
network.o: network.cpp network.h headers.h edge.h node.h
	$(CC) -o $(BDIR)network.o $(CCFLAGS) -c $<
layout.o: layout.cpp network.h headers.h edge.h node.h
	$(CC) -o $(BDIR)layout.o $(CCFLAGS) -c $<
functions.o: functions.cpp functions.h headers.h
	$(CC) -o $(BDIR)functions.o $(CCFLAGS) -c $<	
test: layout_test.cpp network.o layout.o functions.o
	$(CC) $(CCFLAGS) $(BDIR)network.o $(BDIR)layout.o $(BDIR)functions.o -o $(BDIR)test $<
