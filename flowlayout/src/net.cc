#include "net.h"

Net::Net(){
	str=new NetStruct();
	str->refCount++;
	reaMask=new array<int8>();
	
}
Net::Net(NetStruct  &str2){
	str=&str2;
	str->refCount++;
	reaMask=new array<int8>(str->numR);
}
Net::Net(int32 nr, int32 nc){
	str=new NetStruct(nr,nc);
	str->refCount++;
	reaMask=new array<int8>(nr);
}
Net::Net(const Net& net2){
	str=net2.str;
	str->refCount++;
	reaMask=new array<int8>((*net2.reaMask));
}
Net::Net(string &st){
	int32 pos=0;
	str=new NetStruct(st,pos);
	str->refCount++;
	reaMask=new array<int8>(st,pos);
}
Net::Net(string &st,int32 &pos){
	str=new NetStruct(st,pos);
	str->refCount++;
	reaMask=new array<int8>(st,pos);
}
Net::~Net(){
	str->refCount--;
	if (str->refCount==0) delete str;
	delete reaMask;
}
void Net::initFromString(string &st,int32 &pos){
	if (str){
		str->refCount--;
		if (str->refCount==0) delete str;
	}
	if (reaMask){
		delete reaMask;
	}
	str=new NetStruct(st,pos);
	str->refCount++;
	reaMask=new array<int8>(st,pos);
}
/*!
	\brief sets the network size.
	\param nr number of reactions
	\param nc number of compounds
	
	Resizes the underlying array accordingly, thus avoiding continious reallocation if the reactions are added one by one.
*/
void Net::resize(int32 nr, int32 nc){
	if (nr>str->numR){
		reaMask->resize(nr);
	}
	if ((nc>str->numC) || (nr>str->numR)){
		str->resize(nr,nc);
	}
}

/*!
	\brief add a new reaction to the network.
	\param subs array of substrate indices
	\param prds array of product indices
	\param rev reversibility, 0=reversible, 1=irreversible, -1=irreversible but in prds->subs direction.
	\param subsst stoichiometries for the substrates (same order). Omit if all stoich. equal 1
	\param prdsst stoichiometries for the products (same order). Omit if all stoich. equal 1
	\param cats catalysts of reaction
	\param inhs inhibitors of the reaction
	\param inhd inhibited substrates of the reaction (competitive)
	\param prps depletion propagators of the reactions
	
	places a new reaction at the next position after the lastly added reaction. if a reaction with that index existed it is removed.
	Note: all inhd's must also be substrates and all prps must also be products. If prps is given, substrate inhibition only occurs if at least one of the propagators is depleted
	
	The content of the arrays is copied. They can be deleted afterwards.
*/
int32 Net::addRea(array<int32>* subs, array<int32>* prds,int8 rev,array<int32>* subsst,array<int32>* prdsst,array<int32>* cats,array<int32>* inhs,array<int32>* inhd,array<int32>* prps){
	return replaceRea(str->lastAdded+1,subs,prds,rev,subsst,prdsst,cats,inhs,inhd,prps);
}

