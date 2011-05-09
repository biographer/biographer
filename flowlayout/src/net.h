#ifndef th_net_h
#define th_net_h

#ifdef SCOPES_USEBOOSTSERIALIZATION
#include <boost/serialization/list.hpp>
#include <boost/serialization/version.hpp>
#endif // SCOPES_USEBOOSTSERIALIZATION
#include "tdefs.h"
#include "array.h"
#include "netstruct.h"

class Net{
	public:
		Net(); //!<default constructor
		Net(NetStruct &str2); //!<new Net with existing NetStruct.
		Net(int32 nr, int32 nc); //!< constructor with allocate.
		Net(const Net& net2); //!<copy constructor.
		Net(string &st);
		Net(string &st,int32 &pos);//!< constructor with string
		~Net(); //!<destructor
		
		void initFromString(string &st,int32 &pos);
		void resize(int32 nr, int32 nc); //!<resize all vectors.
		int32 numR(); //!<number of reactions
		int32 numC(); //!<number of compounds
		int32 at(int32 reaidx,int32 comidx); //!< value at position in stoichiometric matrix
		
		//! Add reaction to the end of reaction list.
		int32 addRea(array<int32>* subs, array<int32>* prds, int8 rev=0,array<int32>* subsst= NULL,array<int32>* prdsst = NULL,array<int32>* cat=NULL,array<int32>* inhs=NULL,array<int32>* inhd=NULL,array<int32>* prps=NULL);
		//! Replace reaction at a particular index.
		int32 replaceRea(int32 reaidx,array<int32>* subs, array<int32>* prds, int8 rev=0,array<int32>* subsst= NULL,array<int32>* prdsst = NULL,array<int32>* cat=NULL,array<int32>* inhs=NULL,array<int32>* inhd=NULL,array<int32>* prps=NULL);
		//! Delete reaction at a particular index.
		void delRea(int32 reaidx);
		//! Delete reactions at positons determined by mask
		void delRea(array<int8>* mask);
		//! Delete reactions at positons determined by index list
		void delRea(array<int32>* idxs);
		//! checks whether a particular reaction already exists
		int hasRea(array<int32>* subs, array<int32>* prds, int8 rev=-10,array<int32>* subsst= NULL,array<int32>* prdsst = NULL);
		
		array<int32>* neighbors(int32 comidx);//!< reaction in which compound comidx takes part
		array<int32>* succs(int32 comidx);//!< successor reactions of compound comidx
		array<int32>* preds(int32 comidx);//!< predecessors reactions of compound comidx
		array<int32>* metabolites(int32 reaidx);//!< substrates and products of reactions
		array<int32>* substrates(int32 reaidx);//!< substrates of reaction reaidx
		array<int32>* products(int32 reaidx);//!< products of reaction reaidx
		array<int32>* inhibitors(int32 reaidx);//!< inhibitors of reaction reaidx
		array<int32>* inhibited(int32 reaidx);//!< inhibited substrates of reaction reaidx
      array<int32>* catalysts(int32 reaidx);//!< catalysts of reaction reaidx
      array<int32>* propagators(int32 reaidx);//!< catalysts of reaction reaidx
      array<int32>* subs_stoich(int32 reaidx);//!< substrate stoichiometries of reaction reaidx
		array<int32>* prod_stoich(int32 reaidx);//!< product stoichiometries of reaction reaidx
		int8 rev(int32 reaidx); //!< reversibility of the reaction;
		
		int8 enabled(int32 reaidx); //!< is reaction enabled
		
		string* toString();//!< copy network data into a string
		void appendToString(string &st);//!< copy network data into a string
		string* printToString();//!< print a summary of network to string
		void print();//!< print a summary of network to stdout
#ifdef SCOPES_USEBOOSTSERIALIZATION
		friend class boost::serialization::access;
		template<class Archive> void serialize(Archive & ar, const unsigned int version) {
		  ar & BOOST_SERIALIZATION_NVP(reaMask);
		  ar & BOOST_SERIALIZATION_NVP(str);
		}
#endif // SCOPES_USEBOOSTSERIALIZATION
		array<int8>* reaMask; //!< which reactions are enabled in the current network
//		array<int8>* comMask;
	protected:
	
		NetStruct* str; //!< the network topology
};
// the inline methods

inline int32 Net::numR(){
	return this->str->numR;
}
inline int32 Net::numC(){
	return this->str->numC;
}
/*!
	\param comidx which compound
	
	Note: this returns the original array from the Net object. Do not delete!
*/

inline array<int32>* Net::succs(int32 comidx){
	return (*str->CSUC)[comidx];
}
/*!
	\param comidx which compound
	
	Note: this returns the original array from the Net object. Do not delete!
*/
inline array<int32>* Net::preds(int32 comidx){
	return (*str->CPRE)[comidx];
}
/*!
	\param reaidx which reaction
	
	Note: this returns the original array from the Net object. Do not delete!
*/
inline array<int32>* Net::substrates(int32 reaidx){
	return (*str->IN)[reaidx];
}
/*!
	\param reaidx which reaction
	
	Note: this returns the original array from the Net object. Do not delete!
*/
inline array<int32>* Net::products(int32 reaidx){
	return (*str->OUT)[reaidx];
}
/*!
	\param reaidx which reaction
	
	Note: this returns the original array from the Net object. Do not delete!
*/
inline array<int32>* Net::inhibitors(int32 reaidx){
	return (*str->INH)[reaidx];
}
/*!
	\param reaidx which reaction
	
	Note: this returns the original array from the Net object. Do not delete!
*/
inline array<int32>* Net::inhibited(int32 reaidx){
	return (*str->CMPI)[reaidx];
}
/*!
\param reaidx which reaction

Note: this returns the original array from the Net object. Do not delete!
*/
inline array<int32>* Net::catalysts(int32 reaidx){
   return (*str->CAT)[reaidx];
}
/*!
\param reaidx which reaction

Note: this returns the original array from the Net object. Do not delete!
*/
inline array<int32>* Net::propagators(int32 reaidx){
   return (*str->PRP)[reaidx];
}
/*!
	\param reaidx which reaction
	
	Note: this returns the original array from the Net object. Do not delete!
*/
inline array<int32>* Net::subs_stoich(int32 reaidx){
	return (*str->INST)[reaidx];
}
/*!
	\param reaidx which reaction
	
	Note: this returns the original array from the Net object. Do not delete!
*/
inline array<int32>* Net::prod_stoich(int32 reaidx){
	return (*str->OUTST)[reaidx];
}
inline int8 Net::rev(int32 reaidx){
	return (*str->REV)[reaidx];
}
inline int8 Net::enabled(int32 reaidx){
	return (*reaMask)[reaidx];
}

#endif
