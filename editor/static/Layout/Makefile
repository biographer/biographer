CC=g++
XINC=-Isrc
CCFLAGS=-fPIC -g -O0 -Wall -fno-rtti $(XINC)
SRC=src/
BDIR=build/
VPATH=$(SRC):$(BDIR)

default: layout_test2.cpp network.o layout.o functions.o
	$(CC) $(CCFLAGS) $(BDIR)network.o $(BDIR)layout.o $(BDIR)functions.o -o $(BDIR)layout $<
network.o: network.cpp network.h headers.h edge.h node.h
	$(CC) -o $(BDIR)network.o $(CCFLAGS) -c $<
layout.o: layout.cpp network.h headers.h edge.h node.h
	$(CC) -o $(BDIR)layout.o $(CCFLAGS) -c $<
functions.o: functions.cpp functions.h headers.h
	$(CC) -o $(BDIR)functions.o $(CCFLAGS) -c $<	
test: layout_test.cpp network.o layout.o functions.o
	$(CC) $(CCFLAGS) $(BDIR)network.o $(BDIR)layout.o $(BDIR)functions.o -o $(BDIR)test $<
