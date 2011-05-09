#ifndef th_array_h
#define th_array_h

#include <stdio.h>
#include <vector>
#include <string>
#include <algorithm>
#ifdef SCOPES_USEBOOSTSERIALIZATION
#include <boost/serialization/version.hpp>
#include <boost/serialization/vector.hpp>
#include <boost/serialization/base_object.hpp>
#include <boost/serialization/nvp.hpp>
#endif // SCOPES_USEBOOSTSERIALIZATION
#include "tdefs.h"
#include <iostream>

using namespace _GLIBCXX_STD;

/*! \brief Template class for an Array of type T based on a STL vector.

	Provides routines for manipulating the vector, inlcuding arithmetical (i.e. adding) and logical (i.e. AND, OR) and set operations.
	Contains routines to insert and overwrite data without using iterators. 
*/
template <class T> class array : public vector<T>{
	public:

		//! \name Constructors
		//@{
		array();
		array(int32 size);
		array(T val, int32 size);
		array(const array &ar2);
		array(const T* ar2,int32 size);
		array(const string &str);
		array(const string &str, int32 &pos);
		~array();
		//@}		
		
		//! \name Vector wrapper functions
		//@{
		T& operator[](int32 idx);
		const T& operator[](int32 idx) const;
		T& front();
		const T& front() const;
		T& back();
		const T& back() const;
		int32 size() const;
		using vector<T>::insert;
		void insert(int32 idx, int32 len, const T& val);
		using vector<T>::erase;
		void erase(int32 idx, int32 len);
		//@}
		
		//! \name Operations on complete array
		//@{
		string* printToString();
		void print();
		string* toString();
		void appendToString(string& str);
		template <class T2> array<T2>* convertTo();//!< convert into array of different type
		//@}

		//! \name Array copy & paste, etc.
		//@{
		array<T>* copy();//!< return a copy of the array
		void put(const array& ar2);
		void put(const array& ar2,int32 idx);
		void put(const array& ar2,int32 idx, int32 len);
		void put(T val,int32 idx);
		void fill(T val);
		void fill(T val,int32 idx);
		void fill(T val,int32 idx, int32 len);
		void replace(const array& ar2);
		void replace(const array& ar2,int32 idx);
		void replace(const array& ar2,int32 idx, int32 len);
		void replaceFill(T val,int32 num);
		void replaceFill(T val,int32 num, int32 idx);
		void replaceFill(T val,int32 num, int32 idx, int32 len);
		void selectFill(T val, array<int32> &idxs);//!<fill elements indexed by idxs array with val
		template <class T2> void selectPut(const array<T2>& ar2, array<int32> &idxs);//!<fill elements indexed by idxs array with elements from ar2
		array<T>* selectGet( array<int32> &idxs );//!<get values of current array indexed by idxs
		void del(int32 idx,int32 len);
		void crop(int32 idx, int32 len);
		//@}

		//! \name Array inspection
		//@{
		int32 find(T val);
		int32 find(T val, int32 idx);
		int32 findNe(T val);
		int32 findNe(T val, int32 idx);
		T at(int32 idx);
		T max();
		T min();
		array<int32>* which();//!<returns indices of non-zero elements
		array<int32>* whichEq(T val);//!<returns indices of elements equal to val
		array<int32>* whichLt(T val);//!<returns indices of elements less than val
		array<int32>* whichLe(T val);//!<returns indices of elements less than or equal to val
		array<int32>* whichGt(T val);//!<returns indices of elements greater than val
		array<int32>* whichGe(T val);//!<returns indices of elements greater than or equal to val
		//@}
		
		//! \name component wise operations
		//@{
		int32 nz();//!< number of non-zero elements
		void scale(T mult);//!< multiply all components by mult
		template <class T2> void add(array<T2>& ar2);//!< add second array component by component
		template <class T2> void add(array<T2>& ar2,T mult);//!< add second array multiplied by mult component by component
		template <class T2> void sub(array<T2>& ar2);//!< subtract second array component by component
		template <class T2> bool isSubsetOf(array<T2>& ar2);//!< true if current array has zeros wherever ar2 has zeroes
		template <class T2> bool isSetEq(array<T2>& ar2);//!< combine arrays using AND operator
		template <class T2> void AND(array<T2>& ar2);//!< combine arrays using AND operator
		template <class T2> int32 ANDnz(array<T2>& ar2);//!< size of cutset
		template <class T2> void OR(array<T2>& ar2);//!< combine arrays using OR operator
		template <class T2> int32 ORnz(array<T2>& ar2);//!< size of set union
		template <class T2> void subSet(array<T2>& ar2);//!< substract(boolean) ar2 from current array
		template <class T2> int32 subSetnz(array<T2>& ar2);//!< size of set substraction (substract(boolean) ar2 from current array)
		//@}
#ifdef SCOPES_USEBOOSTSERIALIZATION
		friend class boost::serialization::access;
		template<class Archive> void serialize(Archive & ar, const unsigned int version) {
		  ar & boost::serialization::make_nvp("array",boost::serialization::base_object<std::vector<T> >(*this));
		}
#endif // SCOPES_USEBOOSTSERIALIZATION
	protected:
		void _set(const array& ar2,int32 idx, int32 len);
		void _fill(T val, int32 idx, int32 len);
		void _arrange(int32 idx, int32 &len, int32 srclen, bool repl);
};

