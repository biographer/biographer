.PHONY=all
all: reactome_pathways.html biomodels_info.html
reactome_pathways.html:
	perl fetch_reactome_pw.pl reactome_pathways.html
biomodels_info.html:
	python fetch_biomodels.py
