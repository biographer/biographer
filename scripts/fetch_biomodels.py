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
        cur_file = tar.extractfile(fn).read()
        doc = libsbml.readSBMLFromString(cur_file)
        model = doc.getModel()
        notes = re.sub('body', 'div', model.getNotes().getChild(0).toXMLString()) 
        model_id = fn[-19:-4]
        name = model.getName() 
        items.append([model_id, '<li bla="%s">%s: %s</li>' % (model_id, model_id, name)])
        notes_items.append('<div id="%s">%s</div>' % (model_id, notes))
        #print model.getName(), model.getId(), 
    items.sort()
    return "<ul class='biomodels_select'>%s\n</ul><div class='biomodels_notes'>%s</div>" % ("\n".join([x for y,x in items]), ''.join(notes_items))

if __name__ == "__main__":
    open('biomodels_info.html', 'w').write(biomodels_info())