//! Default constructor.
template <class T> array<T>::array(){
#ifdef DEBUG
	printf("array: standard constructor \n");fflush(stdout);
#endif
}

//! Constructor: allocate size elements.
template <class T> array<T>::array(int32 size){
	this->resize(size);
#ifdef DEBUG
	printf("array: standard constructor with size\n");fflush(stdout);
#endif
}

//! Constructor: fill size elements with val.
template <class T> array<T>::array(T val, int32 size){
	
	this->resize(size);
#ifdef DEBUG
	printf("array: standard constructor \n");fflush(stdout);
#endif
	this->replaceFill(val,size);
}

//! Copy constructor.
template <class T> array<T>::array(const array<T> &ar2){
	
#ifdef DEBUG
	printf("array: copy constructor \n");fflush(stdout);
#endif
	replace(ar2);
}
//! constructor with T* array.
template <class T> array<T>::array(const T* ar2,int32 size){
	
#ifdef DEBUG
	printf("array: T* constructor \n");fflush(stdout);
#endif
	int32 i;
	this->resize(size);
   for (i=0;i<size;i++) {
      (*this)[i] = (T) ar2[i];
   }
}
	

//! string constructor
template <class T> array<T>::array(const string &str){
	
	int32 pos=0;
	array(str,pos);
}
//! string constructor with position in string
template <class T> array<T>::array(const string &str, int32 &pos){
	
	int32 len;
	str.copy((char*) &len,sizeof(len),pos);pos+=sizeof(len);
#ifdef DEBUG
	printf("array: string constructor (pos=%ld,num=%ld)\n",pos-sizeof(len),len/sizeof(T));fflush(stdout);
#endif
	this->resize(len/sizeof(T));
	str.copy((char*) &(this->front()),len,pos);
	pos+=len;
}
//! Destructor.
template <class T> array<T>::~array(){
#ifdef DEBUG
	printf("array: destructor \n");fflush(stdout);
#endif
}


// vector wrappers

/*! \brief access element at index idx
\param idx element index to access
*/
template <class T> inline T& array<T>::operator[](int32 idx){
	return (this->_M_impl._M_start)[idx];
}
template <class T> inline const T& array<T>::operator[](int32 idx) const{
	return (this->_M_impl._M_start)[idx];
}

template <class T> inline T& array<T>::front(){
	return *(this->_M_impl._M_start);
}
template <class T> inline const T& array<T>::front() const{
	return *(this->_M_impl._M_start);
}

template <class T> inline T& array<T>::back(){
	return *(this->_M_impl._M_finish);
}
template <class T> inline const T& array<T>::back() const{
	return *(this->_M_impl._M_finish);
}

template <class T> inline int32 array<T>::size() const{
	return (int32) ((size_t) this->_M_impl._M_finish - (size_t)  this->_M_impl._M_start) / sizeof(T);
}

template <class T> inline void array<T>::insert(int32 idx, int32 len, const T& val){
	insert(this->begin()+idx,len,val);
}
template <class T> inline void array<T>::erase(int32 idx, int32 len){
	erase(this->begin()+idx,this->begin()+idx+len);
}



// array methods

/*!
	\brief Put new data in current array
	\param ar2 array containing the new data 
	
	Array ar2 is put at position 0 of the this array, overwriting the current content. The length of this array is increased if ar2 is larger than the current array.
*/
template <class T> inline void array<T>::put(const array& ar2){
	put(ar2,0);
}

