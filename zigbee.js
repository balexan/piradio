var mqtt = require('mqtt')
var client  = mqtt.connect('mqtt://localhost')
import { piradio, state } from "./piradio.js"
var lastplay = 0

client.on('connect', function () {
  client.subscribe('zigbee2mqtt/0xbc33acfffed6666d', function (err,granted) {
    if (err) {
      state.errors.push('zigbee: '+err)
   }
  })
})

client.on('message', function (topic, message) {
    var action = JSON.parse(message.toString()).action
    switch (action){
        case("toggle"): {  piradio.emit("playpause"); break}
        case("arrow_right_click"): { piradio.emit("next"); break;} 
        case ("arrow_left_click"): { piradio.emit("prev"); break}
        case ("brightness_up_click"): { piradio.emit("volumeup"); break}
        case ("brightness_down_click"): { piradio.emit("volumedown"); break}
    }
  })

piradio.on('play',()=>{
    lastplay=Date.now();
    client.publish('zigbee2mqtt/0x847127fffefd603c/set', '{"state": "ON"}');
    state.ampon = true
})

piradio.on('pause',()=>{
    setTimeout(()=>{
        if (Date.now() > lastplay + 15*60*1000) 
        client.publish('zigbee2mqtt/0x847127fffefd603c/set', '{"state": "OFF"}');
        state.ampon = false
    },15*60*1000)
})