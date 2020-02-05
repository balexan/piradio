const express = require("express");
const app = express();
const midi = require('midi');
const urls = [
   "http://stream2.srr.ro:8022",
   "https://listen2.argentinetangoradio.com",
   "../music/Beatles\ 1969\ -\ Abbey\ Road/list.m3u",
 "../music/Beethoven61/list.m3u",
 "../music/Cesaria/Cesaria Evora - Anthologie Mornas & Coladeras (2002)/list.m3u",
 "../music/Cesaria/Cesaria Evora - Cabo Verde/list.m3u",
 "../music/Cesaria/Cesaria Evora - Cafe Atlantico/list.m3u",
 "../music/Cesaria/Cesaria Evora - Cesaria/list.m3u",
 "../music/Cesaria/Cesaria Evora - La Diva Aux Pieds Nus/list.m3u",
 "../music/Cesaria/Cesaria Evora - Mar azul/list.m3u",
 "../music/Cesaria/Cesaria Evora - Rogamar/list.m3u",
 "../music/Cesaria/Cesaria Evora - Sao Vicente Di Longe (2001)/list.m3u",
 "../music/Cesaria/Cesaria Evora - Sodade/list.m3u",
 "../music/Cesaria/Cesaria Evora - The Best Of (1998)/list.m3u",
 "../music/Cesaria/Cesaria Evora Live a l'Olympia/list.m3u",
 "../music/Cesaria/Cesaria Evora-Miss Perfumado/list.m3u",
 "../music/Cesaria/Cesaria Evora-Nova Sintra/list.m3u",
 "../music/Cesaria/Cesaria Evora-Voz D'Amor/list.m3u",
"../music/Cesaria/Evora Live Lugano July 1997/list.m3u"
];
const stations = [56,57,58,59,60,52,44,36,28,20,12,4,61,53,45,37,29,21,13]
var paused = false;
const output = new midi.Output();
output.openPort(1);
const input = new midi.Input();
var player = null;
var playing = -1;

const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function setVolume(vol) {
  const { stdout, stderr } = await exec('amixer -c0 sset PCM '+vol+'%');
  if (stderr) console.log('stderr:', stderr);
}

var playStation = function(which){
   if (!player) {
      var Omx = require('node-omxplayer');
      player = Omx();
   }
      
   if (playing > -1) output.sendMessage([144,stations[playing],0]);
   playing = which;
   paused = false;
   player.newSource(urls[which],'alsa');
   output.sendMessage([144,stations[playing],1]);
}

var pauseStation = function(){
   paused = !paused;
   player.play();
   output.sendMessage([144,stations[playing],paused ? 0 : 1]);
}

input.on('message', (deltaTime, message) => {
   if (message[0]==144) {
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

app.use(express.static("public"));

app.get("/", function(request, response) {
  response.sendFile(__dirname + "/views/index.html");
});

app.get("/0", function(req,res) { playStation(0); res.send("ok"); });
app.get("/1", function(req,res) { playStation(1); res.send("ok"); });
app.get("/vol/:vol", function(req,res) { var vol = req.params.vol; setVolume(vol); console.log("volume "+vol); res.send("ok"); });
app.get("/pause", function(req,res) { pauseStation(); res.send("ok"); });


const listener = app.listen(
80, function() {
  console.log("Your app is listening on port " + listener.address().port);
});

