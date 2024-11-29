import { piradio, state } from "./piradio.js"
var lastplay = 0

import { createReadStream } from "fs";
const devicePath = '/dev/input/event0';  // Replace with your actual device path
const buffer = Buffer.alloc(16);  // 16-byte input event structure
const stream = createReadStream(devicePath, { flags: 'r', highWaterMark: 16 });  // 16 bytes per event

// Handle each chunk of data from the stream
stream.on('data', (chunk) => {
  if (chunk.length === 16) {

    const timeSeconds = chunk.readUInt32LE(0);    // Time seconds (low 4 bytes)
    const timeMicroseconds = chunk.readUInt32LE(4); // Time microseconds (next 4 bytes)
    const eventType = chunk.readUInt16LE(8);      // Event type (2 bytes)
    const eventCode = chunk.readUInt16LE(10);     // Event code (2 bytes)
    const eventValue = chunk.readInt32LE(12);     // Event value (4 bytes)

    if (eventCode == 272 && eventValue == 0) piradio.emit("playpause");
    if (eventCode == 273 && eventValue == 0) piradio.emit("next");
    if (eventCode == 11 && eventValue == 120) piradio.emit("volumeup");
    if (eventCode == 11 && eventValue == -120) piradio.emit("volumedown");

  }
});

