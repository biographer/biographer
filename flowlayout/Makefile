CC=g++
XINC=-Isrc
CCFLAGS=-fPIC -g -O0 -Wall -fno-rtti $(XINC)
BDIR=build/
VPATH=src

network.o: network.cpp network.h headers.h edge.h node.h
	$(CC) -o $(BDIR)network.o $(CCFLAGS) -c $<

test: test.cpp network.o
	$(CC) -o $(BDIR)test $(CCFLAGS) $(BDIR)network.o $<
