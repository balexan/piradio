Imager from here https://www.raspberrypi.org/software/

wpa_supplicant.conf in /boot:

ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=DE

network={
 ssid="..."
 psk="..."
}

passwd
copy .ssh/id_rsa.pub to .ssh/authorized_keys

git clone git@github.com:balexan/piradio.git
sudo apt install nodejs
ssh-keygen
add key to github
sudo apt-get install libasound2-dev
sudo apt-get install alsa-utils
sudo apt-get install mpd mpc
sudo apt install node, npm
sudo node web


pi@raspberrypi:~/piradio $ mpc add http://stream2.srr.ro:8022
pi@raspberrypi:~/piradio $ mpc add https://listen2.argentinetangoradio.com
pi@raspberrypi:~/piradio $ mpc add https://tsfjazz.ice.infomaniak.ch/tsfjazz-high.mp3
pi@raspberrypi:~/piradio $ mpc save internetradio
mpc single on
mpc repeat on


TODO: Look at http://tinycorelinux.net/ports.html


https://www.dexterindustries.com/howto/run-a-program-on-your-raspberry-pi-at-startup/
sudo nano /lib/systemd/system/piradio.service
 [Unit]
 Description=Pi Radio
 After=multi-user.target

 [Service]
 Type=idle
 ExecStart=/usr/bin/node /home/pi/piradio/web

 [Install]
 WantedBy=multi-user.target

sudo chmod 644 /lib/systemd/system/piradio.service 
sudo reboot

sudo systemctl restart piradio.service

https://pimylifeup.com/raspberry-pi-spotify/
https://appcodelabs.com/7-easy-steps-to-apple-airplay-on-raspberry-pi

sudo apt-get install libpcsclite1 libpcsclite-dev
sudo apt-get install pcscd
 npm install nfc-pcsc --save



