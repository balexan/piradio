import { piradio, state } from "./piradio.js";
import * as util from "util";
import { exec as exec_nonpromise } from "child_process";
const exec = util.promisify(exec_nonpromise);
const stations = [
  "http://stream2.srr.ro:8022",
  "https://ais-edge94-nyc04.cdnstream.com/2202_128.mp3",
  "https://tsfjazz.ice.infomaniak.ch/tsfjazz-high.mp3"
];

const stations20 = stations.flatMap(item => Array(20).fill(item));
await exec("mpc clear");
for (let s of stations20) await exec("mpc add "+s);
await exec("mpc repeat on");

async function playStation(stationNr) {
  await exec("mpc play "+(stationNr*20+1));
}

piradio.on("volume", async (vol) => {
  if (state.type == "radio" || state.type == "file") {
    const lnvol = Math.round((2 * vol + Math.log10(vol + 1) * 50) / 3);
    const { stdout, stderr } = await exec("mpc volume " + lnvol);
    if (stderr) state.errors.push("stderr:" + stderr);
  }
});

piradio.on("play", async (what) => {
  if (what.type == "radio") {
    playStation(what.station);
  } else if (what.type == "file") {
    await exec("mpc clear");
    what.list.map(async (f) => {
      await exec('mpc add "' + f + '"');
    });
    await exec("mpc play " + what.song);
  } else {
    await exec("mpc stop");
  }
});

piradio.on("pause", async (what) => {
  exec("mpc stop");
});

piradio.on("prev", async (what) => {
  if (state.type == "file") await exec("mpc prev");
  if (state.type == "radio")
    if (state.station != -1) {
      piradio.emit("play", {
        type: "radio",
        station: (state.station - 1 + stations.length) % stations.length,
      });
    }
});

piradio.on("next", async (what) => {
  if (state.type == "file") await exec("mpc next");
  if (state.station != -1) {
    piradio.emit("play", {
      type: "radio",
      station: (state.station + 1) % stations.length,
    });
  }
});
