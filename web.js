const express = require("express");
const app = express();
const stations = [56,57,58]
var paused = true;
var volume = 70;
var player = null;
var playing = -1;

const util = require('util');
const exec = util.promisify(require('child_process').exec);

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
  const { stdout, stderr } = await exec('amixer -c 0  sset Headphone '+vol+'%');
  if (stderr) console.log('stderr:', stderr);
}

async function playStation(which){
   exec('mpc play '+(which+1));
   playing = which;
   paused = false;
   client.publish('zigbee2mqtt/0x847127fffefd603c/set', '{"state": "ON"}');
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

app.use(express.static("/home/pi/piradio/public"));

app.get("/", function(request, response) {
  response.sendFile(__dirname + "/views/index.html");
});

app.get("/0", function(req,res) { playStation(0); res.send("ok"); });
app.get("/1", function(req,res) { playStation(1); res.send("ok"); });
app.get("/2", function(req,res) { playStation(2); res.send("ok"); });
app.get("/vol/:vol", function(req,res) { var vol = req.params.vol; setVolume(vol); console.log("volume "+vol); res.send("ok"); });
app.get("/pause", function(req,res) { pauseStation(); res.send("ok"); });
app.get("/status",function(req,res) {exec("mpc status",(err,stdout,stderr)=>{res.send(stdout)})})

const listener = app.listen(
80, function() {
  console.log("Your app is listening on port " + listener.address().port);
});