/*!
	\brief place a new reaction into the network
	\param reaidx position where to place
	\param subs array of substrate indices
	\param prds array of product indices
	\param rev reversibility, 0=reversible, 1=irreversible, -1=irreversible but in prds->subs direction.
	\param subsst stoichiometries for the substrates (same order). Omit if all stoich. equal 1
	\param prdsst stoichiometries for the products (same order). Omit if all stoich. equal 1
	\param cats catalysts of reaction
	\param inhs inhibitors of the reaction
	\param inhd inhibited substrates of the reaction (competitive)
	\param prps depletion propagators of the reactions
	
	places a new reaction at position reaidx. if a reaction with that index existed it is removed.
	Note: all inhd's must also be substrates and all prps must also be products. If prps is given, substrate inhibition only occurs if at least one of the propagators is depleted
	
	The content of the arrays is copied. They can be deleted afterwards.
*/
int32 Net::replaceRea(int32 reaidx,array<int32>* subs, array<int32>* prds, int8 rev,array<int32>* subsst,array<int32>* prdsst,array<int32>* cats,array<int32>* inhs,array<int32>* inhd,array<int32>* prps){
	int32 nsubs=subs->size();
	int32 nprds=prds->size();
	int32 i;
	bool remsst=false,rempst=false;
	if (!subsst){
		subsst=new array<int32>();
		remsst=true; //remove generated array later
	}
	if (!prdsst){
		prdsst=new array<int32>();
		rempst=true; //remove generated array later
	}
	if (nsubs>subsst->size()){
		subsst->replaceFill(1,nsubs); // create substrate stoichiometrie =1  if not provided as param
	}
	if (nprds>prdsst->size()){
		prdsst->replaceFill(1,nprds); // create product stoichiometrie =1 if not provided as param
	}
	int32 maxc=max(subs->max(),prds->max()); // search for maximum compund index
	if (inhs) maxc=max(maxc,inhs->max()); // search inhibitors for maximum compound index
   if (cats) maxc=max(maxc,cats->max()); // same for catalysts
   if (reaidx>=str->numR){ 
		if (maxc<str->numC) maxc=str->numC-1;
		resize(reaidx+1,maxc+1);
	} else {
		if (maxc>=str->numC) resize(str->numR,maxc+1);
	}
	//we del reaction first to update CSUC,CPRE
	delRea(reaidx);
	(*str->IN)[reaidx]->replace(*subs);
	(*str->OUT)[reaidx]->replace(*prds);
	if (inhs) (*str->INH)[reaidx]->replace(*inhs);
	if (inhd) (*str->CMPI)[reaidx]->replace(*inhd);
   if (cats) (*str->CAT)[reaidx]->replace(*cats);
   if (prps) (*str->PRP)[reaidx]->replace(*prps);
   (*str->INST)[reaidx]->replace(*subsst);
	(*str->OUTST)[reaidx]->replace(*prdsst);
	for (i=0;i<nsubs;i++){
		(*str->CSUC)[(*subs)[i]]->push_back(reaidx);
	}
	if (inhs){
		for (i=0;i<inhs->size();i++){
			(*str->CSUC)[(*inhs)[i]]->push_back(reaidx);
		}
	}
	if (cats){
      for (i=0;i<cats->size();i++){
         (*str->CSUC)[(*cats)[i]]->push_back(reaidx);
      }
   }
   for (i=0;i<nprds;i++){
		(*str->CPRE)[(*prds)[i]]->push_back(reaidx);
	}
	(*str->REV)[reaidx]=rev;
	(*reaMask)[reaidx]=1;
   if (reaidx>str->lastAdded) str->lastAdded=reaidx;
	if (remsst) delete subsst;
	if (rempst) delete prdsst;
	return reaidx;
}
int Net::hasRea(array<int32>* subs, array<int32>* prds, int8 rev,array<int32>* subsst,array<int32>* prdsst){
	return 0; //not implemented yet
}

/*!
	\brief delete reaction at position idx
	\param idx index of reaction to delete
*/
void Net::delRea(int32 idx){
	int32 i;
	int32 pos;
	for (i=0;i<(*str->IN)[idx]->size();i++){
		pos=(*str->CSUC)[(*(*str->IN)[idx])[i]]->find(idx);
		if (pos>=0){
			(*str->CSUC)[(*(*str->IN)[idx])[i]]->del(pos,1);
		}
	}
	for (i=0;i<(*str->INH)[idx]->size();i++){
		pos=(*str->CSUC)[(*(*str->INH)[idx])[i]]->find(idx);
		if (pos>=0){
			(*str->CSUC)[(*(*str->INH)[idx])[i]]->del(pos,1);
		}
	}
	for (i=0;i<(*str->CAT)[idx]->size();i++){
      pos=(*str->CSUC)[(*(*str->CAT)[idx])[i]]->find(idx);
      if (pos>=0){
         (*str->CSUC)[(*(*str->CAT)[idx])[i]]->del(pos,1);
      }
   }
   for (i=0;i<(*str->OUT)[idx]->size();i++){
		pos=(*str->CPRE)[(*(*str->OUT)[idx])[i]]->find(idx);
		if (pos>=0){
			(*str->CPRE)[(*(*str->OUT)[idx])[i]]->del(pos,1);
		}
	}
	(*str->IN)[idx]->clear();
	(*str->OUT)[idx]->clear();
	(*str->INH)[idx]->clear();
	(*str->CMPI)[idx]->clear();
   (*str->CAT)[idx]->clear();
   (*str->INST)[idx]->clear();
	(*str->OUTST)[idx]->clear();
	(*reaMask)[idx]=0;
}
/*!
	\param reaidx which reaction
	\param comidx which compound
	
	returns the corresponding entry of the stoichiometric matrix
*/
int32 Net::at(int32 reaidx,int32 comidx){ // modify return value to double later
	int32 pos;
	int32 st=0; //modify to double later
	pos=(*str->IN)[reaidx]->find(comidx);
	if (pos>=0) {st=-(*(*str->INST)[reaidx])[pos];}
	pos=(*str->OUT)[reaidx]->find(comidx);
	if (pos>=0) {st+=(*(*str->OUTST)[reaidx])[pos];}
	return st;
}
/*!
	\param comidx which compound
	
	Note: this returns a newly generated array. Delete youself!
*/
array<int32>* Net::neighbors(int32 comidx){
//	printf("comidx %li\n",comidx);fflush(stdout);
//	if (((*str->CSUC)[comidx]==NULL) ||((*str->CPRE)[comidx]==NULL)) printf("error null ptr\n");fflush(stdout);
	array<int32>* ret=new array<int32>(*(*str->CPRE)[comidx]);
	ret->put(*(*str->CSUC)[comidx],ret->size());
	return ret;
}
/*!
	\param reaidx which compound
	
	Note: this returns a newly generated array. Delete youself!
*/
array<int32>* Net::metabolites(int32 reaidx){
//	printf("comidx %li\n",comidx);fflush(stdout);
//	if (((*str->CSUC)[comidx]==NULL) ||((*str->CPRE)[comidx]==NULL)) printf("error null ptr\n");fflush(stdout);
	array<int32>* ret=new array<int32>(*(*str->IN)[reaidx]);
	ret->put(*(*str->OUT)[reaidx],ret->size());
	ret->put(*(*str->INH)[reaidx],ret->size());
   ret->put(*(*str->CAT)[reaidx],ret->size());
   return ret;
}

