# Simulator: SBML import/export #

SBML supports embedding of Boolean networks into files, but it's not yet supported, since there is no Javascript libSBML available.
Implementation is planned within 2012's Google Summer of Code.

## Logical Regulatory Graphs (LRG) ##

  * http://sbml.org/Community/Wiki/SBML_Level_3_Proposals/Qualitative_Models
  * http://sbml.org/images/a/a7/SBML-L3-qual-specification_0.1.pdf, page 7

### SBML-LRG (XML) representation of update rules ###
```
 ...
 <transition>
    <listOfInputs>       ...</listOfInputs>
    <listOfOutputs>      ...</listOfOutputs>
    <listOfFunctionTerms>...</listOfFunctionTerms>
 </transition>
 ...
```

### Function terms ###
```
 ...
 <listOfFunctionTerms>
    <defaultTerm resultLevel="0" />
    <functionTerm resultLevel="1">
       <math>
          ...
       </math>
    </functionTerm>
 </listOfFunctionTerms>
 ...
```

### Math example ###
```
  ... = (A or B) and (not C)
```
```
 ...
 <math>
   <and/>
   <apply>
     <or/>
     <ci>A</ci>
     <ci>B</ci>
   </apply>
   <apply>
     <not/>
     <ci>C</ci>
   </apply>
 </math>
 ...
```

### Example, taken from the PDF ###
the spaces don't belong there, but I'm too lazy to remove them now
```
<?xml version=” 1 . 0 ” e n c o d i n g=”UTF8” ?>
<sbml xmlns=” h t t p : //www. sbml . o r g / sbml / l e v e l 3 / v e r s i o n 1 ” l e v e l=” 3 ” version=” 1 ”
   x m l n s : q u a l=” h t t p : //www. sbml . o r g / sbml / l e v e l 3 / v e r s i o n 1 / q u a l / v e r s i o n 1 ”
   q u a l : r e q u i r e d=” t r u e ”>
  <model i d=” example ”>
    <listOfCompartments>
</listOfCompartments>
< q u a l : l i s t O f Q u a l i t a t i v e S p e c i e s xmlns=” h t t p : // sbml . o r g /Community/ Wiki /
      S B M L L e ve l 3 P ro p o s a l s / Q u a l i t a t i v e M o d e l s ”>
   <qualitativeSpecies i d=”A” maxLevel=” 2 ” compartment=” c y t o s o l ” />
   <qualitativeSpecies i d=”B” maxLevel=” 1 ” compartment=” c y t o s o l ” />
   <qualitativeSpecies i d=”C” maxLevel=” 1 ” compartment=” n u c l e u s ” />
</ q u a l : l i s t O f Q u a l i t a t i v e S p e c i e s>
< q u a l : l i s t O f T r a n s i t i o n s xmlns=” h t t p : // sbml . o r g /Community/ Wiki /
      S B M L L e ve l 3 P ro p o s a l s / Q u a l i t a t i v e M o d e l s ”>
   <t r a n s i t i o n i d=” t r B ”>
      <listOfInputs>
           <input i d=” theta B A ” qualitativeSpecies=”A” t h r e s h o l d L e v e l=” 1 ”
                    t r a n s i t i o n E f f e c t=” none ” sboTerm=” SBO:0000170 ” />
      </ listOfInputs>
      <listOfOutputs>
           <output qualitativeSpecies=”B” t r a n s i t i o n E f f e c t=” a s s i g n m e n t L e v e l ” />
      </ listOfOutputs>
      <listOfFunctionTerms>
           <functionTerm r e s u l t L e v e l=” 1 ”>
                <math> < !−− A >= 1−−>
                    <apply>
                        <geq/>
                        <c i>A</ c i>
                        <c i>theta B A</ c i>
                    </apply>
                </math>
           </functionTerm>
           <defaultTerm r e s u l t L e v e l=” 0 ” />
      </listOfFunctionTerms>
   </ t r a n s i t i o n>
   <t r a n s i t i o n i d=” t r A ”>
      <listOfInputs>
           <input i d=” theta A A1 ” qualitativeSpecies=”A” t h r e s h o l d L e v e l=” 1 ”
                    t r a n s i t i o n E f f e c t=” none ” sboTerm=” SBO:0000170 ” />
           <input i d=” theta A A2 ” qualitativeSpecies=”A” t h r e s h o l d L e v e l=” 2 ”
                    t r a n s i t i o n E f f e c t=” none ” sboTerm=” SBO:0000170 ” />
           <input i d=” theta A C ” qualitativeSpecies=”C” t h r e s h o l d L e v e l=” 1 ”
                    t r a n s i t i o n E f f e c t=” none ” sboTerm=” SBO:0000170 ” />
      </ listOfInputs>
      <listOfOutputs>
           <output qualitativeSpecies=”A” t r a n s i t i o n E f f e c t=” a s s i g n m e n t L e v e l ” />
      </ listOfOutputs>
      <listOfFunctionTerms>
           <functionTerm r e s u l t L e v e l=” 2 ”>
                <math> < !−− (A >= 1 and A < 2 ) or C < 1 −−>
                    <apply>
                        <or />
                        <apply>
                            <and/>
                            <apply>
                                 <geq/>
                                 <c i>A</ c i>
                                 <c i>t h e t a A A 1</ c i>
                                                               8
                      </apply>
                      <apply>
                           <l t />
                           <c i>A</ c i>
                           <c i>t h e t a A A 2</ c i>
                      </apply>
                   </apply>
                   <apply>
                      <l t />
                      <c i>C</ c i>
                      <c i>t h e t a A C</ c i>
                   </apply>
              </apply>
          </math>
      </functionTerm>
      <functionTerm r e s u l t L e v e l=” 1 ”>
          <math> < !−− A < 1 and C >= 1 −−>
              <apply>
                   <and/>
                   <apply>
                      <l t />
                      <c i>A</ c i>
                      <c i>t h e t a A A</ c i>
                   </apply>
                   <apply>
                      <geq/>
                      <c i>C</ c i>
                      <c i>t h e t a A C</ c i>
                   </apply>
              </apply>
          </math>
      </functionTerm>
      <defaultTerm r e s u l t L e v e l=” 0 ” />
  </listOfFunctionTerms>
</ t r a n s i t i o n>
<t r a n s i t i o n i d=” t r C ”>
  <listOfInputs>
      <input i d=” theta C B ” qualitativeSpecies=”B” t h r e s h o l d L e v e l=” 1 ”
              t r a n s i t i o n E f f e c t=” none ” sboTerm=” SBO:0000169 ” />
  </ listOfInputs>
  <listOfOutputs>
      <output qualitativeSpecies=”C” t r a n s i t i o n E f f e c t=” a s s i g n m e n t L e v e l ” />
  </ listOfOutputs>
  <listOfFunctionTerms>
      <functionTerm r e s u l t L e v e l=” 1 ”>
          <math> < !−− B >= 1 −−>
              <apply>
                   <geq/>
                   <c i>B</ c i>
                   <c i>t h e t a C B</ c i>
              </apply>
          </math>
      </functionTerm>
      <defaultTerm r e s u l t L e v e l=” 0 ” />
                                                         9
         </listOfFunctionTerms>
      </ t r a n s i t i o n>
    </ q u a l : l i s t O f T r a n s i t i o n s>
  </model>
</sbml>
```