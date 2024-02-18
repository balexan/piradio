import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import {app} from "./webinterface.js"
import { piradio } from "./piradio.js"
const querystring = require("querystring")
const fs = require('fs');
import { URL } from 'url';
const __dirname = new URL('.', import.meta.url).pathname;

app.get("/tangodir.html", function(request, response) {
    response.sendFile(__dirname + "/views/tangodir.html");
  });
  
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

    const folderPath = "/media/exfat/"+dir
    fs.readdir(folderPath, { withFileTypes: true }, (err, files) => {
      if (err) return res.status(500).send({ error: err});
      let fileList=[]
      let songNr=0
      let songs = files.map((f,i) => {
        fileList.push(folderPath+"/"+f.name)
        if (f.name == song) songNr = i+1
      })
      piradio.emit("play",{type: "file", list: fileList, song: songNr})
    });
    res.send('ok')
  })
  
  