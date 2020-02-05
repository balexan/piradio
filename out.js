const midi = require('midi');
 
// Set up a new output.
const output = new midi.Output();
 
// Count the available output ports.
output.getPortCount();
 
// Get the name of a specified output port.
console.log(output.getPortName(1));
 
// Open the first available output port.
output.openPort(1);
 
// Send a MIDI message.
output.sendMessage([144,56,1]);


setTimeout(function(){
// Close the port when done.
output.closePort();
},100000);
