# Copyright (c) 2011, Thomas Handorf, The Biographer Community

# This file is part of Biographer.
# 
# Biographer is free software: you can redistribute it and/or modify
# it under the terms of the GNU Lesser General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# Biographer is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU Lesser General Public License
# along with Biographer.  If not, see <http://www.gnu.org/licenses/>.

use SGraph;
use SGraph::Dot;
use Data::Dumper;

die "no input graph" unless -f $ARGV[0];

our $comporder={Nucleus=>7,Cytosol=>4,Plasmamembrane=>2,Extracellular=>1};
our $tr={substrate=>Substrate,product=>Product,inhibitor=>Inhibitor,catalyst=>Catalyst,activator=>Activator};
our $ntr={compound=>Compound,reaction=>Reaction};
my $g=new SGraph;
$g->dot($ARGV[0]);

my $fn=$ARGV[0];
$fn=~s/\.[^\.]*$//; # remove extension
$fn.=".dat";
$fn=$ARGV[1] if $ARGV[1];

our $fh;
open($fh,">",$fn);

print $fh "# graph exchange format mini docu:\n";
print $fh "# --------------------------------\n";
print $fh "# number of compartments\n";
print $fh "# node index \" \" node name     (note: 0 is unknown)\n";
print $fh "# ...\n";
print $fh "# ///\n";
print $fh "# number of nodes\n";
print $fh "# node index\n";
print $fh "# node type\n";
print $fh "# node id/name\n";
print $fh "# node compartment\n";
print $fh "# node x\n";
print $fh "# node y\n";
print $fh "# node width\n";
print $fh "# node height\n";
print $fh "# node direction\n";
print $fh "# ...\n";
print $fh "# ///\n";
print $fh "# number of edges\n";
print $fh "# edgetype from to\n";
print $fh "# ...\n";

my $g2=new SGraph;
my $comps={};
for my $n (@{$g->nodes}){ # go through graph, get compartments, create graph w/o edges for node sizes
   my $c=$g->get_attribute($n,"compartment");
   die "unkown compartment $c" if $c && ! exists $comporder->{$c};
   $comps->{$c}=1 if $c;
   $g2->add_node($n,$g->get_attributes($n));
}
print Dumper $comps;
my @comps=sort {$comporder->{$a}<=>$comporder->{$b}} keys %$comps;
my $compsh={};
@{$compsh}{@comps}=(1..(scalar(@comps)));
print $fh scalar(@comps)."\n";
for my $c (@comps){
   print $fh $compsh->{$c}." $c\n";
}
print $fh "///\n";
# create node layout for node sizes
my $fx;
open($fx,"| dot -Grankdir=LR -Gpad=0 -Gmargin=0 -Gbgcolor=transparent -Gsplines=true -Goverlap=false -Gsplines=true -Gdpi=56 -Tdot -o $fn.lyt");
print $fx $g->dot;
close $fx;
$g2->dot("$fn.lyt");

# node list
my $nodesh={}; # indexes of the nodes
my $cc=0;
my $s=''; # string rep of list
for my $n (@{$g->nodes}){
   my $type=$g->get_attribute($n,"type");
   print "unkown node type ".$ntr->{$type} unless exists $ntr->{$type};
   next unless exists $ntr->{$type};
   $s.="$cc\n";
   $nodesh->{$n}=$cc;
   $s.=$ntr->{$type}."\n";
   $s.="$n\n";
   my $c=$g->get_attribute($n,"compartment");
   $s.=($c ? $compsh->{$c} : 0)."\n"; # compartment index
   $s.="0.0\n"; # x
   $s.="0.0\n"; # y 
   $s.=$g2->get_attribute($n,"width")."\n"; # w
   $s.=$g2->get_attribute($n,"height")."\n"; # h
   $s.="0.0\n"; # dir
   $cc++;
}
print $fh "$cc\n";
print $fh $s;
print $fh "///\n";

$cc=0;
$s='';
for my $e (@{$g->edges}){
   my $type=$g->get_attribute($e,"type");
   print "unkown edge type ".$tr->{$type} unless exists $tr->{$type};
   next unless exists $tr->{$type};
   $e=[$e->[1],$e->[0]] if $type ne "product"; # switch order for non-products 
   $s.=$tr->{$type}." ";
   $s.=$nodesh->{$e->[0]}." ".$nodesh->{$e->[1]};
   $s.="\n";
   $cc++;
}
print $fh "$cc\n";
print $fh $s;
close $fh;