/*!
	\overload
	\param ar2 array containing the data to replace
	\param idx index at which ar2 should be placed
	
	Array ar2 is put at position idx of the this array, overwriting the current content. The length of this array is increased if len(ar2)+idx is larger than the current array.
*/
template <class T> inline void array<T>::put( const array& ar2,int32 idx){
	put(ar2,idx,ar2.size());
}

/*!
	\overload
	\param ar2 array containing the data to replace
	\param idx index at which ar2 should be placed
	\param len length of the part which should be replaced
	
	Array ar2 is put at position idx of the this array, overwriting the current content (up to len elements). The length of this array is increased if idx+len is larger that the current length. In the current array, len elements are reserved even if the length of ar2 is shorter.
*/
template <class T> void array<T>::put(const array& ar2,int32 idx, int32 len){
	_arrange(idx,len,ar2.size(),false);
	_set(ar2,idx,len);
}

/*!
	\brief Replace this array by new data.
	\param ar2 array containing the data to replace
	
	Note: This array is replaced by ar2.
	The length of the array is now the length of ar2.
*/
template <class T> inline void array<T>::replace(const array& ar2){
	replace(ar2,0);
}
/*!
	\brief Replace part of a array by new data.
	\param ar2 array containing the data to replace
	\param idx index at which ar2 should be placed
	
	Note: everything from idx to the end of the array is replaced by ar2.
	The length of the array is changed acordingly.
*/
template <class T> inline void array<T>::replace(const array& ar2,int32 idx){
	replace(ar2,idx,this->size()-idx);
}

/*!
	\overload
	\param ar2 array containing the data to replace
	\param idx index at which ar2 should be placed
	\param len length of the part which should be replaced
	
	Note: everything from idx to idx+len of the array is replaced by ar2.
	The length of the array is changed accordingly.
*/
template <class T> void array<T>::replace(const array& ar2,int32 idx, int32 len){
	_arrange(idx,len,ar2.size(),true);
	_set(ar2,idx,len);
}

/*!
	\brief internal method copying data from a different array to the current array
	\param ar2 array containing the data to read from
	\param idx index at which the copied data should be placed
	\param len length of the part in current array that should be filled
	
	Fills len elements with data from ar2 from position idx in the current array. The length of the current array should already be arranged accordingly.
*/	
template <class T> void array<T>::_set(const array<T> &ar2, int32 idx,int32 len){
	int32 i;
   for (i=0;i<len;i++) {
      (*this)[i+idx] = (const_cast<array<T>& >(ar2))[i];
   }
}

/*!
	\brief Put a single value in current array
	\param val value to be set
	\param idx index at which the value should be placed
	
	Put one element of value val at position idx.
	The length of the array is changed if idx >= length of current array.
*/
template <class T> inline void array<T>::put(T val,int32 idx){
	fill(val,idx,1);
}

/*!
	\brief Fill the array with a single value
	\param val value with which part of the array should be filled
	\param idx index at which ar2 should be placed
	
	Everything from the beginning to the end of the array is filled with val.
*/
template <class T> inline void array<T>::fill(T val){
	fill(val,0);
}
/*!
	\brief Fill part of the array with a single value
	\param val value with which part of the array should be filled
	\param idx index at which ar2 should be placed
	
	Everything from idx to the end of the array is filled with val.
*/
template <class T> inline void array<T>::fill(T val,int32 idx){
	fill(val,idx,this->size()-idx);
}

/*!
	\overload
	\param val value with which part of the array should be filled
	\param idx index at which ar2 should be placed
	\param len length of the part which should be replaced
	
	Everything from idx to idx+len of the array is filled with val.
	The length of the array is changed if idx+len is larger than the current len.
*/
template <class T> void array<T>::fill(T val,int32 idx,int32 len){
	_arrange(idx,len,len,false);
	_fill(val,idx,len);
}

/*!
	\brief Replace the array by num values
	\param val value with which part of the array should be filled
	\param num number of values to be inserted
	
	Everything from the beginning to the end of the array is replaced by num values val.
	The length of the array will be num.
*/
template <class T> inline void array<T>::replaceFill(T val,int32 num){
	replaceFill(val,num,0);
}

/*!
	\brief Replace part of the array by num values
	\param val value with which part of the array should be filled
	\param num number of values to be inserted
	\param idx index at which ar2 should be placed
	
	everything from idx to the end of the array is replaced by num values.
	The length of the array is changed acordingly.
*/
template <class T> void array<T>::replaceFill(T val,int32 num, int32 idx){
	replaceFill(val,num,idx,this->size()-idx);
}

