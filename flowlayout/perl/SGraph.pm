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

package SGraph;
use Storable qw(dclone);
use strict;
use warnings;

sub new{
	my $class=shift;
	my %options=@_;
	$options{directed}=0 if $options{undirected};
	$options{directed}=1 unless exists $options{directed}; # default is directed
	$options{multiedge}=0 unless exists $options{multiedge}; # default is no multiedge
	$options{mergeattributes}=0 unless exists $options{mergeattributes}; # default is no merging
	$options{mergenodeattributes}=0 unless exists $options{mergenodeattributes}; # default is no merging
	$options{mergeedgeattributes}=0 unless exists $options{mergeedgeattributes}; # default is no merging
	return bless {options=>\%options,nodes=>{},succs=>{},preds=>{},attr=>{},subgraphs=>{}},$class;
}
sub clear{
	my $self=shift;
	$self->{nodes}={};
	$self->{succs}={};
	$self->{preds}={};
	$self->{attr}={};
	$self->{subgraphs}={};
}
sub copy{
	my $self=shift;
	my $ng=dclone($self);
	return bless $ng,ref($self);
}
sub set_options{
	my $self=shift;
	my $opt=(defined $_[0] ? (ref($_[0]) eq 'HASH' ? shift : {@_}) : {});
	addhash($self->{options},$opt);
}
sub get_option{
	my $self=shift;
	my $opt=shift;
	return $self->{options}->{$opt};
}
sub is_directed{
	my $self=shift;
	return $self->{options}->{directed};
}
sub is_multiedge{
	my $self=shift;
	my $e1=shift;
	return $self->{options}->{multiedge} unless $self->{options}->{multiedge} && $e1; # return general graph property
	# determine status for actual edge
	my $e2=shift;
	my $cc;
	($e1,$e2,$cc)=@$e1 if ref($e1); #assume array
	return 1 if defined $cc;
	return 1 if scalar @{$self->{succs}->{$e1}->{$e2}}>1;
	return 0;
}
sub add_graph{
   my $self=shift;
   my $g2=shift; #graph to add
   my $opt=shift;
   $self->set_options(multiedge=>1) if $g2->is_multiedge && $opt->{copymultiedge};
   $self->set_options(multiedge=>1) if $opt->{multiedge};
   for my $n (@{$g2->nodes}){
      $self->add_node($n,$g2->get_attributes($n)); # handles mergeattributes
   }
   for my $e (@{$g2->edges({multiedge=>1})}){
      $self->add_edge($e->[0],$e->[1],$g2->get_attributes($e)); # handles mergeattributes and multiedges
   }
}
sub add_node{
	my $self=shift;
	my $node=shift;
	my $attr=(defined $_[0] ? (ref($_[0]) eq 'HASH' ? shift : {@_}) : {});
	if (exists $self->{nodes}->{$node}){
		if ($self->{options}->{mergeattributes} || $self->{options}->{mergenodeattributes}){
			addhash($self->{nodes}->{$node},$attr);
		} else {
			$self->{nodes}->{$node}={%$attr};
		}
	} else {
		$self->{nodes}->{$node}={%$attr};
	}
}
sub del_node{
	my $self=shift;
	my $node=shift;
	return if ! exists $self->{nodes}->{$node};
	delete $self->{nodes}->{$node};
	for my $n2 (keys %{$self->{succs}->{$node}}){
		delete $self->{preds}->{$n2}->{$node};
	}
	for my $n2 (keys %{$self->{preds}->{$node}}){
		delete $self->{succs}->{$n2}->{$node};
	}
	delete $self->{preds}->{$node};
	delete $self->{succs}->{$node};
}
sub has_node{
	my $self=shift;
	my $node=shift;
	return exists $self->{nodes}->{$node};
}
sub add_subgraph{# warning a subgraph is also a node!
	my $self=shift;
	my $node=shift;
	my $list=shift;
	my $attr=(defined $_[0] ? (ref($_[0]) eq 'HASH' ? shift : {@_}) : {});
	$self->add_node($node,$attr);
	$self->{subgraphs}->{$node}=$list;
}
sub add_tosubgraph{
	my $self=shift;
	my $node=shift;
	my $list=shift;
	$list=[$list,@_] if ref($list) ne 'ARRAY';
	push(@{$self->{subgraphs}->{$node}},@$list);
}
sub del_subgraph{
	my $self=shift;
	my $node=shift;
	$self->del_node($node);
	delete $self->{subgraphs}->{$node};
}
sub is_subgraph{
	my $self=shift;
	my $node=shift;
	return exists $self->{subgraphs}->{$node};
}
sub get_subgraph{
	my $self=shift;
	my $node=shift;
	return $self->{subgraphs}->{$node} if exists $self->{subgraphs}->{$node};
}
sub get_subgraphs{
	my $self=shift;
	return [keys %{$self->{subgraphs}}];
}

