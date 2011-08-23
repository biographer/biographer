use SGraph;
use SGraph::Dot;
use Data::Dumper;
use strict;

die "no input data" unless -f $ARGV[0];
die "no output data" unless -f $ARGV[1];

my $g=new SGraph;

our $compcol=["white","green","red","cyan","yellow","brown"];
# read input format
my $fh;
open($fh,"<",$ARGV[0]);
my @lines=split(/\n/,join('',<$fh>));
close $fh;
my $l='';
while (!($l=~/^\//)) {
   $l=shift(@lines); #compartments
   my ($idx,$cp)=split(/ /,$l);
   next unless $cp;
   $g->add_node($cp,{shape=>"rect",fixedsize=>"true",color=>$compcol->[$idx]});
}

shift(@lines); # number of nodes;

my $nodes=[];
my $nidx=shift(@lines);

while (scalar(@lines) && (!($nidx=~/^\//))){
   my $type=shift(@lines);
   my $id=shift(@lines);
#   print "$id\n";
   my $cp=shift(@lines);# compartment
   my $x=shift(@lines);
   my $y=shift(@lines);
#   $x*=72;
#   $y*=72;
   my $w=shift(@lines)/72; # w
   my $h=shift(@lines)/72; # h
   shift(@lines); # dir;
   $g->add_node($id,{pos=>"$x,$y!",width=>$w,height=>$h,shape=>"rect",fixedsize=>"true",fillcolor=>$compcol->[$cp],style=>"filled"});
   $nodes->[$nidx]=$id;
   $nidx=shift(@lines) # next index;
}

our $arrowshapes={Product=>"normal",Substrate=>"normal",Catalyst=>"odot",Activator=>"onormal",Inhbitor=>"tee"};


shift(@lines); #skip first index

while (scalar(@lines)){
   my $l=shift(@lines);
   my ($type,$from,$to)=split(" ",$l);
   if ($type eq 'Product') {
#      my $h=$from;$from=$to;$to=$h;
   }
   $g->add_edge($nodes->[$from],$nodes->[$to],{arrowhead=>$arrowshapes->{$type}});
}

#read output format
$fh;
open($fh,"<",$ARGV[1]);
@lines=split(/\n/,join('',<$fh>));
close $fh;

while (scalar(@lines)){
   my $idx=shift(@lines); #index
   my $type=shift(@lines);
   my $id=shift(@lines);
#   print "$id\n";
   shift(@lines);# compartment
   my $x=shift(@lines);
   my $y=shift(@lines);
#   $x*=72;
#   $y*=72;
   my $w=shift(@lines); # w
   my $h=shift(@lines); # h
   my $d=shift(@lines)*180/3.14152; # dir;
   if ($type eq 'Compartment'){
       $x+=$w/2;
       $y+=$h/2;
      $g->set_attribute($id,"pos","$x,$y!");
      $g->set_attribute($id,"width",$w/72);
      $g->set_attribute($id,"height",$h/72);
      print "Compartment $id: $x,$y,$w,$h\n";
      
   } else {
      $g->set_attribute($id,"pos","$x,$y!");
      $x-=$w/2;
      $y-=$h/2;
      $g->set_attribute($id,"label",sprintf("%s (%d)\\n(%d,%d,%d,%d,%d°)",$id,$idx,$x,$y,$w,$h,$d));
   }
}

my $fn=$ARGV[0];
$fn=$ARGV[2] if $ARGV[2]; # third argument maybe output png file
$fn=~s/\.[^\.]*$//; # remove extension

#print $g->dot;
#open($f,"| tee $fn.lyt.dot | neato -n -Gpad=0 -Gmargin=0 -Gsplines=true -Gdpi=56 -Tpng -o $fn.png");
my $f;
open($f,"| neato -n -Gpad=0 -Gmargin=0 -Gsplines=true -Gdpi=56 -Tpng -o $fn.png");
print $f $g->dot;
close $f;