/*!
	\overload
	\param val value with which part of the array should be filled
	\param num number of values to be inserted
	\param idx index at which ar2 should be placed
	\param len length of the part which should be replaced
	
	Everything from idx to idx+len of the array is replaced by num values.
	The length of the array is changed acordingly.
*/
template <class T> void array<T>::replaceFill(T val,int32 num, int32 idx,int32 len){
	_arrange(idx,len,num,true);
	_fill(val,idx,len);
}

/*!
	\brief internal method writing single values in the array
	\param val value with which part of the array should be filled
	\param idx index at which new data should be placed
	\param len length of the part in current array that should be filled
	
	Fills len elements with val from index idx on. The length of the current array should already be arranged acordingly.
*/	
template <class T> void array<T>::_fill(T val, int32 idx,int32 len){
	int32 i;
   for (i=0;i<len;i++) {
      (*this)[i+idx] = val;
   }
}

/*!
	\brief internal method reserving the place in the current array
	\param idx index at which new data should be placed
	\param len length of the part in current array that should be replaced (by reference - may be changed)
	\param srclen length of the new data
	\param repl true if the new data should replace the old part or false if this should overwrite
	
	Note: len is always set to srclen, indicating that in the arranged array len=srclen elements are to be written
*/	
template <class T> void array<T>::_arrange(int32 idx, int32 &len, int32 srclen, bool repl){
	int32 curlen=this->size();

	if (len<0) len=curlen-idx+len; // count from end
	if (len<0) len=0;
	if (repl){
		if (idx+len>=curlen) {
			len=curlen-idx;
			if (srclen!=len){
				len=srclen;
				this->resize(idx+srclen);
			}
		} else {
			if (srclen>len){
				this->insert(idx,srclen-len,0);	
			} else if (srclen<len){
				this->erase(idx,len-srclen);
			}
			len=srclen;
		}
	} else {
		if (idx+len>curlen) this->resize(idx+len);
		if (len>srclen) len=srclen;
	}
}
template <class T> void array<T>::crop(int32 idx, int32 len){
	int32 curlen=this->size();
	if (idx<0) idx=curlen+idx;
	if (idx<0) idx=0;
	if (len<0) len=curlen-idx+len;
	if (len<0) {
		this->resize(0);
		return;
	}
	if (idx>0){
		if (idx>=curlen){
			this->resize(0);
			return;
		}
		this->erase(0,idx);
		curlen-=idx;
	}
	if (len>=curlen) return;
	this->resize(idx+len);
}
template <class T> void array<T>::del(int32 idx, int32 len){
	int32 curlen=this->size();
	if (idx<0) idx=curlen+idx;
	if (idx<0) idx=0;
	if (len<0) len=curlen-idx+len;
	if (len<0) return;
	if (idx>=curlen) return;
	this->erase(idx,len);
}


// array inspection

/*!
	\brief Find position of a specific value 
	\param val value to be looked for
	
	Returns the index of the first element with value val in the array.
	Returns -1 of val is not found.
*/
template <class T> int32 array<T>::find(T val){
	return find(val,0);
}

/*!
	\overload
	\param val value to be looked for
	
	Returns the index of the first element after or at position idx with value val in the array.
	Returns -1 of val is not found.
*/
template <class T> int32 array<T>::find(T val, int32 idx ){
	int32 curlen=this->size();
	int32 i;
	if (idx>=curlen) return -1;
	for (i=idx;i<curlen;i++){
		if ((*this)[i]==val) break;
	}
	if (i>=curlen) return -1;
	return i;
}


/*!
	\brief Find position of a value not equal to the specific value 
	\param val value to be looked for
	
	Returns the index of the first element whose value is not val in the array.
	Returns -1 of value!=val is not found.
*/
template <class T> int32 array<T>::findNe(T val){
	return findNe(val,0);
}

/*!
	\overload
	\param val value to be looked for
	
	Returns the index of the first element after or at position idx whose value is not val in the array.
	Returns -1 of value!=val is not found.
*/
template <class T> int32 array<T>::findNe(T val, int32 idx ){
	int32 curlen=this->size();
	int32 i;
	if (idx>=curlen) return -1;
	for (i=idx;i<curlen;i++){
		if ((*this)[i]!=val) break;
	}
	if (i>=curlen) return -1;
	return i;
}

