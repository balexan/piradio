const { NFC } = require('nfc-pcsc'); 
const nfc = new NFC(); 
 
var player = require('play-sound')(opts = {});
var filename = "mack.mp3";
var audio =  null;

nfc.on('reader', reader => {
 
    console.log(`${reader.reader.name}  device attached`);
 
    reader.on('card', card => {
        console.log(`${reader.reader.name}  card detected`, card);
       if (card.uid=="eb01ef0b") {
         audio = player.play(filename);
       }
    });
 
    reader.on('card.off', card => {
        console.log(`${reader.reader.name}  card removed`, card);
        if (audio) audio.kill();
    });
 
    reader.on('error', err => {
        console.log(`${reader.reader.name}  an error occurred`, err);
    });
 
    reader.on('end', () => {
        console.log(`${reader.reader.name}  device removed`);
    });
 
});
 
nfc.on('error', err => {
    console.log('an error occurred', err);
});
