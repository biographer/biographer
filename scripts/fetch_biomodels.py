#!/usr/bin/env python
'''
fetch lates biomodesl release and create a html select from it
'''
def biomodels_info():
    '''
    fetch latest biomodels release from ftp
    extract
    parse all curated models
    '''
    import ftplib
    import tarfile
    import libsbml
    import re
    import os

    if not os.path.exists('release.tar.bz2'):

        ftp = ftplib.FTP("ftp.ebi.ac.uk")
        ftp.login()
        ftp.cwd("/pub/databases/biomodels/releases/latest/")
        file_list = []
        ftp.dir(file_list.append)
        ftp_file = [x for x in file_list if x.endswith('pub-sbml_files.tar.bz2')][0].split()[-1]
        try:
            ftp.retrbinary('RETR %s' % ftp_file, open('release.tar.bz2', 'wb').write)
        except ftplib.error_perm:
            print 'ERROR: cannot read file "%s"' % ftp_file
            import os
            os.unlink(ftp_file)
            return
        #print '*** Downloaded "%s" to CWD' % ftp_file
    else:
        print 'used release.tar.bz2 in current folder! remove to redownload'

    #Unpack and read info
    tar = tarfile.open('release.tar.bz2', 'r:bz2')
    curated_files = [x for x in tar.getnames() if '/curated/' in x]
    items = []
    notes_items = []
    for fn in curated_files:
        #print fn[-19:-4]
        try: 
            cur_file = tar.extractfile(fn).read()
            doc = libsbml.readSBMLFromString(cur_file)
            model = doc.getModel()
            notes = re.sub('body', 'div', model.getNotes().getChild(0).toXMLString()) 
            model_id = fn[-19:-4]
            name = model.getName() 
            items.append([model_id, '<li><div bla="%s">%s: %s <a href="{{=URL(r=request,f="biomodels_info_notes.html#%s")}}" target="_blank">notes</a></div></li>' % (model_id, name, model_id, model_id)])
            notes_items.append('<div id="%s">%s</div>' % (model_id, notes))
        except:
            pass
        #print model.getName(), model.getId(), 
    items.sort()
    biomodels_list = "<ul class='biomodels_select'>%s\n</ul>" % "\n".join([x for y,x in items])
    notes = "<div class='biomodels_notes'>%s</div><br/><br/><br/><br/><br/><br/><br/><br/>" % ''.join(notes_items)
    open('biomodels_info_list.html', 'w').write(biomodels_list)
    open('biomodels_info_notes.html', 'w').write(notes)

if __name__ == "__main__":
    (biomodels_info())
