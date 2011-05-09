#ifndef th_netstruct_h
#define th_netstruct_h

#ifdef SCOPES_USEBOOSTSERIALIZATION
#include <boost/serialization/version.hpp>
#endif // SCOPES_USEBOOSTSERIALIZATION
#include "tdefs.h"
#include "array.h"

struct NetStruct {
	public:
		NetStruct();//!<default constructor
		NetStruct(const NetStruct& ns2);//!<copy constructor.
		NetStruct(int32 nr, int32 nc);//!< constructor with allocate.
		NetStruct(string &str);
		NetStruct(string &str,int32 &pos);//!< constructor from string
		~NetStruct();//!<destructor
		void resize(int32 nr, int32 nc); //!<resize all vectors.
#ifdef SCOPES_USEBOOSTSERIALIZATION
                friend class boost::serialization::access;
		template<class Archive> void serialize(Archive & ar, const unsigned int version) {
		  ar & BOOST_SERIALIZATION_NVP(IN);
		  ar & BOOST_SERIALIZATION_NVP(OUT);
		  if (version>=2) ar & BOOST_SERIALIZATION_NVP(INH);
		  if (version>=2) ar & BOOST_SERIALIZATION_NVP(CMPI);
        if (version>=3) ar & BOOST_SERIALIZATION_NVP(CAT);
        if (version>=3) ar & BOOST_SERIALIZATION_NVP(PRP);
        ar & BOOST_SERIALIZATION_NVP(INST);
		  ar & BOOST_SERIALIZATION_NVP(OUTST);
		  ar & BOOST_SERIALIZATION_NVP(CSUC);
		  ar & BOOST_SERIALIZATION_NVP(CPRE);
		  ar & BOOST_SERIALIZATION_NVP(REV);
		  ar & BOOST_SERIALIZATION_NVP(numR);
		  ar & BOOST_SERIALIZATION_NVP(numC);
		  ar & BOOST_SERIALIZATION_NVP(lastAdded);
		  ar & BOOST_SERIALIZATION_NVP(refCount);
		}
#endif // SCOPES_USEBOOSTSERIALIZATION
		array<array<int32>* >* IN; //!<substrate indices for each rea
		array<array<int32>* >* OUT; //!<product indices for each rea
		array<array<int32>* >* INH; //!<inhibitor indices for each rea
		array<array<int32>* >* CMPI; //!<indices of substrates competively inhibited by a reaction
		array<array<int32>* >* CAT; //!<catalyst indices for each rea
		array<array<int32>* >* PRP; //!<propagators indices for each rea, products that propagate dpletion to inhibited substrates
		array<array<int32>* >* INST; //!<substrate stoichiometries in same order as IN
		array<array<int32>* >* OUTST; //!<product stoichiometries in same order as IN
		array<array<int32>* >* CSUC; //!<successor reactions for each compound
		array<array<int32>* >* CPRE; //!<predecessor reactions for each compound
		array<int8>* REV; //!< reversibility for each reaction
		int32 numR; //!<number of reactions
		int32 numC; //!<number of compounds
		int32 lastAdded; //!<reaction added last
		int32 refCount; //!< how many Net-objects use this struct
		string* toString();//!< copy network data into a string
		void appendToString(string &str);//!< append network data to a string
	private:
		void initFromString(string &str,int32 &pos);//!< construct from string
	
};
#ifdef SCOPES_USEBOOSTSERIALIZATION
BOOST_CLASS_VERSION(NetStruct, 3)
#endif // SCOPES_USEBOOSTSERIALIZATION

#endif
