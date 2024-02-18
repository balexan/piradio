import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import { piradio, state } from "./piradio.js"
const fs = require('fs');
const { spawn } = require('child_process');
const readStream = fs.createReadStream('/tmp/shairport-sync-metadata');
const command = spawn('shairport-sync-metadata-reader');


readStream.pipe(command.stdin);

command.stdout.on('data', (data) => {
  if (data.toString().startsWith('Enter Active State.')) {
    piradio.emit('play',{type: 'airplay'})
  }
  if (data.toString().startsWith('Exit Active State.')) {
    piradio.emit('pause')
  }
});

command.stderr.on('data', (data) => {
  state.errors.push(`airplay: ${data}`);
});
