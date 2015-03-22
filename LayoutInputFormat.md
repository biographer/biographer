# Introduction #

This file is loaded by the layout algorithm. An Example file is provided below:

# Input Format #

```
input =
         number of compartments
         compartmentlist
         "///"
         number of nodes
         nodelist
         "///"
         number of edges
         edgelist
compartmentlist =
         compartment
         [compartmentlist]
nodelist =
         node
         [nodelist]
edgelist =
         edge
         [edgelist]
compartment =
         compartment index " " compartment id/name
node =
         node index
         node type
         node id/name
         node compartment index
         node x
         node y
         node width
         node height
         node direction
edge =
         edge type " " source index " " target index

node index = '0'..n # consecutive numbering
compartment index = '0'..n # consecutive numbering, compartment '0' is the undefined compartment (can be omitted)
```

# Example #

```
4
1 Extracellular
2 Plasmamembrane
3 Cytosol
4 Nucleus
///
80
0
Reaction
Reactome:177934
0
0.0
0.0
1.78
0.50
0.0
1
Compound
Reactome:179856
2
0.0
0.0
5.69
0.82
0.0
2
Reaction
Reactome:109841
0
0.0
0.0
1.78
0.50
0.0
3
Reaction
MAN:R12
0
0.0
0.0
0.92
0.50
0.0
4
Reaction
Reactome:177940
0
0.0
0.0
1.78
0.50
0.0
5
Reaction
Reactome:109803
0
0.0
0.0
1.78
0.50
0.0
6
Compound
Reactome:109788
2
0.0
0.0
6.19
0.69
0.0
7
Reaction
Reactome:177930
0
0.0
0.0
1.78
0.50
0.0
8
Compound
Reactome:179849
3
0.0
0.0
3.94
0.69
0.0
9
Compound
MAP:Cb17552_CY
3
0.0
0.0
4.25
0.82
0.0
10
Reaction
Reactome:109804
0
0.0
0.0
1.78
0.50
0.0
11
Compound
Reactome:109787
3
0.0
0.0
6.75
0.69
0.0
12
Reaction
Reactome:177936
0
0.0
0.0
1.78
0.50
0.0
13
Compound
Reactome:112406
2
0.0
0.0
6.81
1.04
0.0
14
Reaction
MAN:R28
0
0.0
0.0
0.92
0.50
0.0
15
Compound
MAP:Cb16761_CY
3
0.0
0.0
4.25
0.82
0.0
16
Compound
MAP:UQ02750_CY
3
0.0
0.0
4.33
0.82
0.0
17
Reaction
Reactome:109860
0
0.0
0.0
1.78
0.50
0.0
18
Compound
Reactome:180337
2
0.0
0.0
10.42
0.69
0.0
19
Compound
MAP:Cb15996_CY
3
0.0
0.0
4.25
0.82
0.0
20
Reaction
Reactome:177938
0
0.0
0.0
1.78
0.50
0.0
21
Compound
Reactome:163338
2
0.0
0.0
5.69
0.82
0.0
22
Compound
Reactome:109789
2
0.0
0.0
7.22
1.04
0.0
23
Compound
Reactome:109796
2
0.0
0.0
5.06
0.69
0.0
24
Compound
Reactome:29358
4
0.0
0.0
4.17
0.82
0.0
25
Compound
Reactome:109793
2
0.0
0.0
5.69
1.04
0.0
26
Compound
MAP:UP04049_CY_pho259pho621
3
0.0
0.0
6.50
0.82
0.0
27
Compound
Reactome:198666
4
0.0
0.0
4.36
0.82
0.0
28
Compound
MAP:Cs56-65-5_CY
3
0.0
0.0
4.44
0.82
0.0
29
Compound
MAP:UP36507_CY
3
0.0
0.0
4.31
0.82
0.0
30
Compound
MAP:UP27361_CY_pho202pho204
3
0.0
0.0
6.50
0.82
0.0
31
Compound
Reactome:109844
3
0.0
0.0
4.75
0.69
0.0
32
Reaction
Reactome:177945
0
0.0
0.0
1.78
0.50
0.0
33
Compound
Reactome:179845
2
0.0
0.0
5.39
0.69
0.0
34
Reaction
MAN:R2
0
0.0
0.0
0.81
0.50
0.0
35
Compound
Reactome:179882
2
0.0
0.0
12.81
0.58
0.0
36
Compound
Reactome:197745
2
0.0
0.0
10.36
0.82
0.0
37
Reaction
Reactome:109852
0
0.0
0.0
1.78
0.50
0.0
38
Reaction
MAN:R25
0
0.0
0.0
0.92
0.50
0.0
39
Compound
MAP:C2
3
0.0
0.0
2.89
0.82
0.0
40
Compound
MAP:UP27361_CY
3
0.0
0.0
4.31
0.82
0.0
41
Reaction
Reactome:109857
0
0.0
0.0
1.78
0.50
0.0
42
Reaction
Reactome:177925
0
0.0
0.0
1.78
0.50
0.0
43
Compound
Reactome:109848
3
0.0
0.0
4.31
0.82
0.0
44
Reaction
Reactome:109867
0
0.0
0.0
1.78
0.50
0.0
45
Compound
MAP:UP31946_CY
3
0.0
0.0
4.31
0.82
0.0
46
Compound
Reactome:109845
4
0.0
0.0
4.75
0.69
0.0
47
Compound
Reactome:109843
3
0.0
0.0
4.75
0.69
0.0
48
Compound
Reactome:180286
2
0.0
0.0
11.22
0.58
0.0
49
Reaction
MAN:R1
0
0.0
0.0
0.81
0.50
0.0
50
Compound
MAP:Cx114
3
0.0
0.0
6.03
0.69
0.0
51
Compound
MAN:C10
2
0.0
0.0
4.83
0.58
0.0
52
Compound
Reactome:180331
2
0.0
0.0
15.08
0.69
0.0
53
Compound
MAP:UP29353_CY
3
0.0
0.0
4.31
0.82
0.0
54
Compound
Reactome:112340
3
0.0
0.0
4.31
0.82
0.0
55
Compound
Reactome:113582
4
0.0
0.0
4.36
0.82
0.0
56
Reaction
Reactome:177922
0
0.0
0.0
1.78
0.50
0.0
57
Reaction
Reactome:109865
0
0.0
0.0
1.78
0.50
0.0
58
Reaction
Reactome:177943
0
0.0
0.0
1.78
0.50
0.0
59
Compound
MAP:C3
3
0.0
0.0
2.89
0.82
0.0
60
Compound
Reactome:180301
2
0.0
0.0
10.42
0.69
0.0
61
Reaction
Reactome:109802
0
0.0
0.0
1.78
0.50
0.0
62
Compound
Reactome:179863
1
0.0
0.0
5.00
0.82
0.0
63
Compound
Reactome:180348
2
0.0
0.0
10.42
0.69
0.0
64
Compound
MAP:UQ02750_CY_pho218pho222
3
0.0
0.0
6.53
0.82
0.0
65
Compound
Reactome:179837
2
0.0
0.0
5.69
0.82
0.0
66
Reaction
Reactome:109863
0
0.0
0.0
1.78
0.50
0.0
67
Reaction
Reactome:177933
0
0.0
0.0
1.78
0.50
0.0
68
Compound
Reactome:179847
2
0.0
0.0
4.78
0.69
0.0
69
Compound
Reactome:109838
3
0.0
0.0
4.67
0.69
0.0
70
Reaction
Reactome:177939
0
0.0
0.0
1.78
0.50
0.0
71
Compound
Reactome:109795
2
0.0
0.0
6.81
1.04
0.0
72
Compound
Reactome:198710
4
0.0
0.0
4.36
0.82
0.0
73
Compound
Reactome:179791
3
0.0
0.0
11.33
1.39
0.0
74
Compound
Reactome:109794
2
0.0
0.0
6.81
1.04
0.0
75
Compound
Reactome:179820
2
0.0
0.0
10.42
0.69
0.0
76
Compound
Reactome:179838
2
0.0
0.0
5.78
0.82
0.0
77
Reaction
Reactome:109829
0
0.0
0.0
1.78
0.50
0.0
78
Compound
Reactome:109783
2
0.0
0.0
5.06
0.69
0.0
79
Reaction
Reactome:177942
0
0.0
0.0
1.78
0.50
0.0
///
106
Product 0 15
Product 0 35
Substrate 70 1
Product 2 15
Product 2 25
Product 2 64
Product 3 55
Product 3 27
Product 4 63
Product 5 6
Product 5 45
Substrate 61 6
Substrate 4 8
Product 7 48
Product 7 15
Product 10 11
Substrate 5 11
Product 12 52
Product 14 51
Catalyst 2 13
Catalyst 37 13
Substrate 34 16
Product 17 15
Product 17 47
Substrate 12 18
Substrate 20 19
Substrate 32 19
Catalyst 77 21
Substrate 77 22
Substrate 20 23
Substrate 32 23
Product 20 9
Product 20 78
Substrate 3 24
Substrate 49 25
Substrate 34 25
Substrate 10 26
Substrate 67 28
Substrate 0 28
Substrate 37 28
Substrate 70 28
Substrate 2 28
Substrate 17 28
Substrate 7 28
Substrate 77 28
Substrate 49 29
Substrate 57 30
Substrate 44 31
Catalyst 0 33
Product 32 9
Product 32 78
Substrate 4 35
Substrate 58 35
Substrate 42 35
Inhibitor 79 36
Product 34 74
Product 37 15
Product 37 25
Product 37 43
Product 38 73
Substrate 38 39
Substrate 14 39
Substrate 41 40
Product 42 60
Product 41 69
Product 44 46
Substrate 61 45
Substrate 10 45
Catalyst 3 46
Substrate 66 47
Product 49 71
Substrate 38 48
Substrate 58 50
Substrate 12 50
Catalyst 32 52
Inhibitor 17 54
Substrate 42 53
Product 56 33
Product 58 75
Product 57 31
Substrate 38 59
Substrate 14 59
Catalyst 67 60
Product 61 22
Substrate 79 62
Catalyst 7 63
Substrate 79 65
Substrate 41 64
Product 66 30
Product 66 64
Product 67 15
Product 67 18
Substrate 56 68
Catalyst 17 69
Product 70 15
Product 70 76
Substrate 37 71
Substrate 3 72
Catalyst 70 73
Substrate 2 74
Catalyst 20 75
Substrate 5 78
Substrate 14 78
Product 77 15
Product 77 25
Product 79 68
```




```
# graph exchange format mini docu:
# --------------------------------
# number of compartments
# node index " " node name     (note: 0 is unknown)
# ...
# ///
# number of nodes
# node index
# node type
# node id/name
# node compartment index
# node x
# node y
# node width
# node height
# node direction
# ...
# ///
# number of edges
# edgetype from to
# ...
```