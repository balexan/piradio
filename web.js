const express = require("express");
const app = express();
const stations = [56,57,58]
var paused = true;
var volume = 70;
var player = null;
var playing = -1;
var lastplay = 0;

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs');

exec('mpc load internetradio');
exec('mpc repeat on');
setVolume(volume);

var mqtt = require('mqtt')
var client  = mqtt.connect('mqtt://localhost')

 
client.on('connect', function () {
  client.subscribe('zigbee2mqtt/0xbc33acfffed6666d', function (err,granted) {
    if (err) {
      console.log(err)
   }
  })
})

async function setVolume(vol) {
  const lnvol =  Math.round((2*vol+Math.log10(vol+1)*50)/3)
  const { stdout, stderr } = await exec('mpc volume '+lnvol);
  if (stderr) console.log('stderr:', stderr);
}

async function playStation(which){
   exec('mpc play '+(which+1));
   playing = which;
   paused = false;
   client.publish('zigbee2mqtt/0x847127fffefd603c/set', '{"state": "ON"}');
   lastplay = Date.now()
}

var pauseStation = function(){
   if (playing == -1){
     playStation(0);
   } else {
     paused = !paused;
     client.publish('zigbee2mqtt/0x847127fffefd603c/set', '{"state": "'+(paused ? 'OFF' : 'ON')+'"}');
     exec('mpc '+(paused ? 'stop' : 'play'));
   }
}

client.on('message', function (topic, message) {
  var action = JSON.parse(message.toString()).action
  if (action == "toggle") pauseStation()
  if (action == "arrow_left_click") playStation(0)
  if (action == "arrow_right_click") playStation(1)
  if (action == "brightness_up_click") {
     if (volume < 96) volume = volume + 5;
     setVolume(volume);
  }
 if (action == "brightness_down_click") {
     if (volume > 5) volume = volume - 5;
     setVolume(volume);
  }

})


const { spawn } = require('child_process');
const readStream = fs.createReadStream('/tmp/shairport-sync-metadata');
const command = spawn('shairport-sync-metadata-reader');

readStream.pipe(command.stdin);
command.stdout.on('data', (data) => {
  if (data.toString().startsWith('Enter Active State.')) {
      client.publish('zigbee2mqtt/0x847127fffefd603c/set', '{"state": "ON"}');
      exec('mpc stop');
      paused=true;
      lastplay=Date.now();
  }
  if (data.toString().startsWith('Exit Active State.')) {
      setTimeout(()=>{
        if (Date.now() > lastplay + 15*60*1000) client.publish('zigbee2mqtt/0x847127fffefd603c/set', '{"state": "OFF"}');
      }
  }
});

command.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});








app.use(express.static("/home/pi/piradio/public"));

app.get("/", function(request, response) {
  response.sendFile(__dirname + "/views/index.html");
});

app.get("/0", function(req,res) { playStation(0); res.send("ok"); });
app.get("/1", function(req,res) { playStation(1); res.send("ok"); });
app.get("/2", function(req,res) { playStation(2); res.send("ok"); });
app.get("/vol/:vol", function(req,res) { volume = req.params.vol; setVolume(volume); res.send("ok"); });
app.get("/pause", function(req,res) { pauseStation(); res.send("ok"); });
app.get("/on", function(req,res) { 
   client.publish('zigbee2mqtt/0x847127fffefd603c/set', '{"state": "ON"}');
   res.send("ok");
});
app.get("/off", function(req,res) { 
   client.publish('zigbee2mqtt/0x847127fffefd603c/set', '{"state": "OFF"}');
   res.send("ok");
});
app.get("/status",function(req,res) {exec("mpc status",(err,stdout,stderr)=>{res.send(stdout)})})

const listener = app.listen(
80, function() {
  console.log("Your app is listening on port " + listener.address().port);
});

