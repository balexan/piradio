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
sudo apt-get install libasound2-dev alsa-utils mpd mpc node npm
sudo node web

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

sudo crontab -e
_/5 _ \* \* /home/pi/piradio/checkmpd.sh > /home/pi/piradio/cronlog 2>&1

USB soundcard setup:
sudo nano /etc/mpd.conf
audio_output {
type "alsa"
name "USB"

# device "hw:0,1" # optional

        mixer_type      "software"      # optional

# mixer_device "default" # optional

# mixer_control "PCM" # optional

# mixer_index "0" # optional

}

boot exfat:
sudo apt install exfat-fuse
sudo apt install exfatprogs
sudo mkdir /media/exfat
sudo mount -t exfat /dev/sda1 /media/exfat

sudo blkid
sudo nano /etc/fstab
UUID=CA1C-06BC /media/exfat exfat defaults,auto,umask=000,users,rw 0 0