string* Net::toString(){
	string *st=new string();
	appendToString(*st);
	return st;
}
void Net::appendToString(string &st){
	str->appendToString(st);
	reaMask->appendToString(st);
}
string* Net::printToString(){
	int32 i;
	string* s=new string();
	char charstr[50];
	sprintf(charstr,"Net (%i,%i)\n",str->numR,str->numC);
	s->append(charstr);
	s->append("IN: [");
	for (i=0;i<str->IN->size();i++){
		sprintf(charstr," %i:",i);
		s->append(charstr);
		s->append(*((*str->IN)[i]->printToString()));
	}
	s->append("]\nINST: [");
	for (i=0;i<str->INST->size();i++){
		sprintf(charstr," %i:",i);
		s->append(charstr);
		s->append(*((*str->INST)[i]->printToString()));
	}
	s->append("]\nOUT: [");
	for (i=0;i<str->OUT->size();i++){
		sprintf(charstr," %i:",i);
		s->append(charstr);
		s->append(*((*str->OUT)[i]->printToString()));
	}
	s->append("]\nOUTST: [");
	for (i=0;i<str->OUTST->size();i++){
		sprintf(charstr," %i:",i);
		s->append(charstr);
		s->append(*((*str->OUTST)[i]->printToString()));
	}
	s->append("]\nCAT: [");
   for (i=0;i<str->CAT->size();i++){
      sprintf(charstr," %i:",i);
      s->append(charstr);
      s->append(*((*str->CAT)[i]->printToString()));
   }
   s->append("]\nINH: [");
	for (i=0;i<str->INH->size();i++){
		sprintf(charstr," %i:",i);
		s->append(charstr);
		s->append(*((*str->INH)[i]->printToString()));
	}
	s->append("]\nCMPI: [");
	for (i=0;i<str->CMPI->size();i++){
		sprintf(charstr," %i:",i);
		s->append(charstr);
		s->append(*((*str->CMPI)[i]->printToString()));
	}
	s->append("]\nCPRE: [");
	for (i=0;i<str->CPRE->size();i++){
		sprintf(charstr," %i:",i);
		s->append(charstr);
		s->append(*((*str->CPRE)[i]->printToString()));
	}
	s->append("]\nCSUC: [");
	for (i=0;i<str->CSUC->size();i++){
		sprintf(charstr," %i:",i);
		s->append(charstr);
		s->append(*((*str->CSUC)[i]->printToString()));
	}
	s->append("]\nREV: ");
	s->append(*(str->REV->printToString()));
	s->append("\nMASK: ");
	s->append(*(reaMask->printToString()));
	return s;
}
/*!
	\brief prints the array to stdout

	Note: This only works for certain types T
*/
void Net::print(){
	cout << *(this->printToString()) << endl;
//	printf("%s\n",this->printToString()->c_str);fflush(stdout);
}

