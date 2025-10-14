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

sudo apt install -y mosquitto mosquitto-clients
sudo systemctl enable mosquitto.service

sudo mkdir /opt/zigbee2mqtt
sudo chown -R ${USER}: /opt/zigbee2mqtt
git clone --depth 1 https://github.com/Koenkk/zigbee2mqtt.git /opt/zigbee2mqtt
cd /opt/zigbee2mqtt
npm ci
npm run build
cp /opt/zigbee2mqtt/data/configuration.example.yaml /opt/zigbee2mqtt/data/configuration.yaml
nano /opt/zigbee2mqtt/data/configuration.yaml
# add permit_join: true on top

sudo nano /etc/systemd/system/zigbee2mqtt.service

[Unit]
Description=zigbee2mqtt
After=network.target

[Service]
Environment=NODE_ENV=production
Type=notify
ExecStart=/usr/bin/node index.js
WorkingDirectory=/opt/zigbee2mqtt
StandardOutput=inherit
# Or use StandardOutput=null if you don't want Zigbee2MQTT messages filling syslog, for more options see systemd.exec(5)
StandardError=inherit
WatchdogSec=10s
Restart=always
RestartSec=10s
User=pi

[Install]
WantedBy=multi-user.target

sudo systemctl start zigbee2mqtt


git clone git@github.com:balexan/piradio.git
sudo apt install nodejs
ssh-keygen
add key to github

sudo apt-get install libasound2-dev
sudo apt-get install alsa-utils
sudo apt-get install mpd mpc
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

airplay and spotify:
clone repo `git clone https://github.com/nicokaiser/rpi-audio-receiver.git`
cd ...; ./sh_install
If you want a quick fix for your local environment open /etc/raspotify/conf and just set LIBRESPORT_AUTOPLAY to on or off:
LIBRESPOT_AUTOPLAY=on

# Shairpoint sync
apt update
apt upgrade # this is optional but recommended
apt-get install --no-install-recommends build-essential git autoconf automake libtool \
    libpopt-dev libconfig-dev libasound2-dev avahi-daemon libavahi-client-dev libssl-dev libsoxr-dev

git clone https://github.com/mikebrady/shairport-sync.git
cd shairport-sync
autoreconf -fi
./configure --sysconfdir=/etc --with-alsa \
    --with-soxr --with-avahi --with-ssl=openssl --with-systemd --with-airplay-2
make
make install
systemctl enable shairport-sync
