#ifdef SCOPES_USEBOOSTSERIALIZATION
#include <boost/archive/text_oarchive.hpp> 
#include <boost/archive/text_iarchive.hpp> 
#endif // SCOPES_USEBOOSTSERIALIZATION
#include "tdefs.h"
#include "array.h"
#include "net.h"
#include "scope.h"
#include <iostream> 
#include <sstream> 

int main(){
	array<int8>* ar1=new array<int8>;
	array<int32>* ar2=new array<int32>;
	ar1->print();
	ar2->print();
	ar1->replaceFill(1,5);
	ar1->print();
	ar2->fill(2,0,5);
	ar2->print();
	ar2->add(*ar1,-1);
	ar2->print();
	ar2->put(5,19); //array is extended accordingly
	ar2->print();
	(*ar2)[17]=3;
//	(*ar2)[111122]=3; // this may cause a segfault as length is not checked
	ar2->print();
	ar2->put(100005,100019); //array is extended accordingly
	printf("%ld %ld\n",ar2->at(100019),ar2->size());
	printf("%d %d %d \n",sizeof(int32),sizeof(int16),sizeof(int8));
//	int8 subs[]={1,2,3,4};
	array<int8>* ar3=new array<int8>((int8[]){1,2,3,4},4);
	ar3->print();
	
	/*
	c0+c1->c2,c3+c2->c4+c5,c1->c6
	*/	
	Net* net=new Net;
	net->addRea(new array<int32>((int32[]){0,1},2),new array<int32>((int32[]){2},1));
	net->addRea(new array<int32>((int32[]){3,2},2),new array<int32>((int32[]){4,5},2));
	net->replaceRea(2,new array<int32>((int32[]){1},1),new array<int32>((int32[]){6},1));
	array<int8>* sc=scope(*net,*(new array<int8>((int8[]){1,1,0,0,0,0,0},7)));
	sc->print();
	delete sc;
	sc=scope(*net,*(new array<int8>((int8[]){1,1,0,1,0,0,0},7)));
	sc->print();
	delete sc;
	net->print();
	string *str=net->toString();
	Net* net2=new Net(*str);
	net2->print();
	sc=scope(*net2,*(new array<int8>((int8[]){1,1,0,1,0,0,0},7)));
	sc->print();
	delete sc;
   net2->replaceRea(1,new array<int32>((int32[]){3,2},2),new array<int32>((int32[]){4,5},2),0,NULL,NULL,new array<int32>((int32[]){7},1));
   net2->print();

   int32 idx=net->addRea(new array<int32>(0),new array<int32>((int32[]){2},1)); // producing reaction
   printf("added rea %ld\n",idx);
   net->print();
	std::stringstream ss; 	

#ifdef SCOPES_USEBOOSTSERIALIZATION
	
	boost::archive::text_oarchive oa(ss); 
  	oa << *net; 
  	
  	Net* net3=new Net;
	boost::archive::text_iarchive ia(ss); 
	ia >> *net3;
	sc=scope(*net3,*(new array<int8>((int8[]){1,1,0,1,0,0,0},7)));
	sc->print();
	delete sc;	
#endif // SCOPES_USEBOOSTSERIALIZATION
  	
	return 0;
}
