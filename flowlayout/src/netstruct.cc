#include "netstruct.h"

static void _appendARAR(string& str,array<array<int32>* >& ar);
static array<array<int32>* >* _retrieveARAR(string &str,int32 &pos);
static const int16 magic=35212; // identifies a stored netstruct 



NetStruct::NetStruct(){
	IN=new array<array<int32>* >();
	OUT=new array<array<int32>* >();
	INH=new array<array<int32>* >();
   CMPI=new array<array<int32>* >();
   CAT=new array<array<int32>* >();
   PRP=new array<array<int32>* >();
   INST=new array<array<int32>* >();
	OUTST=new array<array<int32>* >();
	CSUC=new array<array<int32>* >();
	CPRE=new array<array<int32>* >();
	REV=new array<int8>();
	numR=0;
	numC=0;
	lastAdded=-1;
	refCount=0;
}
NetStruct::NetStruct(int32 nr, int32 nc){
	numR=0;
	numC=0;
	IN=new array<array<int32>* >();
	OUT=new array<array<int32>* >();
	INH=new array<array<int32>* >();
   CMPI=new array<array<int32>* >();
   CAT=new array<array<int32>* >();
   PRP=new array<array<int32>* >();
   INST=new array<array<int32>* >();
	OUTST=new array<array<int32>* >();
	CSUC=new array<array<int32>* >();
	CPRE=new array<array<int32>* >();
	REV=new array<int8>();
	resize(nr,nc);
	lastAdded=-1;
	refCount=0;
}
NetStruct::NetStruct(const NetStruct& ns2){
	int32 i;
	numR=ns2.numR;
	numC=ns2.numC;
	IN=new array<array<int32>* >(numR);
	OUT=new array<array<int32>* >(numR);
	INH=new array<array<int32>* >(numR);
	CMPI=new array<array<int32>* >(numR);
   CAT=new array<array<int32>* >(numR);
   PRP=new array<array<int32>* >(numR);
   INST=new array<array<int32>* >(numR);
	OUTST=new array<array<int32>* >(numR);
	CSUC=new array<array<int32>* >(numC);
	CPRE=new array<array<int32>* >(numC);
	for (i=0;i<numR;i++){
		(*IN)[i]=new array<int32>((*(*ns2.IN)[i]));
		(*OUT)[i]=new array<int32>((*(*ns2.OUT)[i]));
		(*INH)[i]=new array<int32>((*(*ns2.INH)[i]));
		(*CMPI)[i]=new array<int32>((*(*ns2.CMPI)[i]));
      (*CAT)[i]=new array<int32>((*(*ns2.CAT)[i]));
      (*PRP)[i]=new array<int32>((*(*ns2.PRP)[i]));
      (*INST)[i]=new array<int32>((*(*ns2.INST)[i]));
		(*OUTST)[i]=new array<int32>((*(*ns2.OUTST)[i]));
	}			
	for (i=0;i<numC;i++){
		(*CSUC)[i]=new array<int32>((*(*ns2.CSUC)[i]));
		(*CPRE)[i]=new array<int32>((*(*ns2.CPRE)[i]));
	}
	REV=new array<int8>((*ns2.REV));
	lastAdded=ns2.lastAdded;
	refCount=0;
}
NetStruct::~NetStruct(){
	int32 i;
#ifdef DEBUG	
	printf("NetStruct: destroy: realinks\n");fflush(stdout);
#endif
	for (i=0;i<numR;i++){
		delete (*IN)[i];
		delete (*OUT)[i];
		delete (*INH)[i];
		delete (*CMPI)[i];
      delete (*CAT)[i];
      delete (*PRP)[i];
      delete (*INST)[i];
		delete (*OUTST)[i];
	}
#ifdef DEBUG	
	printf("NetStruct: destroy: reaarray\n");fflush(stdout);
#endif
	delete IN;
	delete OUT;
	delete INH;
	delete CMPI;
   delete CAT;
   delete PRP;
   delete INST;
	delete OUTST;
	delete REV;
#ifdef DEBUG	
	printf("NetStruct: destroy: comlinks\n");fflush(stdout);
#endif
	for (i=0;i<numC;i++){
		delete (*CSUC)[i];
		delete (*CPRE)[i];
	}
#ifdef DEBUG	
	printf("NetStruct: destroy: comarray\n");fflush(stdout);
#endif
	delete CSUC;
	delete CPRE;
}
void NetStruct::resize(int32 nr, int32 nc){
	int32 i;
//	printf("NetStruct: resize: (%ld,%ld) -> (%ld,%ld)\n",numR,numC,nr,nc);fflush(stdout);
	if (nr>numR){
		IN->resize(nr);
		OUT->resize(nr);
		INH->resize(nr);
		CMPI->resize(nr);
      CAT->resize(nr);
      PRP->resize(nr);
      INST->resize(nr);
		OUTST->resize(nr);
		REV->resize(nr);
		for (i=numR;i<nr;i++){
			(*IN)[i]=new array<int32>();
			(*OUT)[i]=new array<int32>();
			(*INH)[i]=new array<int32>();
			(*CMPI)[i]=new array<int32>();
         (*CAT)[i]=new array<int32>();
         (*PRP)[i]=new array<int32>();
         (*INST)[i]=new array<int32>();
			(*OUTST)[i]=new array<int32>();
		}
		numR=nr;
	}
	if (nc>numC){
		CSUC->resize(nc);
		CPRE->resize(nc);
		for (i=numC;i<nc;i++){
			(*CSUC)[i]=new array<int32>();
			(*CPRE)[i]=new array<int32>();
		}
		numC=nc;
	}
}
NetStruct::NetStruct(string &str){
	int32 pos=0;
	initFromString(str,pos);
}
NetStruct::NetStruct(string &str,int32 &pos){
	initFromString(str,pos);
}
void NetStruct::initFromString(string &str,int32 &pos){
	int16 mag;
	int16 ver;
	int32 i;
	str.copy((char*) &mag,sizeof(mag),pos);
	if (mag!=magic){
		printf("Error: Failed magic checking for Netstruct.\n");
		return;
	}
	pos+=sizeof(mag);
	str.copy((char*) &ver,sizeof(ver),pos);pos+=sizeof(ver);
	if (ver==1){
		str.copy((char*) &numR,sizeof(numR),pos);pos+=sizeof(numR);
		str.copy((char*) &numC,sizeof(numC),pos);pos+=sizeof(numC);
		str.copy((char*) &lastAdded,sizeof(lastAdded),pos);pos+=sizeof(lastAdded);
		refCount=0;
		IN=_retrieveARAR(str,pos);
		OUT=_retrieveARAR(str,pos);
		INST=_retrieveARAR(str,pos);
		OUTST=_retrieveARAR(str,pos);
		CSUC=_retrieveARAR(str,pos);
		CPRE=_retrieveARAR(str,pos);
		REV=new array<int8>(str,pos);
		INH=new array<array<int32>* >(numR);
		CMPI=new array<array<int32>* >(numR);
      CAT=new array<array<int32>* >(numR);
      PRP=new array<array<int32>* >(numR);
      for (i=numR;i<numR;i++){
			(*INH)[i]=new array<int32>();
			(*CMPI)[i]=new array<int32>();
		}
	} else if (ver==2){
		str.copy((char*) &numR,sizeof(numR),pos);pos+=sizeof(numR);
		str.copy((char*) &numC,sizeof(numC),pos);pos+=sizeof(numC);
		str.copy((char*) &lastAdded,sizeof(lastAdded),pos);pos+=sizeof(lastAdded);
		refCount=0;
		IN=_retrieveARAR(str,pos);
		OUT=_retrieveARAR(str,pos);
		INH=_retrieveARAR(str,pos);
		CMPI=_retrieveARAR(str,pos);
		INST=_retrieveARAR(str,pos);
		OUTST=_retrieveARAR(str,pos);
		CSUC=_retrieveARAR(str,pos);
		CPRE=_retrieveARAR(str,pos);
		REV=new array<int8>(str,pos);
      CAT=new array<array<int32>* >(numR);
      PRP=new array<array<int32>* >(numR);
   } else if (ver==3){
      str.copy((char*) &numR,sizeof(numR),pos);pos+=sizeof(numR);
      str.copy((char*) &numC,sizeof(numC),pos);pos+=sizeof(numC);
      str.copy((char*) &lastAdded,sizeof(lastAdded),pos);pos+=sizeof(lastAdded);
      refCount=0;
      IN=_retrieveARAR(str,pos);
      OUT=_retrieveARAR(str,pos);
      INH=_retrieveARAR(str,pos);
      CMPI=_retrieveARAR(str,pos);
      CAT=_retrieveARAR(str,pos);
      PRP=_retrieveARAR(str,pos);
      INST=_retrieveARAR(str,pos);
      OUTST=_retrieveARAR(str,pos);
      CSUC=_retrieveARAR(str,pos);
      CPRE=_retrieveARAR(str,pos);
      REV=new array<int8>(str,pos);
   } else {
		printf("Error: unknown version '%d' for Netstruct\n",ver);
		return;
	}
}
string * NetStruct::toString(){
	string* str=new string();
	appendToString(*str);
	return str;
}
void NetStruct::appendToString(string &str){
	int16 ver;
//	ver=1;// store in version 1 format
//	ver=2;// store in version 2 format
   ver=3;// store in version 3 format
	str.append((char*) &magic,sizeof(magic)); //add magic code
	str.append((char*) &ver,sizeof(ver)); 
	str.append((char*) &numR,sizeof(numR));
	str.append((char*) &numC,sizeof(numC));
	str.append((char*) &lastAdded,sizeof(lastAdded));
	_appendARAR(str,*IN);
	_appendARAR(str,*OUT);
	_appendARAR(str,*INH); // this is ver=2 specific
	_appendARAR(str,*CMPI); // this is ver=2 specific
   _appendARAR(str,*CAT); // this is ver=3 specific
   _appendARAR(str,*PRP); // this is ver=3 specific
   _appendARAR(str,*INST);
	_appendARAR(str,*OUTST);
	_appendARAR(str,*CSUC);
	_appendARAR(str,*CPRE);
	REV->appendToString(str);
}


//local helper routines

void _appendARAR(string& str,array<array<int32>* >& ar){
	int32 i;
	int32 len=ar.size();
	str.append((char*) &len,sizeof(len));
	for (i=0;i<len;i++){
		ar[i]->appendToString(str);
	}
}
array<array<int32>* >* _retrieveARAR(string &str,int32 &pos){
	int32 i;
	int32 len;
	str.copy((char*) &len,sizeof(len),pos);pos+=sizeof(len);
	array<array<int32>* >* ar=new array<array<int32>* >(len);
	for (i=0;i<len;i++){
		(*ar)[i]=new array<int32>(str,pos);
	}
	return ar;
}
