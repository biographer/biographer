package BioNet2::BiographerJSON;

use strict;
use BioNet2;
use Sets;
use Data::Dumper;

our $type2sbo={Protein=>252,SimpleCompound=>247,Complex=>253,Reaction=>167,Compartment=>290,Compound=>240};

our $edge2sbo={Substrate=>15,Product=>11,Catalyst=>13,Activator=>462,Inhibitor=>20};
our $mod2sbo={"MAP:acetylation"=>215,"MAP:active"=>111101,"MAP:glycosylation"=>217,"MAP:glycosylphosphatidylinositolation"=>111100,
"MAP:hydroxylation"=>233,"MAP:inactive"=>111102,"MAP:methylation"=>214,"MAP:myristoylation"=>219,"MAP:palmitoylation"=>218,"MAP:phosphorylation"=>216,
"MAP:ubiquitination"=>224,"MAP:unknownModification"=>111100,"PID:PTM_active1"=>111101,"PID:PTM_active2"=>111101,"PID:PTM_farnesylation"=>111100,
"PID:PTM_geranylgeranylation"=>111100,"PID:PTM_glycosaminoglycan"=>111100,"PID:PTM_oxidation"=>111100,"PID:PTM_sumoylation"=>111100};

sub BioNet2::Base::exportBiographer{
   my $net=shift;
   my $limnodes=shift;
   my $xchg={nodes=>[],edges=>[],cpidx=>{},lastcpidx=>1,nodeidx=>{},lastnodeidx=>0,nhash=>{}};
   my $nhash={};
   my $coms=$net->listCompounds;
   my $nodeidx={}; # for continuous node indexes for all shown (non-abstract) nodes; needed for layout
   my $maxnidx=0;
   my $maxcpidx=0;
   my $cpidx={}; # for compartment indexes; needed for layout
   sub _getCompartment{
      my $net=shift;
      my $xchg=shift;
      my $c=shift;
      my $mem=shift; # the compound that requested this compartment
      if (exists $xchg->{nhash}->{$c}){
         push(@{$xchg->{nodes}->[$xchg->{nhash}->{$c}]->{data}->{subnodes}},$mem);
         return $c;
      }
      my $nd={};
      $nd->{id}=$c;
      
      $nd->{type}=$net->getNodeType($c); # Compartment
      $nd->{sbo}=$type2sbo->{$nd->{type}};
      $nd->{is_abstract}=0;
      $nd->{data}->{label}=$net->getName($c);
      $nd->{data}->{ref}=$c;
      # Note, all members are set during subsequent calls
      push(@{$nd->{data}->{subnodes}},$mem);

      $nd->{index}=$xchg->{lastcpidx};
      $xchg->{cpidx}->{$c}=$nd->{index};
      $xchg->{lastcpidx}++;
      
      $xchg->{nhash}->{$c}=scalar(@{$xchg->{nodes}});
      push(@{$xchg->{nodes}},$nd);
      return $c;
   }
   sub _getCompound{
      my $net=shift;
      my $xchg=shift;
      my $c=shift;
      my $post=shift;
      my $nocomp=shift; # do not add to compartment (for complex members)
      my $nd={};
      my $pts=$net->getProperties($c);
#      print Dumper $pts;
      $nd->{id}=$c.$post;
      return $nd->{id} if exists $xchg->{nhash}->{$nd->{id}}; # already processed
      $nd->{type}=$net->getNodeType($c);
      $nd->{sbo}=$type2sbo->{$nd->{type}};
      print "unknown sbo for ".$nd->{type}."\n" unless $nd->{sbo};
      $nd->{is_abstract}=1; # note make all compounds in reactions non abstract (later in reactions loop)
      $nd->{data}->{label}=$pts->{Name}->[0];
      if ((!$nocomp) && exists $pts->{Compartment} && scalar keys %{$pts->{Compartment}}){
         $nd->{data}->{compartment}=(keys %{$pts->{Compartment}})[0] ;
         _getCompartment($net,$xchg,$nd->{data}->{compartment},$nd->{id});
         $nd->{data}->{compartmentidx}=$xchg->{cpidx}->{$nd->{data}->{compartment}};
      } else {
         $nd->{data}->{compartmentidx}=0;
      }
      $nd->{data}->{modification}=[];
      $nd->{data}->{ref}=$c;
      if (exists $pts->{ComplexMember} && scalar keys %{$pts->{ComplexMember}}){
         for my $m (keys %{$pts->{ComplexMember}}){
            # always copy
            my $st=$pts->{ComplexMember}->{$m};
            for (my $i=0;$i<$st;$i++){
               push(@{$nd->{data}->{subnodes}},_getCompound($net,$xchg,$m,"_${c}_${i}".$post,1));
            }
         }
      }
      for my $m (@{$pts->{Modification}}){
         push(@{$nd->{data}->{modification}},[$mod2sbo->{$m->{type}},$m->{position}]);
      }
#      $nd->{data}->{subnodes}=[keys %{$pts->{ComplexMember}}] if exists $pts->{ComplexMember} && scalar keys %{$pts->{ComplexMember}};
      $xchg->{nhash}->{$nd->{id}}=scalar(@{$xchg->{nodes}});
      push(@{$xchg->{nodes}},$nd);
      return $nd->{id};
   }
   my $ecc=0; # edge counter
   my $reas=($limnodes ? setcut($net->listReactions,$limnodes)  : $net->listReactions);
   for my $r (@$reas){
      my $nd={};
      my $pts=$net->getProperties($r);
      $nd->{id}=$r;
      $nd->{type}=$net->getNodeType($r); # Reaction
      $nd->{sbo}=$type2sbo->{$nd->{type}};
      $nd->{is_abstract}=0;
      $nd->{data}->{label}=$pts->{Name}->[0];
      $nd->{data}->{ref}=$r;
      $nd->{data}->{x}=0; # some reasonable dummy values for x,y,w,h,dir
      $nd->{data}->{y}=0;
#       $nd->{data}->{width}=10; // commented out : don't export data we don't know
#       $nd->{data}->{height}=10;
      $nd->{data}->{dir}=0;
      $nd->{data}->{compartmentidx}=0; # always set to "unknown compartment" as it should just depend on reactant compartments

      $nd->{index}=$xchg->{lastnodeidx};
      $xchg->{nodeidx}->{$r}=$nd->{index};
      $xchg->{lastnodeidx}++;

      $xchg->{nhash}->{$r}=scalar(@{$xchg->{nodes}});
      push(@{$xchg->{nodes}},$nd);
      my $coms=[];
      my $types=[];
      my $dummy='dummy';
      push(@$coms,@{$net->getSubstratesList($r)});
      push(@$types,('Substrate') x (scalar(@$coms)-scalar(@$types)));
      push(@$coms,@{$net->getProductsList($r)});
      push(@$types,('Product') x (scalar(@$coms)-scalar(@$types)));
      push(@$coms,@{$net->getCatalysts($r)});
      push(@$types,('Catalyst') x (scalar(@$coms)-scalar(@$types)));
      push(@$coms,@{$net->getActivators($r)});
      push(@$types,('Activator') x (scalar(@$coms)-scalar(@$types)));
      push(@$coms,@{$net->getInhibitors($r)});
      push(@$types,('Inhibitor') x (scalar(@$coms)-scalar(@$types)));
      push(@$coms,@{$net->getInhibitedSubstrates($r)});
      push(@$types,('SInhibit') x (scalar(@$coms)-scalar(@$types)));
  
    
      for my $c (@$coms){
         my $t=shift(@$types);
         if ($c ne $dummy && $net->getProperty($c,"Currency")){
            $c=_getCompound($net,$xchg,$c,"_$r");
         } else {
            $c=_getCompound($net,$xchg,$c,"");
         }
         print "$c\n";
         my $nd2=$xchg->{nodes}->[$xchg->{nhash}->{$c}];
         $nd2->{is_abstract}=0; # show this compound
         if (!exists $xchg->{nodeidx}->{$c}){ # define nodeidx of compound if not yet defined, these are only compounds which are visible!
            $nd2->{index}=$xchg->{lastnodeidx};
            $xchg->{nodeidx}->{$c}=$nd2->{index};
            $xchg->{lastnodeidx}++;
            $nd2->{data}->{x}=0; # some reasonable dummy values for x,y,w,h,dir
            $nd2->{data}->{y}=0;
#             $nd2->{data}->{width}=10;
#             $nd2->{data}->{height}=10;
            $nd2->{data}->{dir}=0;
         }
         my $e={id=>$ecc++};
         $e->{sbo}=$edge2sbo->{$t};
         $e->{type}=$t;
         if ($t eq 'Product' || $t eq 'SInhibit'){
            $e->{source}=$r;
            $e->{target}=$c;
            $e->{sourceidx}=$xchg->{nodeidx}->{$r};
            $e->{targetidx}=$xchg->{nodeidx}->{$c};
         } else {
            $e->{source}=$c;
            $e->{target}=$r;
            $e->{sourceidx}=$xchg->{nodeidx}->{$c};
            $e->{targetidx}=$xchg->{nodeidx}->{$r};
         }
         push(@{$xchg->{edges}},$e);
      }
   }
   # FIXME add export of other nodetypes in $limnodes
   delete $xchg->{nhash};
   delete $xchg->{cpidx};
   delete $xchg->{nodeidx};
   delete $xchg->{lastcpidx};
   delete $xchg->{lastnodeidx};
   
   return $xchg;

}
sub export2Layouter{
   my $xchg=shift;
   my $out='';
   my $s='';
   my $num=0;
   for my $n (@{$xchg->{nodes}}){
      next if $n->{is_abstract};
      if ($n->{type} eq 'Compartment'){
         $s.=$n->{index}." ".$n->{id}."\n";
         $num++;
      }
   }
   $out.=$num."\n".$s."///\n";
   $s='';
   $num=0;
   for my $n (@{$xchg->{nodes}}){
      next if $n->{is_abstract};
      if ($n->{type} ne 'Compartment'){
         my $tp=($n->{type} eq 'Reaction' ? 'Reaction' : 'Compound');
         $s.=$n->{index}."\n".$tp."\n".$n->{id}."\n";
         $s.=($n->{data}->{compartmentidx} ? $n->{data}->{compartmentidx} : 0)."\n";
         $s.=($n->{data}->{x} ? $n->{data}->{x} :0 )."\n";
         $s.=($n->{data}->{y} ? $n->{data}->{y} :0) ."\n";
         $s.=($n->{data}->{width} ? $n->{data}->{width} : 0)."\n";
         $s.=($n->{data}->{height} ? $n->{data}->{height} : 0)."\n";
         $s.=($n->{data}->{dir} ? $n->{data}->{dir} : 0)."\n";
         $num++;
      }
   }
   $out.=$num."\n".$s."///\n";
   $s='';
   $num=0;
   for my $e (@{$xchg->{edges}}){
      $s.=$e->{type}." ".$e->{sourceidx}." ".$e->{targetidx}."\n";
      $num++;
   }
   $out.=$num."\n".$s;
   return $out;
}
sub layouter2xchg{
   my $xchg=shift;
   my $file=shift;
   my $nodeh={};
   my $cc=0;
   for my $n (@{$xchg->{nodes}}){
      $nodeh->{$n->{id}}=$cc;
      $cc++;
   }
   print Dumper $nodeh;
   print "reading $file\n";
   my $f;
   open($f,"<",$file);
   my @lines=split(/\n/,join('',<$f>));
   close $f;
   my $minx=1000000000000000000;
   my $miny=1000000000000000000;
   while (scalar(@lines)){
      my $idx=shift(@lines);
      my $type=shift(@lines);
      my $id=shift(@lines);
      my $compartment=shift(@lines);
      my $x=shift(@lines);
      my $y=shift(@lines);
      my $w=shift(@lines);
      my $h=shift(@lines);
      my $dir=shift(@lines);
      print "id ".$id." index ".$nodeh->{$id}."($x,$y)+($w,$h)\n";
      next unless exists $nodeh->{$id}; # 0 compartment may not be given
      if ($type eq 'Compartment'){
         $xchg->{nodes}->[$nodeh->{$id}]->{data}->{x}=1*$x;
         $xchg->{nodes}->[$nodeh->{$id}]->{data}->{y}=-$y-$h;
         $xchg->{nodes}->[$nodeh->{$id}]->{data}->{width}=1*$w;
         $xchg->{nodes}->[$nodeh->{$id}]->{data}->{height}=1*$h;
      } elsif (InSet([keys %$type2sbo],$type)){ #warning: contains Compartment too
         $xchg->{nodes}->[$nodeh->{$id}]->{data}->{x}=1*$x-$w/2;
         $xchg->{nodes}->[$nodeh->{$id}]->{data}->{y}=-$y-$h/2;
      } else {
         die "Ups, runaway data? (".$type.") id ".$id."\n";
      }
      $minx=$xchg->{nodes}->[$nodeh->{$id}]->{data}->{x} if $minx>$xchg->{nodes}->[$nodeh->{$id}]->{data}->{x};
      $miny=$xchg->{nodes}->[$nodeh->{$id}]->{data}->{y} if $miny>$xchg->{nodes}->[$nodeh->{$id}]->{data}->{y};
      #print Dumper $xchg->{nodes}->[0];
   }
   for my $n (@{$xchg->{nodes}}){ # make all coords positive (move left top to (0,0)
      $n->{data}->{x}-=$minx if exists $n->{data}->{x};
      $n->{data}->{y}-=$miny if exists $n->{data}->{y};
   }
   for my $n (@{$xchg->{nodes}}){ # make coordinates relative to compartments
      if (exists $nodeh->{$n->{data}->{compartment}}){
         my $cp=$nodeh->{$n->{data}->{compartment}};
         $n->{data}->{x}-=$xchg->{nodes}->[$cp]->{data}->{x};
         $n->{data}->{y}-=$xchg->{nodes}->[$cp]->{data}->{y};
      }
   }
}