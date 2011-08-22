# Copyright (c) 2011, Thomas Handorf

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

#partially taken from old Graph::Writer::Dot
package SGraph::Dot;

use strict;

our $makeClusters=0;

sub SGraph::view{
	my $G=shift;
	my $prog=shift;
	$prog="dot" if !$prog;
	open(F12GGers,">/tmp/graphview4er4.dot");
	print F12GGers $G->dot;
	close F12GGers;
#	system($prog.' -Tps /tmp/graphview4er4.dot | poster -mA4 -pA4 -o /tmp/graphview4er4.eps;rm /tmp/graphview4er4.dot;gv /tmp/graphview4er4.eps &');
#	system($prog.' -Tps /tmp/graphview4er4.dot | poster -mA4 -pA4 -o /tmp/graphview4er4.eps;gv /tmp/graphview4er4.eps &');
	system($prog.' -Tps /tmp/graphview4er4.dot -o /tmp/graphview4er4.eps;cat /tmp/graphview4er4.eps | okular - &');
}
sub SGraph::dot
{
	my $graph = shift;
	my $fn=shift;
	return read_dot($graph,$fn) if -e $fn;
   my $dot='';
	my $gtype=($graph->directed ? "digraph" : "graph");
   my $gn = $graph->has_attribute('name') ? $graph->get_attribute('name') : 'g';
   $dot.="$gtype $gn\n{\n";

	my $subgraphed={};
	my $arr=($graph->directed ? "->" : "--");
   

   #-------------------------------------------------------------------
   # Dump out any overall attributes of the graph
   #-------------------------------------------------------------------
   my $attributes = $graph->get_attributes();
   my @keys = keys %$attributes;
   if (@keys > 0){
   	$dot.="  /* graph attributes */\n";
   	foreach my $a (@keys){
	      $dot.="  $a = \"".$attributes->{$a}."\";\n";
   	}
   }

   #-------------------------------------------------------------------
   # Generate a list of nodes, with attributes for those that have any.
   #-------------------------------------------------------------------
   $dot.="\n  /* list of nodes */\n";
   foreach my $sg (@{$graph->get_subgraphs()}){
      if ($makeClusters){
         $dot.="subgraph cluster_$sg {\n";
      } else {
         $dot.="subgraph $sg {\n";
      }
   	my $sgattributes = $graph->get_attributes($sg);
		my @keys = keys %$sgattributes;
		if (@keys > 0){
     		$dot.="   graph [". join(',', map { if ($_ ne "label") {"$_=\"".$sgattributes->{$_}."\""} else {  my $k=$_;my $x=$sgattributes->{$_}; ($x=~/^\<\</) ? "$k=$x" : "$k=\"$x\""} } @keys). "];\n";
     		# includes special treatment for html labels
     	}
   	foreach my $v (sort(@{$graph->get_subgraph($sg)})){
	   	next if $graph->is_subgraph($v);
	   	next if $subgraphed->{$v};
	   	$subgraphed->{$v}=1;
			$dot.="  \"$v\"";
			my $attributes = $graph->get_attributes($v);
			my @keys = keys %$attributes;
			if (@keys > 0){
				$dot.=" [". join(',', map { if ($_ ne "label") {"$_=\"".$attributes->{$_}."\""} else {  my $k=$_;my $x=$attributes->{$_}; ($x=~/^\<\</) ? "$k=$x" : "$k=\"$x\""} } @keys). "]";
				# includes special treatment for html labels
			}
			$dot.=";\n";
	   }
	   $dot.="};\n";
   }
   foreach my $v (sort(@{$graph->nodes()})){
   	next if $graph->is_subgraph($v);
   	next if $subgraphed->{$v};
   	$dot.="  \"$v\"";
   	my $attributes = $graph->get_attributes($v);
   	my @keys = keys %$attributes;
		if (@keys > 0){
      	$dot.=" [". join(',', map { if ($_ ne "label") {"$_=\"".$attributes->{$_}."\""} else {  my $k=$_;my $x=$attributes->{$_}; ($x=~/^\<\</) ? "$k=$x" : "$k=\"$x\""} } @keys). "]";
      	# includes special treatment for html labels
   	}
   	$dot.=";\n";
   }

   #-------------------------------------------------------------------
   # Generate a list of edges, along with any attributes
   #-------------------------------------------------------------------
   $dot.="\n  /* list of edges */\n";
   my $edges = $graph->edges;
	my $multi=$graph->is_multiedge;
   while (@$edges > 0){
   	my ($from, $to) = @{shift(@$edges)};
		my $multi=$graph->get_multiedges($from,$to);
   	$from="cluster_".$from if $graph->is_subgraph($from);
   	$to="cluster_".$to if $graph->is_subgraph($to);
		for my $e (@$multi){
			$dot.="  \"$from\"$arr\"$to\"";
			my $attributes = $graph->get_attributes($e);
			my @keys = keys %$attributes;
			if (@keys > 0){
				$dot.=" [". join(',', map { "$_ = \"".$attributes->{$_}."\"" } @keys). "]";
			}
			$dot.=";\n";
		}
   }
   $dot.="}\n";

   return $dot;
}
sub read_dot{
	my $g=shift;
	my $fn=shift;
	my $fh;
	open($fh,"<",$fn);
	my $dot=join('',<$fh>);
	$dot=~s/\\\s*\n//gsm; # line continuation "...\"
	my $gett=sub{ # get token
		my $q=shift;
		#print "*";
		while (($dot=~/\G\s*/gsmc) || ($dot=~/\G\/\*.*?\*\//gc) || ($dot=~/\G\/\/.*/gc)){}; # remove spaces newlines and comments
		#print "\b ";
		my $t;
		if ($q){
			if ($q=~/^\//){
				$q=~s/^\///;
				$q=~s/\/$//;
				if ($q=~/[^\\]\(/){ # FIXME be careful with '(' inside $q
					$dot=~/\G(?:$q)/gc;
					$t=$1;
				} else {
					$dot=~/\G($q)/gc;
					$t=$1;
				}
			} else {
				$dot=~/\G(\Q$q\E)/gc;
				$t=$1;
			}
			die "expected token /($q)/ in $t".substr($dot,pos($dot)-10,20) unless $t;
		} elsif ($dot=~/\G(\w[\w\.]*)/gc){
			$t=$1;
		} elsif ($dot=~/\G\"/gc){
			my $chr;
			my $i=pos($dot);
			my $s=$i;
			$chr=substr($dot,$i,1);
			while ($chr ne '"'){
				$i++;
				$chr=substr($dot,$i,1);
				if ($chr eq "\\"){
					$i+=2;
					$chr=substr($dot,$i,1);
				}
			}
			$t=substr($dot,$s,$i-$s);
			pos($dot)=$i+1;
		} elsif ($dot=~/\G\'(.*?)\'/gc){
			$t=$1;
		} elsif ($dot=~/\G(\<\<.*?\>\>)/gc){ # special for html labels in dot
			$t=$1;
		} else {
			$dot=~/\G(.)/gc;
			$t=$1;
		}
		#print "$t ";
		return $t;
	};
	my $nodes={};
	my $edges=[];
	&$gett('/\w*?graph/');
	my $name=&$gett();
	&$gett('{');
	my $id=&$gett();
	my $subgraphlvl=[];
	my $subgraphs={};
	while ($id ne '}' || scalar(@$subgraphlvl)){
		my $attr={};
		# FIXME implement subgraphs here
		if ($id eq 'subgraph'){
			my $sid=&$gett();
			&$gett('{');
			$subgraphs->{$sid}=[];
			push(@$subgraphlvl,$sid);
			$id=&$gett();next;
		}
		if ($id eq '}'){
			pop(@$subgraphlvl); # subgraph end
			$id=&$gett();next;
		}
		my $next=&$gett('/\[|\<\=\>|\-\>|\;//');
		my $edgeids=[$id];
		while (($next eq '<=>') || ($next eq '->')){
			my $last=$edgeids->[-1];
			push(@$edgeids,$last,&$gett());
			$next=&$gett('/\[|\<\=\>|\-\>|\;//');
		}
		if ($next eq '='){# graph attr statemnt without "graph"
			my $attr->{$id}=&$gett();
			$id="graph";
			$next=&$gett(';');
		}
		if ($next eq '['){# attributes of nodes edges of "graph" "node" or "edge"
			do {
				my $attrid=&$gett();
				&$gett('=');
				my $attrval=&$gett();
				$attr->{$attrid}=$attrval;
				$next=&$gett('/\,|\]/');
			} until ($next eq ']');
			$next=&$gett(';');
		}
		if ($next eq ';'){
			if (scalar(@$edgeids)>1){
				shift(@$edgeids);
				while (scalar(@$edgeids)){
					push(@$edges,[shift(@$edgeids),shift(@$edgeids),$attr]);
				}
			} else {
				push(@{$subgraphs->{$subgraphlvl->[-1]}},$id) if scalar(@$subgraphlvl);
				if (scalar(@$subgraphlvl) && ($id eq 'graph' || $id eq 'node' || $id eq 'edge')){
					unless ($id eq 'graph'){
						$id=undef;
					} else {
						$id=$subgraphlvl->[-1]; # write graph attr to node of id equal to subgraph name
					}
				}
				if ($id){
					$nodes->{$id}={} unless exists $nodes->{$id};
					SGraph::addhash($nodes->{$id},$attr);# allows repetitive definitions 
				}
			}
		} else {
			die "';' expected";
		}
		$id=&$gett();
	}
	$g->clear;
	my $graphattr=$nodes->{graph};
	my $nodeattr=$nodes->{node};
	my $edgeattr=$nodes->{edge};
	my $hopt=$g->get_option('mergeattributes');
	$g->set_options(mergeattributes=>1);
	delete @{$nodes}{qw(graph edge node)};
	$g->set_attributes($graphattr);
	for my $n (keys %$nodes){
		$g->add_node($n,$nodeattr) if $nodeattr;
		$g->add_node($n,$nodes->{$n});
	}
	for my $e (@$edges){
		$g->add_edge($e->[0],$e->[1],$edgeattr) if $edgeattr;
		$g->add_edge($e->[0],$e->[1],$e->[2]);
	}
	for my $s (keys %$subgraphs){
		$g->add_subgraph($s,$subgraphs->{$s},$nodes->{$s});
	}
	$g->set_options(mergeattributes=>$hopt);
}
# sub read_dot{
# 	my $g=shift;
# 	my $fn=shift;
# 	my $dot=`cat $fn`;
# 	$dot=~s/\\\s*\n//gsm;
# #	$dot=~s/\n//gsm;
# 	my $gett=sub{ # get token
# 		my $q=shift;
# 		$dot=~/\G\s*/gsmc;
# 		my $t;
# 		if ($q){
# 			if ($q=~/^\//){
# 				$q=~s/^\///;
# 				$q=~s/\/$//;
# 				if ($q=~/[^\\]\(/){ # FIXME be careful with '(' inside $q
# 					$dot=~/\G(?:$q)/gc;
# 					$t=$1;
# 				} else {
# 					$dot=~/\G($q)/gc;
# 					$t=$1;
# 				}
# 			} else {
# 				$dot=~/\G(\Q$q\E)/gc;
# 				$t=$1;
# 			}
# 			die "expected token /($q)/ in $t".substr($dot,pos($dot)-10,20) unless $t;
# 		} elsif ($dot=~/\G(\w[\w\.]*)/gc){
# 			$t=$1;
# 		} elsif ($dot=~/\G\"/gc){
# 			my $chr;
# 			my $i=pos($dot);
# 			my $s=$i;
# 			while ($chr ne '"'){
# 				$chr=substr($dot,$i,1);
# 				if ($chr eq "\\"){
# 					$i+=2;
# 					$chr=substr($dot,$i,1);
# 				}
# 			}
# 			$t=substr($dot,$s,$i-$s);
# 			pos($dot)+=1;
# 		} elsif ($dot=~/\G\'/gc){
# 			$dot=~/\G(.*?)\'/gc;
# 			$t=$1;
# 		} else {
# 			$dot=~/\G(.)/gc;
# 			$t=$1;
# 		}
# 		print "$t ";
# 		return $t;
# 	}
# 	my $nodes={};
# 	my $edges=[];
# 	gett(*dot,'/\w*?graph/');
# 	my $name=gett(*dot);
# 	gett(*dot,'{');
# 	my $id=gett(*dot);
# 	while ($id ne '}'){
# 		my $attr={};
# 		# FIXME implement subgraphs here
# 		
# 		my $next=gett(*dot,'/\[|\<\=\>|\-\>|\;//');
# 		my $edgeids=[$id];
# 		while (($next eq '<=>') || ($next eq '->')){
# 			my $last=$edgeids->[-1];
# 			push(@$edgeids,$last,gett(*dot));
# 			$next=gett(*dot,'/\[|\<\=\>|\-\>|\;//');
# 		}
# 		if ($next eq '['){
# 			do {
# 				my $attrid=gett(*dot);
# 				gett(*dot,'=');
# 				my $attrval=gett(*dot);
# 				$attr->{$attrid}=$attrval;
# 				$next=gett(*dot,'/\,|\]/');
# 			} until ($next eq ']');
# 			$next=gett(*dot,';');
# 		}
# 		if ($next eq ';'){
# 			if (scalar(@$edgeids)>1){
# 				shift(@$edgeids);
# 				while (scalar(@$edgeids)){
# 					push(@$edges,[shift(@$edgeids),shift(@$edgeids),$attr]);
# 				}
# 			} else {
# 				$nodes->{$id}=$attr;
# 			}
# 		} else {
# 			die "';' expected";
# 		}
# 		$id=gett(*dot);
# 	}
# 	$g->clear;
# 	my $graphattr=$nodes->{graph};
# 	my $nodeattr=$nodes->{node};
# 	my $edgeattr=$nodes->{edge};
# 	my $hopt=$g->get_option('mergeattributes');
# 	$g->set_options(mergeattributes=>1);
# 	delete @{$nodes}{qw(graph edge node)};
# 	$g->set_attributes($graphattr);
# 	for my $n (keys %$nodes){
# 		$g->add_node($n,$nodeattr) if $nodeattr;
# 		$g->add_node($n,$nodes->{$n});
# 	}
# 	for my $e (@$edges){
# 		$g->add_edge($e->[0],$e->[1],$edgeattr) if $edgeattr;
# 		$g->add_edge($e->[0],$e->[1],$e->[2]);
# 	}
# 	$g->set_options(mergeattributes=>$hopt);
# }
1;

__END__

=head1 NAME

SGraph::Dot - write out directed graph in Dot format

=head1 SYNOPSIS

    use SGraph;
    use SGraph::Dot;

    $graph = Graph->new();
    # add edges and nodes to the graph

    print $graph->dot;

=head1 DESCRIPTION

B<Graph::Writer::Dot> is a class for writing out a directed graph
in the file format used by the I<dot> tool (part of the AT+T graphviz
package).
The graph must be an instance of the Graph class, which is
actually a set of classes developed by Jarkko Hietaniemi.

=head1 METHODS

=head2 dot()

Write a specific graph to :

    $graphwriter->write_graph($graph, $file);

The C<$file> argument can either be a filename,
or a filehandle for a previously opened file.

=head1 SEE ALSO

=over 4

=item http://www.graphviz.org/

The home page for the AT+T graphviz toolkit that
includes the dot tool.

=item Graph

Jarkko Hietaniemi's modules for representing directed graphs,
available from CPAN under modules/by-module/Graph/

=item Algorithms in Perl

The O'Reilly book which has a chapter on directed graphs,
which is based around Jarkko's modules.

=item Graph::Writer

The base-class for Graph::Writer::Dot

=back

=head1 AUTHOR

Neil Bowers E<lt>neil@bowers.comE<gt>

=head1 COPYRIGHT

Copyright (c) 2001, Neil Bowers. All rights reserved.
Copyright (c) 2001, Canon Research Centre Europe. All rights reserved.

This script is free software; you can redistribute it and/or modify
it under the same terms as Perl itself.

=cut

