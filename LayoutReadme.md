# BIOGRAPHER LAYOUTER INSTRUCTIONS #

## WINDOWS USERS ##

### DOWNLOADS ###
For windows users, please download the executable file (biolayout-1.0.exe) from our download section: http://code.google.com/p/biographer/downloads/list

These softwares may be needed to download from the internet (just use Google to find them and then download) and install:
  1. Dev-Cpp, the C++ IDE used to build the project. Other C++ IDE such as Eclipse and Visual Studio are also suitable (only for building from sources).
  1. TortoiseHg, the software used to clone local copies of codes from the repository.(only for building from sources)
  1. Active-Perl, the software used to run Perl scripts.
  1. Graphviz, for visualization.

For windows users who do not wish to extend the codes, they can directly use biolayout-1.0.exe they downloaded.

### CLONE THE REPOSITORY ###
Cloning can be done using command lines (but before that, please make sure that TortoiseHg have been installed). Suppose that a user wants to clone a local copy of the codes in folder D:\Biographer of his computer. He can follow these steps to achieve it:
  1. Open the Command Line Interface (cmd.exe).
  1. Change directory to D:\ by entering command D:.
  1. Go to the Biographer subdirectory by entering command cd Biographer.
  1. Clone a local copy of the codes from the repository using command
```
hg clone <repository URL>
for example:
https://code.google.com/p/biographer.layout/
```
After that, a copy of the repository will be cloned in D:\biographer. The C++ codes are inside the src folder.

### BUILDING THE PROJECT ###
The project can be built in directory D:\biographer\biographer.layout\src processing the following steps.
  1. Creating a C++ Project: Open Dev-CPP and click the "File" button --> click the "New" button --> click the "Project" button --> choose "Empty Project", and name the project as "biolayout". Then click "OK" and save it to D:\biographer\biographer.layout\src.
  1. Adding source files to the project: (following the previous steps)--> click the "Project" button --> click the "Add to Project" button. Then you can see all the source files and header files in the project. Then please select all the source files and header files. After that, click "Open". Then the source files and header files are added to the "biolayout" project.
  1. Building the project. Click the "Execute" button --> click "Compile". Then the project is built and there will be an executable file called biolayout.exe in directory D:\biographer\biographer.layout\src.

### EXECUTION ###
After successfully building the project, users can start using the executable file to generate coordinates for reaction networks, which is also done using command line. Firstly, users need to open the D:\biographer\biographer.layout\src directory in command line. Then use the following format to generate output from an input.
```
biolayout.exe <input_file> <output_file>
```


<input\_file>

 is the name of the input file, which is either a plain text file. The input file must be specified, and it must be inside the same folder as the executable file.


<output\_file>

 is the name of the output file, which will be a plain text file. If the output file is not specified, the program will generate output to the default output file, which is ¡°summary.txt¡±, which is also in D:\biographer\biographer.layout\src folder.

### VISUALIZATION ###
Visualization is done using a Perl script file named "vislayout3.pl", which is also called by command line. The Perl scripts files are in the "perl" subdirectory of D:\biographer\biographer. In order to do visualization, users need to copy the same input and output files as those in the execution step to D:\biographer\biographer\perl. Then use the command line format below to visualize:
```
perl vislayout3.pl <input_file> <output_file>
```
There is another visulization Perl script file named "vislayout2.pl". The command line statements to do visualization using vislayout2.pl is:
```
perl vislayout2.pl <dot_file> <output_file>
```


<dot\_file>

 and 

<output\_file>

 must be copied to D:\biographer\biographer\perl subdirectory. 

<dot\_file>

 is a file named "`*`.dot", which corresponds to the 

<input\_file>

.
"vislayout2.pl" may visualize a better layout picture.



## LINUX USERS ##

### PREREQUISITES ###
  1. C++ build environment
  1. mercurial
  1. Perl
  1. Graphviz
### Cloning the repository ###
```
hg clone https://code.google.com/p/biographer.layout/
```
This creates a new directory. Change to that directory.

### BUILDING ###
do a
```
make
```
in the directory you created with hg clone. An executable layout is created in the ./build/ subdirectory

### USAGE ###
type
```
./build/layout <input_file> <output_file>
```
this will import the graph definitions from the input file and create (or overwrite) the output file. The formats of the two files is described here http://code.google.com/p/biographer/wiki/LayoutInputFormat

You can visualize the calculated layout using the perl script perl/visLayout3.pl. This requires perl and graphviz to be installed. Graphviz is used here for graphdisplaying using the node positions defined in the outputfile
```
perl vislayout3.pl <input_file> <output_file>
```
Please note: this needs to be called in the perl subdirectory as necessary modules are loated there.