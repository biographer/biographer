use SGraph;
use SGraph::Dot;
use Data::Dumper;

die "no input graph" unless -f $ARGV[0];
die "no input data" unless -f $ARGV[1];

my $g=new SGraph;
$g->dot($ARGV[0]);
my $fn=$ARGV[0];
$fn=~s/\.[^\.]*$//; # remove extension

my @lines=split(/\n/,`cat $ARGV[1]`);
while ($lines[0] ne 'Reaction' && $lines[0] ne 'Compound'){
   shift(@lines);
}

while (scalar(@lines)){
   my $type=shift(@lines);
   my $id=shift(@lines);
   print "$id\n";
   my ($x,$y)=split(/\s/,shift(@lines));
   $x*=72;
   $y*=72;
   $g->set_attribute($id,"pos","$x,$y!");
   shift(@lines); # w,h
   shift(@lines); # dir;
   shift(@lines) if scalar(@lines); # next index;
}

open($f,"| tee $fn.lyt.dot | neato -n -Gpad=0 -Gmargin=0 -Gbgcolor=transparent -Gsplines=true -Gdpi=56 -Tpng -o $fn.png");
print $f $g->dot;
close $f;