/*!
	\brief Return element at specified position
	\param idx index of queried element
	
	returns reference to original element
*/
template <class T> T array<T>::at(int32 idx){
	return (*this)[idx];
}


/*!
	\brief maximum value of the array
	
	Note: returns (T) 0 if length of array is 0, so check length beforehand
*/
template <class T> T array<T>::max(){
	int32 curlen=this->size();
	int32 i;
	if (curlen<1) return 0;
	T mx=(*this)[0];
	for (i=0;i<curlen;i++){
		if ((*this)[i]>mx) mx=(*this)[i];
	}
	return mx;
}
/*!
	\brief minimum value of the array

	Note: returns (T) 0 if length of array is 0, so check length beforehand
*/
template <class T> T array<T>::min(){
	int32 curlen=this->size();
	int32 i;
	if (curlen<1) return 0;
	T mn=(*this)[0];
	for (i=0;i<curlen;i++){
		if ((*this)[i]<mn) mn=(*this)[i];
	}
	return mn;
}

/*!
	\brief prints the array to string

	Note: This only works for certain types T
*/
template <class T> string* array<T>::printToString(){
	int32 len=this->size();
	int32 i;
	string* str=new string();
	char charstr[50];
	str->append("[");
	for (i=0;i<len;i++){
		sprintf(charstr,"%ld ",(long int) (*this)[i]);
		str->append(charstr);
	}
	if (len) str->erase(str->length()-1,1);
	str->append("]");
	return str;
}
template <> inline string* array<double>::printToString(){
	int32 len=this->size();
	int32 i;
	string* str=new string();
	char charstr[50];
	str->append("[");
	for (i=0;i<len;i++){
		sprintf(charstr,"%g ",(*this)[i]);
		str->append(charstr);
	}
	if (len) str->erase(str->length()-1,1);
	str->append("]");
	return str;
}
/*!
	\brief prints the array to stdout

	Note: This only works for certain types T
*/
template <class T> inline void array<T>::print(){
	cout << *(this->printToString()) << endl;
//	printf("%s\n",this->printToString()->c_str);fflush(stdout);
}

//! creates a string containing a copy of the array data
template <class T> string* array<T>::toString(){
	string* str=new string();
	appendToString(*str);
	return str;
}
//! appends a copy of the array data to a string
template <class T> void array<T>::appendToString(string& str){
	int32 len=this->size()*sizeof(T);
	str.append((char*) &len,sizeof(len));
	str.append((char*) &(this->front()),len); 
}
template <class T> array<int32>* array<T>::which(){
	int32 len=this->size();
	array<int32>* ar2=new array<int32>();
	ar2->reserve(len);
	int32 i;
	for (i=0;i<len;i++){
		if ((*this)[i]) ar2->push_back(i);
	}
	return ar2;
}
template <class T> array<int32>* array<T>::whichEq(T val){
	int32 len=this->size();
	array<int32>* ar2=new array<int32>();
	ar2->reserve(len);
	int32 i;
	for (i=0;i<len;i++){
		if ((*this)[i]==val) ar2->push_back(i);
	}
	return ar2;
}
template <class T> array<int32>* array<T>::whichLt(T val){
	int32 len=this->size();
	array<int32>* ar2=new array<int32>();
	ar2->reserve(len);
	int32 i;
	for (i=0;i<len;i++){
		if ((*this)[i]<val) ar2->push_back(i);
	}
	return ar2;
}
template <class T> array<int32>* array<T>::whichLe(T val){
	int32 len=this->size();
	array<int32>* ar2=new array<int32>();
	ar2->reserve(len);
	int32 i;
	for (i=0;i<len;i++){
		if ((*this)[i]<=val) ar2->push_back(i);
	}
	return ar2;
}
template <class T> array<int32>* array<T>::whichGt(T val){
	int32 len=this->size();
	array<int32>* ar2=new array<int32>();
	ar2->reserve(len);
	int32 i;
	for (i=0;i<len;i++){
		if ((*this)[i]>val) ar2->push_back(i);
	}
	return ar2;
}
template <class T> array<int32>* array<T>::whichGe(T val){
	int32 len=this->size();
	array<int32>* ar2=new array<int32>();
	ar2->reserve(len);
	int32 i;
	for (i=0;i<len;i++){
		if ((*this)[i]>=val) ar2->push_back(i);
	}
	return ar2;
}
template <class T> void array<T>::selectFill(T val, array<int32> &idxs){
	int32 i;
	int32 len=idxs.size();
	for (i=0;i<len;i++){
		(*this)[idxs[i]]=val;
	}
}
template <class T> template <class T2> void array<T>::selectPut(const array<T2>& ar2, array<int32> &idxs){
	int32 i;
	int32 len=idxs.size();
	for (i=0;i<len;i++){
		(*this)[idxs[i]]=(T) ar2[i];
	}
}
template <class T> array<T>* array<T>::selectGet(array<int32> &idxs){
	int32 i;
	int32 len=idxs.size();
	array<T>* ar2=new array<T>(len);
	for (i=0;i<len;i++){
		(*ar2)[i]=(*this)[idxs[i]];
	}
	return ar2;
}

