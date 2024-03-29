import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {app} from "./webinterface.js"
import { piradio, state } from "./piradio.js"
import * as fs from 'fs';
const querystring = require("querystring")
const SpotifyWebApi = require("spotify-web-api-node");

let livingRoomId="ce209d6834e61e7b16445fe3def1e6e4f777c415"
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

async function doInitalStuff(){

        spotifyApi.setRefreshToken(token_data.refresh_token);
        let data = await spotifyApi.refreshAccessToken() 
        spotifyApi.setAccessToken(data.body['access_token']);
}
let token_data = require('./spotify.json')

doInitalStuff()

app.get('/login', function(req, res) {

  var state = "whatever"
  var scope = 'user-read-private user-library-read user-read-email user-read-playback-state user-modify-playback-state';

  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', async(req, res)=>{
    try {
        spotifyApi.authorizationCodeGrant(req.query.code)
        .then(async (data)=>{
            console.log('The token expires in ' + data.body['expires_in']);
            console.log('The access token is ' + data.body['access_token']);
            console.log('The refresh token is ' + data.body['refresh_token']);
            
            spotifyApi.setAccessToken(data.body['access_token']);
            spotifyApi.setRefreshToken(data.body['refresh_token']);
            fs.writeFile('spotify.json',JSON.stringify(data.body,null,2),(err) => {
                if (err) throw err;
                console.log('The file has been saved!');
              });  
            res.send('ok')
        }, (error)=>{
            console.log("Error "+error)
        })
    } catch (e) { state.errors.push("spotify "+e)}
})

app.get('/playSpotify', async function(req, res){       
    try {
        await spotifyApi.transferMyPlayback([livingRoomId])
        await spotifyApi.play({ "context_uri": "spotify:"+req.query.what  })
        piradio.emit("play",{type: "spotify", what: req.query.what})
        let current = await spotifyApi.getMyCurrentPlayingTrack()
        console.log(current.body.item.album)
        res.send('<html><body><img src="'+current.body.item.album.images[0].url+'">')
    } catch (e) { state.errors.push("spotify "+e)}
    piradio.emit("play", {type: "spotify", what: req.query.what})
});

app.get('/devices', async (req,res)=>{
    spotifyApi.getMyDevices()
    .then(async function(data) {
        res.send(data)
    })
})

app.get('/favouriteAlbums', async (req,res)=>{
    spotifyApi.getMySavedAlbums({
        limit : 50,
        offset: 0
      })
    .then(async function(data) {
        res.send(data)
    }, function(err) {
    console.log('Something went wrong!', err);
  })
})

piradio.on('next', async ()=>{
    if (state.type=='spotify') await spotifyApi.skipToNext()
})

piradio.on('prev', async ()=>{
    if (state.type=='spotify') await spotifyApi.skipToPrevious()
})

piradio.on('volume', async (vol)=>{
    if (state.type=='spotify') await spotifyApi.setVolume(vol)
})

piradio.on('pause', async (vol)=>{
    if (state.type=='spotify') await spotifyApi.pause()
})

piradio.on('play', async (vol)=>{
    if (state.type!='spotify') await spotifyApi.pause()
})
