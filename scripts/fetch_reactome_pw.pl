use LWP::Simple;
use JSON;
use strict;

my $addr="http://www.reactome.org/cgi-bin/entitylevelview/yuieventhierarchy?DB=gk_current&FOCUS_SPECIES_ID=48887";

die "provide js filename to save list" unless $ARGV[0];
my $f;
open($f,">",$ARGV[0]) or die "cannot open ".$ARGV[0];

my $list = scantree(fetch($addr));

print $f join("\n",@$list);

close $f;

sub fetch{
  my $addr=shift;
  my $cnt=get($addr);
  $cnt=~s/^\(//; # remove strange bracket around json (is that for jsonp?)
  $cnt=~s/\)$//;
  return JSON->new->utf8(0)->allow_nonref->decode($cnt);
}
sub scantree{
  my $json=shift;
  my $list=[];
  for my $p (@$json){
    if ($p->{hasdiagram}){
      print "fetching ".$p->{name}."\n";
      my $sublist=scantree(fetch($addr."&ID=".$p->{id}));
      if (! scalar(@$sublist)){ # push only tree nodes which have a diagram and which don't have any children with diagrams
        push(@$list,"<option label=\"".$p->{name}."\" value=\"".$p->{id}."\">".$p->{name}."</option>");
        print "added leaf ".$p->{name}."\n";
      } else {
        push(@$list,"<optgroup label=\"".$p->{name}."\">");
        push(@$list,@$sublist);
        push(@$list,"</optgroup>");
        
      }
    }
  }
  return $list;
}




