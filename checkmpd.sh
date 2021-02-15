#!/bin/bash
MPDSTATUS=`mpc status | grep volume`
if [ -z "$MPDSTATUS" ]
then
   echo "restarting mpd"
   /etc/init.d/mpd restart
    
else
      echo "mpd ok"
fi
