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
die "no input data" unless -f $ARGV[1];

my $g=new SGraph;
$g->dot($ARGV[0]);
my $fn=$ARGV[0];
$fn=~s/\.[^\.]*$//; # remove extension

my $fh;
open($fh,"<",$ARGV[1]);
my @lines=split(/\n/,join('',<$fh>));
while ($lines[0] ne 'Reaction' && $lines[0] ne 'Compound'){
   shift(@lines);
}

while (scalar(@lines)){
   my $type=shift(@lines);
   my $id=shift(@lines);
   print "$id\n";
   shift(@lines);# compartment
   my $x=shift(@lines);
   my $y=shift(@lines);
   $x*=72;
   $y*=72;
   $g->set_attribute($id,"pos","$x,$y!");
   shift(@lines); # w
   shift(@lines); # h
   shift(@lines); # dir;
   shift(@lines) if scalar(@lines); # next index;
}

#open($f,"| tee $fn.lyt.dot | neato -n -Gpad=0 -Gmargin=0 -Gsplines=true -Gdpi=56 -Tpng -o $fn.png");
open($f,"| neato -n -Gpad=0 -Gmargin=0 -Gsplines=true -Gdpi=56 -Tpng -o $fn.png");
print $f $g->dot;
close $f;