template <class T> template <class T2> array<T2>* array<T>::convertTo(){
	int32 len=this->size();
	array<T2>* ar2=new array<T2>(len);
	int32 i;
	for (i=0;i<len;i++){
		(*ar2)[i]=(T2) (*this)[i];
	}
	return ar2;
}
template <class T> inline array<T>* array<T>::copy(){
	return new array<T>(*this);
}


template <class T> inline int32 array<T>::nz(){
	int32 i;
	int32 num=0;
	for (i=0;i<this->size();i++){
		if ((*this)[i]) num++;
	}
	return num;
}
template <class T> template <class T2> inline void array<T>::add(array<T2>& ar2){
	int32 len=std::min(this->size(),ar2.size());
	int32 i;
	for (i=0;i<len;i++){
		(*this)[i]+=(T) ar2[i];
	}
}
template <class T> template <class T2> inline void array<T>::sub(array<T2>& ar2){
	int32 len=std::min(this->size(),ar2.size());
	int32 i;
	for (i=0;i<len;i++){
		(*this)[i]-=(T) ar2[i];
	}
}
template <class T> template <class T2> inline void array<T>::add(array<T2>& ar2,T mult){
	int32 len=std::min(this->size(),ar2.size());
	int32 i;
	for (i=0;i<len;i++){
		(*this)[i]+=mult * (T) ar2[i];
	}
}
template <class T> template <class T2> inline bool array<T>::isSubsetOf(array<T2>& ar2){
	int32 len=std::min(this->size(),ar2.size());
	int32 i;
	for (i=0;i<len;i++){
		if ((*this)[i] && (!ar2[i])) return false;
	}
	return true;
}
template <class T> template <class T2> inline bool array<T>::isSetEq(array<T2>& ar2){
	int32 len=std::min(this->size(),ar2.size());
	int32 i;
	for (i=0;i<len;i++){
		if (((*this)[i] && (!ar2[i])) || ((!(*this)[i]) && (ar2[i]))) return false;
	}
	return true;
}
template <class T> template <class T2> inline void array<T>::AND(array<T2>& ar2){
	int32 len=std::min(this->size(),ar2.size());
	int32 i;
	for (i=0;i<len;i++){
		(*this)[i]=(*this)[i] && ar2[i];
	}
}
template <class T> template <class T2> inline int32 array<T>::ANDnz(array<T2>& ar2){
	int32 len=std::min(this->size(),ar2.size());
	int32 i;
	int32 num=0;
	for (i=0;i<len;i++){
		if ((*this)[i] && ar2[i]) num++;
	}
	return num;
}
template <class T> template <class T2> inline void array<T>::OR(array<T2>& ar2){
	int32 len=std::min(this->size(),ar2.size());
	int32 i;
	for (i=0;i<len;i++){
		(*this)[i]=(*this)[i] || ar2[i];
	}
}
template <class T> template <class T2> inline int32 array<T>::ORnz(array<T2>& ar2){
	int32 len=std::min(this->size(),ar2.size());
	int32 i;
	int32 num=0;
	for (i=0;i<len;i++){
		if ((*this)[i] || ar2[i]) num++;
	}
	return num;
}
template <class T> template <class T2> inline void array<T>::subSet(array<T2>& ar2){
	int32 len=std::min(this->size(),ar2.size());
	int32 i;
	for (i=0;i<len;i++){
		if (ar2[i]) (*this)[i]=0;
	}
}
template <class T> template <class T2> inline int32 array<T>::subSetnz(array<T2>& ar2){
	int32 len=std::min(this->size(),ar2.size());
	int32 i;
	int32 num=0;
	for (i=0;i<len;i++){
		if ((*this)[i] && (!(ar2[i]))) num++;
	}
	return num;
}
#endif
