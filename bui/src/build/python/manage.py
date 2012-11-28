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
from optparse import OptionParser
import sys
from targets import targets

logger = logging.getLogger(__name__)

def print_all_targets():
    logger.error('Available targets are:')
    for target in targets.keys():
        logger.error('  %s' % target)

if __name__ == '__main__':
    parser = OptionParser()
    parser.add_option('-v', '--verbose', dest='verbose', default=True,
                      help='Print additional information to the command line.')
    (options, args) = parser.parse_args()

    log_level = logging.WARNING
    if options.verbose:
        log_level = logging.INFO

    logging.basicConfig(level=log_level)


    if len(args) == 0:
        logger.error('You need to define at least one target to execute.')
        print_all_targets()
        sys.exit(-1)

    for arg in args:
        if not arg in targets:
            logger.error('There is no target named \'%s\'' % arg)
            print_all_targets()
            sys.exit(-1)

        targets[arg]()
    