sub add_edge{
	my $self=shift;
	my $n1=shift;
	my $n2=shift;
	$self->{nodes}->{$n1}={} if ! exists $self->{nodes}->{$n1};
	$self->{nodes}->{$n2}={} if ! exists $self->{nodes}->{$n2};
	my $attr=(defined $_[0] ? (ref($_[0]) eq 'HASH' ? {%{shift()}} : {@_}) : {});
	my $attrar=[];
	$attrar=$self->{succs}->{$n1}->{$n2} if exists $self->{succs}->{$n1}->{$n2};
	if ($self->{options}->{multiedge}){
		push(@$attrar,$attr);
	} else {
		if ($self->{options}->{mergeattributes} || $self->{options}->{mergeedgeattributes}){
			$attrar=(scalar(@$attrar) ? [$attrar->[-1]] : [{}]); # attrar will contain exactly one element
			addhash($attrar->[0],$attr); # add new attributes to old attributes
		} else {
			$attrar=[{%$attr}];
		}
	}
	$self->{succs}->{$n1}->{$n2}=$attrar;
	$self->{preds}->{$n2}->{$n1}=$attrar;
	$self->{succs}->{$n2}->{$n1}=$attrar unless $self->{options}->{directed};
	$self->{preds}->{$n1}->{$n2}=$attrar unless $self->{options}->{directed};
	return [$n1,$n2,scalar(@{$self->{succs}->{$n1}->{$n2}})-1];
}
sub get_multiedges{
	my $self=shift;
	my $n1=shift;
	my $n2=shift;
	return [] unless exists $self->{succs}->{$n1}->{$n2};
	return [[$n1,$n2]] unless $self->is_multiedge;
	my $multi=[];
	my $cc=0;
	for my $a (@{$self->{succs}->{$n1}->{$n2}}){
		push(@$multi,[$n1,$n2,$cc]) if defined $a;
		$cc++;
	}
	return $multi;
}
sub del_edge{
	my $self=shift;
	my $n1=shift;
	my $n2=shift;
	my $delall=0;
	if (ref($n1) eq 'ARRAY'){
		my $pos;
		($n1,$n2,$pos)=@$n1;
		return unless exists $self->{succs}->{$n1}->{$n2};
		$self->{succs}->{$n1}->{$n2}->[$pos]=undef;
		while ((scalar(@{$self->{succs}->{$n1}->{$n2}})) && (! defined $self->{succs}->{$n1}->{$n2}->[-1])){
			pop(@{$self->{succs}->{$n1}->{$n2}});
		}
	} else {
		return unless exists $self->{succs}->{$n1}->{$n2};
		$delall=1;
	}
	if ($delall || (scalar(@{$self->{succs}->{$n1}->{$n2}})==0)){
		delete $self->{succs}->{$n1}->{$n2};
		delete $self->{preds}->{$n2}->{$n1};
		delete $self->{succs}->{$n2}->{$n1} unless $self->{options}->{directed};
		delete $self->{preds}->{$n1}->{$n2} unless $self->{options}->{directed};
	}
}
sub has_edge{
	my $self=shift;
	my $n1=shift;
	my $n2=shift;
	return 0 unless (exists $self->{nodes}->{$n1} ) && (exists $self->{nodes}->{$n2} );
	return exists $self->{succs}->{$n1}->{$n2} || (!$self->{options}->{directed} && exists $self->{succs}->{$n2}->{$n1});
}
sub successors{
	my $self=shift;
	my $node=shift;
	my @list=keys %{$self->{succs}->{$node}};
	push @list,keys %{$self->{preds}->{$node}} unless $self->{options}->{directed};
	return \@list;
}
sub predecessors{
	my $self=shift;
	my $node=shift;
	my @list=keys %{$self->{preds}->{$node}};
	push @list,keys %{$self->{succs}->{$node}} unless $self->{options}->{directed};
	return \@list;
}
sub neighbors{
	my $self=shift;
	my $node=shift;
	my @list=keys %{$self->{succs}->{$node}};
	push @list,keys %{$self->{preds}->{$node}};
	return \@list;
}
sub degree{# FIXME degree rotines do not considere multi-edges -- ok or not?
	my $self=shift;
	my $node=shift;
	my $deg=scalar(keys %{$self->{succs}->{$node}});
	$deg+=scalar(keys %{$self->{preds}->{$node}});
	return $deg;
}
sub indegree{
	my $self=shift;
	my $node=shift;
	return $self->degree($node) unless $self->{options}->{directed};
	return scalar(keys %{$self->{succs}->{$node}});
}
sub outdegree{
	my $self=shift;
	my $node=shift;
	return $self->degree($node) unless $self->{options}->{directed};
	return scalar(keys %{$self->{preds}->{$node}});
}
sub set_attribute{
	if (scalar(@_)==3){
		my ($self,$key,$val)=@_;
		$self->{attr}->{$key}=$val;
	}elsif ((scalar(@_)==4) && (ref($_[1]) eq 'ARRAY')){
		my ($self,$edge,$key,$val)=@_;
		my ($n1,$n2,$pos)=@$edge;
      $pos=-1 unless defined $pos;
		return unless exists $self->{succs}->{$n1}->{$n2};
		$self->{succs}->{$n1}->{$n2}->[$pos]->{$key}=$val;
	}elsif (scalar(@_)==4){
		my ($self,$node,$key,$val)=@_;
		return unless exists $self->{nodes}->{$node};
		$self->{nodes}->{$node}->{$key}=$val;
	}elsif (scalar(@_)==5){
		my ($self,$n1,$n2,$key,$val)=@_;
		return unless exists $self->{succs}->{$n1}->{$n2};
		$self->{succs}->{$n1}->{$n2}->[-1]->{$key}=$val;
	}else {
		print "syntax: \$g->set_attribute([node1,[node2,]]key,value)\n";
	}
}
sub get_attribute{
	if (scalar(@_)==2){
		my ($self,$key)=@_;
		return $self->{attr}->{$key};
	}elsif ((scalar(@_)==3) && (ref($_[1]) eq 'ARRAY')){
		my ($self,$edge,$key)=@_;
		my ($n1,$n2,$pos)=@$edge;
      $pos=-1 unless defined $pos;
		return unless exists $self->{succs}->{$n1}->{$n2};
		return $self->{succs}->{$n1}->{$n2}->[$pos]->{$key};
	}elsif (scalar(@_)==3){
		my ($self,$node,$key)=@_;
		return unless exists $self->{nodes}->{$node};
		return $self->{nodes}->{$node}->{$key};
	}elsif (scalar(@_)==4){
		my ($self,$n1,$n2,$key)=@_;
		return unless exists $self->{succs}->{$n1}->{$n2};
		return $self->{succs}->{$n1}->{$n2}->[-1]->{$key};
	}else {
		print "syntax: \$g->get_attribute([node1,[node2,]]key)\n";
	}
}
sub has_attribute{
	if (scalar(@_)==2){
		my ($self,$key)=@_;
		return exists $self->{attr}->{$key};
	}elsif ((scalar(@_)==3) && (ref($_[1]) eq 'ARRAY')){
		my ($self,$edge,$key)=@_;
		my ($n1,$n2,$pos)=@$edge;
      $pos=-1 unless defined $pos;
		return unless exists $self->{succs}->{$n1}->{$n2};
		return exists $self->{succs}->{$n1}->{$n2}->[$pos]->{$key};
	}elsif (scalar(@_)==3){
		my ($self,$node,$key)=@_;
		return unless exists $self->{nodes}->{$node};
		return exists $self->{nodes}->{$node}->{$key};
	}elsif (scalar(@_)==4){
		my ($self,$n1,$n2,$key)=@_;
		return unless exists $self->{succs}->{$n1}->{$n2};
		return exists $self->{succs}->{$n1}->{$n2}->[-1]->{$key};
	}else {
		print "syntax: \$g->get_attribute([node1,[node2,]]key)\n";
	}
}
sub del_attribute{
	if (scalar(@_)==2){
		my ($self,$key)=@_;
		delete $self->{attr}->{$key};
	}elsif ((scalar(@_)==3) && (ref($_[1]) eq 'ARRAY')){
		my ($self,$edge,$key)=@_;
		my ($n1,$n2,$pos)=@$edge;
      $pos=-1 unless defined $pos;
		return unless exists $self->{succs}->{$n1}->{$n2};
		delete $self->{succs}->{$n1}->{$n2}->[$pos]->{$key};
	}elsif (scalar(@_)==3){
		my ($self,$node,$key)=@_;
		return unless exists $self->{nodes}->{$node};
		delete $self->{nodes}->{$node}->{$key};
	}elsif (scalar(@_)==4){
		my ($self,$n1,$n2,$key)=@_;
		return unless exists $self->{succs}->{$n1}->{$n2};
		delete $self->{succs}->{$n1}->{$n2}->[-1]->{$key};
	}else {
		print "syntax: \$g->del_attribute([node1,[node2,]]key)\n";
	}
}
sub get_attributes{
	if (scalar(@_)==1){
		my ($self)=@_;
		return $self->{attr};
	}elsif ((scalar(@_)==2) && (ref($_[1]) eq 'ARRAY')){
		my ($self,$edge)=@_;
		my ($n1,$n2,$pos)=@$edge;
      $pos=-1 unless defined $pos;
		return unless exists $self->{succs}->{$n1}->{$n2};
		return $self->{succs}->{$n1}->{$n2}->[$pos];
	}elsif (scalar(@_)==2){
		my ($self,$node)=@_;
		return unless exists $self->{nodes}->{$node};
		return $self->{nodes}->{$node};
	}elsif (scalar(@_)==3){
		my ($self,$n1,$n2)=@_;
		return unless exists $self->{succs}->{$n1}->{$n2};
		return $self->{succs}->{$n1}->{$n2}->[-1];
	}else {
		print "syntax: \$g->get_attributes([node1[,node2]])\n";
	}
}
sub set_attributes{
	if (scalar(@_)==2){
		my ($self,$attr)=@_;
		addhash($self->{attr},$attr);
	}elsif ((scalar(@_)==3) && (ref($_[1]) eq 'ARRAY')){
		my ($self,$edge,$attr)=@_;
		my ($n1,$n2,$pos)=@$edge;
		$pos=-1 unless defined $pos;
		return unless exists $self->{succs}->{$n1}->{$n2};
		addhash($self->{succs}->{$n1}->{$n2}->[$pos],$attr);
	}elsif (scalar(@_)==3){
		my ($self,$node,$attr)=@_;
		return unless exists $self->{nodes}->{$node};
		addhash($self->{nodes}->{$node},$attr);
	}elsif (scalar(@_)==4){
		my ($self,$n1,$n2,$attr)=@_;
		return unless exists $self->{succs}->{$n1}->{$n2};
		addhash($self->{succs}->{$n1}->{$n2}->[-1],$attr);
	}else {
		print "syntax: \$g->get_attributes([node1,[node2,]]attr)\n";
	}
}
sub nodes{
	my $self=shift;
	return [keys %{$self->{nodes}}];
}
sub edges{
	my $self=shift;
	my $opt=shift; # multiedge: expand multiedges?
	my $edges=[];
	my $visited={};
	for my $k (keys %{$self->{succs}}){
		for my $k2 (keys %{$self->{succs}->{$k}}){
			my $ar=[$k,$k2];
			$ar=[$k2,$k] unless $self->{options}->{directed} || "$k"<"$k2"; #brings edge in sorted order for undirected graphs
			next if (!$self->{options}->{directed}) && exists $visited->{$self->{succs}->{$k}->{$k2}}; # ensures that for undirected graphs only one direction per edge is returned
			$visited->{$self->{succs}->{$k}->{$k2}}=1;
			if ($opt->{multiedge} && $self->is_multiedge($k,$k2)){
            my $me=$self->get_multiedges($k,$k2);
            push(@$edges,@$me);
			} else {
            push(@$edges,$ar);
         }
		}
	}
	return $edges;
}
sub directed{
	my $self=shift;
	return $self->{options}->{directed};
}
sub get_isolated{
	my $self=shift;
	my $iso=[];
	for my $n (keys %{$self->{nodes}}){
		push(@$iso,$n) unless (exists $self->{succs}->{$n} && scalar(keys(%{$self->{succs}->{$n}}))) ||(exists $self->{preds}->{$n} && scalar(keys(%{$self->{preds}->{$n}})));
	}
	return $iso;
}
sub _traverse{
	my $self=shift;
	my $node=shift;
	my $vis=shift;
	my $dir=shift;
	return [] if exists $vis->{$node};
	$vis->{$node}=1;
	my  @list=();
	if ($dir<=0) {
		for my $n (@{$self->predecessors($node)}){
			unshift(@list,@{_traverse($self,$n,$vis,$dir)})
		}
	}
	push(@list,$node);
	if ($dir>=0) {
		for my $n (@{$self->successors($node)}){
			push(@list,@{_traverse($self,$n,$vis,$dir)})
		}
	}
	return \@list;
}
sub get_component{
	my $self=shift;
	my $node=shift;
	return _traverse($self,$node,{},($self->{options}->{directed}?0:1));
}
sub get_components{
	my $self=shift;
	my $iso=$self->get_isolated();
	my $vis={};
	my $comp=[];
	@{$vis}{@$iso}=(1) x scalar(@$iso);
	for my $i (@$iso){
		push(@$comp,[$i]);
	}
	for my $n (@{$self->nodes}){
		next if exists $vis->{$n};	
		push(@$comp,$self->_traverse($n,$vis,($self->{options}->{directed}?0:1)));
	}
	return $comp;
}
sub addhash{
	my $h1=shift;
	my $h2=shift;
	die "addhash: first hash undefined" unless defined $h1;
	for my $k (keys %$h2){
		$h1->{$k}=$h2->{$k};
	}
}
1;