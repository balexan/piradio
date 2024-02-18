
import { piradio, state} from "./piradio.js"
import * as util from 'util';
import {exec as exec_nonpromise} from 'child_process'
const exec = util.promisify(exec_nonpromise)

piradio.on('volume', async (vol) => {
    if (state.type=='radio' || state.type =='file'){
        const lnvol =  Math.round((2*vol+Math.log10(vol+1)*50)/3)
        const { stdout, stderr } = await exec('mpc volume '+lnvol);
        if (stderr) state.errors.push('stderr:'+ stderr);
    }
})

piradio.on('play', async (what) => {
    if (what.type == 'radio'){
        await exec('mpc clear');
        await exec('mpc load internetradio');  
        await exec('mpc repeat on');
        await exec('mpc play '+(what.station+1));
    } else if (what.type == 'file'){
        await exec('mpc clear');
        what.list.map(async (f)=>{ await exec('mpc add '+f)})
        await exec('mpc play '+what.song);
    } else {
        await exec('mpc stop');
    }
})

piradio.on('pause', async (what) => {
    exec('mpc stop');
})

piradio.on('prev', async (what) => {
    if (state.type == 'radio' || state.type == 'file')
        await exec('mpc prev');
})

piradio.on('next', async (what) => {
    if (state.type == 'radio' || state.type == 'file')
        await exec('mpc next');
})
