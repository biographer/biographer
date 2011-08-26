#!/usr/bin/env python2.6
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Lesser General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Lesser General Public License for more details.
#
# You should have received a copy of the GNU Lesser General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

__authors__ = [
    '"Ben Ripkens" <bripkens.dev@gmail.com>',
]

import logging
import os
import shutil
import settings

logger = logging.getLogger(__name__)

targets = {}

def target(func):
    """A decorator which registers targets

    Keyword arguments:
    func -- the function to be registered as a target

    """
    targets[func.__name__] = func
    return func

def ensure_path_exists(f):
    """Make sure that the path to the given file exists

    Keyword arguments:
    f -- path to a file
    """
    d = os.path.dirname(f)
    if not os.path.exists(d):
        os.makedirs(d)

def get_file_contents(path):
    """Retrieve the contents of the file. This function will open the file,
    read the file contents and immediately close it.

    Keyword arguments:
    path -- the file from which the contents should be read

    Returns:
    The file content
    """
    file = open(path)
    contents = file.read()
    file.close()
    return contents

def write_to_file(path, content):
    """Utility function that will write the content of the second parameter
    to the file which is specified by the first parameter. It will also
    ensure that the target directory exists.

    Keyword arguments:
    path -- target file
    content -- content to be written to that file

    """
    ensure_path_exists(path)
    file = open(path, 'w')
    file.write(content)
    file.close()

@target
def clean():
    logger.info('----- Cleaning target directory')

    try:
        shutil.rmtree(settings.target_dir)
    except OSError as (no, msg):
        if not no == 2:
            logger.error('Can\'t remove the target directory. Error: %s' % msg)
            raise

@target
def build():
    logger.info('----- Building combined JavaScript file')

    combined = []

    add_file = lambda path: combined.append(get_file_contents(path))

    for module in settings.modules:
        add_file(module)

    write_to_file(settings.combined_file, '\n'.join(combined))

@target
def jsdoc():
    logger.info('----- Generating JsDoc')
    os.system(settings.jsdoc_command)

@target
def jslint():
    logger.info('----- Checking JavaScript sources for errors')
    os.system(settings.jslint_command)

@target
def test():
    logger.info('----- Generating test suite')

    shutil.copytree(os.path.join('src', 'test', 'environment'),
                    os.path.join('target', 'test'))

    js_target = os.path.join('target',
                           'test',
                           'resources',
                           'js')

    for root, dirs, files in os.walk(os.path.join('src', 'main', 'lib')):
        for file in files:
            shutil.copy(os.path.join(root, file), js_target)

    shutil.copy(os.path.join('target', 'biographer-ui.js'), js_target)

    combined = []

    add_file = lambda path: combined.append(get_file_contents(path))

    for root, dirs, files in os.walk(os.path.join('src', 'test',
                                                  'javascript')):
        for file in files:
            add_file(os.path.join(root, file))

    write_to_file(os.path.join(js_target, 'biographer-tests.js'),
                  '\n'.join(combined))

@target
def compress():
    logger.info('----- Compressing the library using uglify-js')

    # TODO make sure that the copyright notice is part of the compressed file
    os.system(settings.compress_command)

@target
def createDistribution():
    logger.info('----- Creating biographer-ui distribution')

    distributionDir = os.path.join('target', 'distribution')

    shutil.copytree(os.path.join('target', 'test', 'resources'),
                    distributionDir)

    try:
        shutil.rmtree(os.path.join(distributionDir, 'examples'))
    except OSError as (no, msg):
        if not no == 2:
            logger.error('Can\'t remove the examples' +
                    'directory. Error: %s' % msg)
            raise

    os.remove(os.path.join(distributionDir, 'css', 'qunit.css'))
    os.remove(os.path.join(distributionDir, 'css', 'showcase.css'))
    os.remove(os.path.join(distributionDir, 'js', 'biographer-tests.js'))
    os.remove(os.path.join(distributionDir, 'js', 'qunit.js'))
    shutil.copy(os.path.join('target', 'biographer-ui.min.js'),
                os.path.join(distributionDir, 'js', 'biographer-ui.min.js'))

    # replace path to visualization-svg.css
    for file in ['biographer-ui.min.js', 'biographer-ui.js']:
        file = os.path.join(distributionDir, 'js', file)
        contents = get_file_contents(file)
        
        write_to_file(file, contents.replace(
            settings.originalTextToBeReplacedInSettings,
            settings.newTextToBeInserted))