const express = require("express");
const querystring = require("querystring")
const SpotifyWebApi = require("spotify-web-api-node");

const app = express();
const stations = [56,57,58]
var paused = true;
var volume = 70;
var player = null;
var playing = 0;
var lastplay = 0;
var radio=true;

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs');
const path = require('path');

exec('mpc clear');
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
   exec('mpc clear');
   exec('mpc load internetradio');  
   exec('mpc play '+(which+1));
   playing = which;
   paused = false;
   client.publish('zigbee2mqtt/0x847127fffefd603c/set', '{"state": "ON"}');
   lastplay = Date.now()
}

var playpause = function(){
  paused = !paused;
  if (paused) {
    exec('mpc stop');
    if (!radio){
      exec('mpc clear')
      exec('mpc load internetradio')
      radio = true
    }
    setTimeout(()=>{
      if (Date.now() > lastplay + 15*60*1000) client.publish('zigbee2mqtt/0x847127fffefd603c/set', '{"state": "OFF"}');
    },15*60*1000)
  } else {
    client.publish('zigbee2mqtt/0x847127fffefd603c/set', '{"state": "ON"}');
    exec('mpc play');
  }
}

client.on('message', function (topic, message) {
  var action = JSON.parse(message.toString()).action
  if (action == "toggle") playpause()
  if (action == "arrow_left_click") {
    if (paused) playStation(0);
    else exec('mpc prev')
  }

  if (action == "arrow_right_click") {
    if (paused) playStation(1);
    else exec('mpc next')
  }
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
      },15*60*1000)
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
app.get("/vol/:vol", function(req,res) { volume = parseInt(req.params.vol); setVolume(volume); res.send("ok"); });
app.get("/pause", function(req,res) { playpause(); res.send("ok"); });
app.get("/on", function(req,res) { 
   client.publish('zigbee2mqtt/0x847127fffefd603c/set', '{"state": "ON"}');
   res.send("ok");
   lastplay=Date.now();
});

app.get("/off", function(req,res) { 
   client.publish('zigbee2mqtt/0x847127fffefd603c/set', '{"state": "OFF"}');
   res.send("ok");
});

app.get("/status",function(req,res) {exec("mpc status",(err,stdout,stderr)=>{res.send(stdout)})})
app.get("/tango", function(req,res) { 
  const folderPath = "/media/exfat";
  fs.readdir(folderPath, { withFileTypes: true }, (err, files) => {
      if (err) return res.status(500).send({ error: err});
      let dirs={}
      for (let f of files){
          if (f.name.endsWith('- Tango')) dirs[f.name.slice(0,-8)] = { ...dirs[f.name.slice(0,-8)],tango: f.name}
          else if (f.name.endsWith('- Vals')) dirs[f.name.slice(0,-7)] = { ...dirs[f.name.slice(0,-7)],vals: f.name}
          else if (f.name.endsWith('- Milonga')) dirs[f.name.slice(0,-10)] = { ...dirs[f.name.slice(0,-10)],milonga: f.name}
          else dirs[f.name]={other: f.name}
      }
      res.json(dirs);
  });
});

app.get("/tangodir.html", function(request, response) {
  response.sendFile(__dirname + "/views/tangodir.html");
});

app.get("/tangosongs", function(request, res) {
  const dir = querystring.unescape(request.query.dir)
  const folderPath = "/media/exfat/"+request.query.dir;
  fs.readdir(folderPath, { withFileTypes: true }, (err, files) => {
      if (err) return res.status(500).send({ error: err});
      let dirs = files.map(dir => dir.name);
      res.json(dirs);
  });
});

app.get("/playTango", function(req, res) {
  const dir = querystring.unescape(req.query.dir) // .replace(/'/g, "\'\'");
  const song = querystring.unescape(req.query.song) // .replace(/'/g, "\'\'");
  client.publish('zigbee2mqtt/0x847127fffefd603c/set', '{"state": "ON"}');

  const folderPath = "/media/exfat/"+req.query.dir;
  fs.readdir(folderPath, { withFileTypes: true }, (err, files) => {
    if (err) return res.status(500).send({ error: err});
    exec ('mpc clear')
    let songs = files.map((f,i) => {
      exec(`mpc add "/media/exfat/${dir}/${f.name}"`)
      if (f.name == song) exec (`mpc play ${i+1}`)
      paused = false
      radio = false
    })
  });
  lastplay=Date.now()
  res.send('ok')
})


livingRoomId="c7b60f3edf3318e80575d5e28c1ce24aa99a9025"
let client_id= "2c77aeb70d644c20a3dc05abae8ed720"
let clientSecret= "2b0f0b84a3b34509854e48e07708d565"

let redirect_uri = 'http://pi.local:80/callback'
let token='BQBc4HJkHpxFZgETFiYOAh_GGpUH-ssHooV40zMoCGmAhF_U97sksnnpGSeRijl5inGuNh-M9YpdrxatSGQjJrc08b2-FGWfdqNDXydAyZaYiQnkdzmUzpRAtkKrDr2bTo6LWNs0QGFGKLThfi6x449qcKvctS6C7S_aBOnM4Z4VRwBafnraN-cGWwYhVqzlUZnRfiw'
let refresh_token='AQCdROcpKPownlZuZbyk_0DANQUXXw6jeOvJlbyXMzu4DNzv7zJvgTM81KYyaOjSsaHMylIDUBVWvFQrQdPWPaTKZ0RRaxixErqVQqVRaqPRC-lbXLSYqmvsijy-3T70Ol4'


const spotifyApi = new SpotifyWebApi({
  clientId: "2c77aeb70d644c20a3dc05abae8ed720",
  clientSecret: "2b0f0b84a3b34509854e48e07708d565",
  redirectUri: redirect_uri
})

spotifyApi.setAccessToken(token);
spotifyApi.setRefreshToken(refresh_token);


app.get('/login', function(req, res) {

  var state = "whatever"
  var scope = 'user-read-private user-read-email user-read-playback-state user-modify-playback-state';

  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res){
    res.send('ok')
    let code = req.query.code
    spotifyApi.authorizationCodeGrant(req.query.code).then(
        function(data) {
          console.log('The token expires in ' + data.body['expires_in']);
          console.log('The access token is ' + data.body['access_token']);
          console.log('The refresh token is ' + data.body['refresh_token']);
      
          // Set the access token on the API object to use it in later calls
          spotifyApi.setAccessToken(data.body['access_token']);
          spotifyApi.setRefreshToken(data.body['refresh_token']);


        },
        function(err) {
          console.log('Something went wrong!', err);
        }
      );
})

app.get('/playSpotify', async function(req, res){       
  /*  
    spotifyApi.getMyDevices()
    .then(async function(data) {
        let availableDevices = data.body.devices;
        let livingRoomId = availableDevices.filter(d=>d.name=='Living Room')[0].id
        console.log('Living Room ID: '+livingRoomId)
        await spotifyApi.transferMyPlayback([livingRoomId])
        .then(function() {
          console.log('Transfering playback to ' + livingRoomId);
        }, function(err) {
             console.log('Something went wrong!', err);
             res.send('no living room')
        });
  */
        await spotifyApi.play({
            "context_uri": "spotify:"+req.query.what, // album:5ht7ItJgpBH7W6vJ5BqpPr",
            "position_ms": 0
        })
        res.send('playing')
    }, function(err) {
    res.send('Something went wrong!', err);
    });

//})

const listener = app.listen(80, function() {
  console.log("Your app is listening on port " + listener.address().port);
});

