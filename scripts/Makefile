.PHONY=all
all: reactome_pathways.html biomodels_info_list.html biomodels_info_notes.html
reactome_pathways.html:
	perl fetch_reactome_pw.pl reactome_pathways.html
biomodels_info_list.html:
	python fetch_biomodels.py
biomodels_info_notes.html:
	python fetch_biomodels.py
