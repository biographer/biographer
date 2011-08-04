#! /bin/bash

### BEGIN INIT INFO
# Provides:		web2py
# Required-Start:	network-manager
# Required-Stop:
# Default-Start:	2
# Default-Stop:		1
# Short-Description:	web2py Framework
### END INIT INFO

. /lib/lsb/init-functions

executable="/var/www/web2py/web2py.py"
IP="192.168.2.117"
logfile="/var/log/web2py.log"
killer="/var/www/web2py/applications/biographer/killweb2py.py"

case $1 in
        start)
		msg="Starting web2py ..."
		log_daemon_msg $msg
		echo $msg >> $logfile
		$(/usr/bin/python $executable --nogui --ip $IP -a main -M -N >> $logfile) &
		log_end_msg 0
        ;;
        stop)
		msg="Stopping web2py ..."
		log_daemon_msg $msg
		echo $msg >> $logfile
		if [ "$(pidof layout)" != "" ]; then
			kill -s KILL $(pidof layout)
			sleep 3
			kill -s KILL $(pidof layout)
			fi
		$killer
		log_end_msg 0
	;;
	restart_if_changes)
		md5file="/home/code/biographer.md5sum"
		old=$(cat $md5file)
		new=$(find -L /home/code/biographer -name "*.py" -exec md5sum '{}' \;)
		if [ "$old" != "$new" ]; then
			/etc/init.d/web2py restart
			echo -n "$new" > $md5file
			date >> $logfile
			echo "biographer code edited: web2py restarted." >> $logfile
			fi
	;;
	*)
		/etc/init.d/web2py stop
		sleep 1.5
		/etc/init.d/web2py start
	;;
esac
