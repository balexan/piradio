const express = require("express");
const app = express();
const midi = require('midi');
//const fs = require('fs');
const stations = [56,57,58]
var paused = false;
const output = new midi.Output();
output.openPort(1);
const input = new midi.Input();
var player = null;
var playing = -1;

const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function setVolume(vol) {
  const { stdout, stderr } = await exec('amixer -c 0  sset Headphone '+vol+'%');
  if (stderr) console.log('stderr:', stderr);
}

async function playStation(which){
   if (playing > -1) output.sendMessage([144,stations[playing],0]);
   exec('mpc play '+(which+1));
   playing = which;
//   fs.writeFileSync("playing", playing, function() {});
   output.sendMessage([144,stations[playing],1]);
}

var playAfterRestart=function(which){
   playing = which;
   paused = false;
   output.sendMessage([144,stations[playing],1]);
   exec('mpc play '+(which+1));
}

var pauseStation = function(){
   paused = !paused;
//   fs.writeFile("playing", paused ? -1 : playing, function() {});
   exec('mpc '+(paused ? 'pause' : 'play'));
   output.sendMessage([144,stations[playing],paused ? 0 : 1]);
}

/*
try {
  var test = fs.readFileSync('playing', 'utf8', function() {}); 
  console.log("restarting "+test);
  if (test  > -1) playAfterRestart(test);
} catch (e) {}
*/

input.on('message', (deltaTime, message) => {
   if (message[0]==144) {
      if (message[1]==7){
         exec("sudo shutdown -r now");
      }
      for (var i=0; i<stations.length; i++){
         if (message[1]==stations[i]) {
            if (i != playing){
               playStation(i)
            } else {
               pauseStation();
            }
         }
      }
   }
   if (message[0]==176 && message[1]==48){
      var vol = message[2];
      var lvol = parseInt(vol/127*100);
      console.log("Vol: "+lvol);
      setVolume(lvol);
   }
   // console.log(`m: ${message}`);
});

input.openPort(1);
input.ignoreTypes(true, true, true);

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

