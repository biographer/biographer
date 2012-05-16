CC=g++
XINC=-Isrc
#CCFLAGS=-fPIC -g -O0 -Wall -fno-rtti $(XINC) -DPROGRESSLINUX -DUSEJSON `pkg-config --cflags glib-2.0 json-glib-1.0` -lglib-2.0 -ljson-glib-1.0
#CCFLAGS=-fPIC -g -O0 -Wall -fno-rtti $(XINC) -DUSEJSON `pkg-config --cflags glib-2.0`  -lglib-2.0 -rpath=/local/home/handorf/lib -I/local/home/handorf/hg/biographer-layout/json-glib-0.12.6/ -L/local/home/handorf/lib -ljson-glib-1.0
#CCFLAGS=-fPIC -g -O0 -Wall -fno-rtti $(XINC) -DSTACKX
CCFLAGS=-fPIC -g -O0 -Wall -fno-rtti $(XINC) -DSHOWPROGRESS `pkg-config --cflags cairo` -lcairo
ifeq ($(MAKECMDGOALS),testlayout)
CCFLAGS=-fPIC -O3 -Wall -fno-rtti $(XINC) -DSHOWPROGRESS `pkg-config --cflags cairo` -lcairo
endif
ifeq ($(MAKECMDGOALS),)
CCFLAGS=-fPIC -O3 -Wall -fno-rtti $(XINC) -DSTACKX
endif
ifeq ($(MAKECMDGOALS),layout)
CCFLAGS=-fPIC -O3 -Wall -fno-rtti $(XINC) -DSTACKX
endif
#CCFLAGS=-fPIC -g -O0 -Wall -fno-rtti $(XINC) -DSTACKX -DSHOWPROGRESS -DOUTPNG `pkg-config --cflags cairo` -lcairo
SRC=src/
BDIR=build/
VPATH=$(SRC):$(BDIR)
OBJS=network.o layout.o types.o plugins.o netdisplay.o

layout: dolayout.cpp reactionlayout.cpp $(OBJS)
	$(CC)  $(BDIR)network.o $(BDIR)layout.o $(BDIR)types.o $(BDIR)plugins.o -o $(BDIR)layout $< $(CCFLAGS)
layoutp: dolayout.cpp reactionlayout.cpp $(OBJS)
	$(CC)  $(BDIR)network.o $(BDIR)layout.o $(BDIR)types.o $(BDIR)plugins.o $(BDIR)netdisplay.o -o $(BDIR)layoutp $< $(CCFLAGS)
#json:	layout_json.cpp network.o layout.o types.o
#	$(CC)  $(BDIR)network.o $(BDIR)layout.o $(BDIR)types.o -o $(BDIR)layoutJson $<
network.o: network.cpp network.h types.h
	$(CC) -o $(BDIR)network.o  -c $< $(CCFLAGS)
layout.o: layout.cpp plugins.h layout.h network.h types.h defines.h
	$(CC) -o $(BDIR)layout.o  -c $< $(CCFLAGS)
types.o: types.cpp types.h defines.h
	$(CC) -o $(BDIR)types.o  -c $<	 $(CCFLAGS)
plugins.o: plugins.cpp paramedge.cpp edgerouting.cpp bfs.cpp plugins.h layout.h network.h types.h defines.h
	$(CC) -o $(BDIR)plugins.o  -c $< $(CCFLAGS)
netdisplay.o: netdisplay.cpp netdisplay.h network.h types.h
	$(CC) -o $(BDIR)netdisplay.o  -c $< $(CCFLAGS) 

#test: layout_test.cpp network.o layout.o types.o
#	$(CC) $(CCFLAGS) $(BDIR)network.o $(BDIR)layout.o $(BDIR)types.o -o $(BDIR)test $<
#
testlayout: testlayout.cpp $(OBJS)
	$(CC) $(BDIR)network.o $(BDIR)layout.o $(BDIR)types.o $(BDIR)plugins.o $(BDIR)netdisplay.o -o $(BDIR)testlayout $< $(CCFLAGS)
testlayout-dbg: testlayout.cpp $(OBJS)
	$(CC) $(BDIR)network.o $(BDIR)layout.o $(BDIR)types.o $(BDIR)plugins.o $(BDIR)netdisplay.o -o $(BDIR)testlayout $< $(CCFLAGS)
test_dist_edges: test_dist_edges.cpp $(OBJS)
	$(CC) $(BDIR)network.o $(BDIR)layout.o $(BDIR)types.o $(BDIR)plugins.o $(BDIR)netdisplay.o -o $(BDIR)test_dist_edges $< $(CCFLAGS)
test_rea_torque: test_rea_torque.cpp $(OBJS)
	$(CC) $(CCFLAGS) $(BDIR)network.o $(BDIR)layout.o $(BDIR)types.o $(BDIR)plugins.o $(BDIR)netdisplay.o -o $(BDIR)test_rea_torque $< $(CCFLAGS)
test_min_cross: test_min_cross.cpp $(OBJS)
	$(CC) $(CCFLAGS) $(BDIR)network.o $(BDIR)layout.o $(BDIR)types.o $(BDIR)plugins.o $(BDIR)netdisplay.o -o $(BDIR)test_min_cross $< $(CCFLAGS)
test_min_cross_multi: test_min_cross_multi.cpp $(OBJS)
	$(CC) $(CCFLAGS) $(BDIR)network.o $(BDIR)layout.o $(BDIR)types.o $(BDIR)plugins.o $(BDIR)netdisplay.o -o $(BDIR)test_min_cross_multi $< $(CCFLAGS)
test_compartments: test_compartments.cpp $(OBJS)
	$(CC) $(CCFLAGS) $(BDIR)network.o $(BDIR)layout.o $(BDIR)types.o $(BDIR)plugins.o $(BDIR)netdisplay.o -o $(BDIR)test_compartments $< $(CCFLAGS)
test_node_collision: test_node_collision.cpp $(OBJS)
	$(CC) $(CCFLAGS) $(BDIR)network.o $(BDIR)layout.o $(BDIR)types.o $(BDIR)plugins.o $(BDIR)netdisplay.o -o $(BDIR)test_node_collision $< $(CCFLAGS)
test_route_edges: test_route_edges.cpp $(OBJS)
	$(CC) $(CCFLAGS) $(BDIR)network.o $(BDIR)layout.o $(BDIR)types.o $(BDIR)plugins.o $(BDIR)netdisplay.o -o $(BDIR)test_route_edges $< $(CCFLAGS)
test_rotate: test_rotate.cpp $(OBJS)
	$(CC) $(CCFLAGS) $(BDIR)network.o $(BDIR)layout.o $(BDIR)types.o $(BDIR)plugins.o $(BDIR)netdisplay.o -o $(BDIR)test_rotate $< $(CCFLAGS)

	
