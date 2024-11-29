import EventEmitter from 'node:events';

export let state= {
    paused: false,
    station: -1,
    volume: 20,
    ampon: false,
    type: "radio",
    song: '',
    list: [],
    errors: ['Errors:']
}

class piRadioClass extends EventEmitter {
    constructor(){
        super()
        async function importThem(){
            await import('./webinterface.js')
            await import('./mpc.js')
            await import('./mouse.js')
//            await import('./spotify.js')
//            await import('./tango.js')
//            await import('./airplay.js')
//            await import('./zigbee.js')
        }
        importThem()
    }
}

export const piradio = new piRadioClass();

piradio.on('playpause', () => {
    if (state.paused){
        piradio.emit('play', {type: 'radio', station: state.station == -1 ? 0 : state.station}); 
    } else {
        piradio.emit('pause'); 
    }
});

piradio.on('play', (what) => {
    state.radio = what.type == 'radio' 
    state.type = what.type
    state.paused = false
    if (what.type=='radio'){
        state.station = what.station
    } else {
        if (what.type=='file'){
            state.song=what.song
            state.list=what.list
        }
        state.radio=false
    }
    piradio.emit('statechange',state)
});

piradio.on('pause', () => {
    state.paused = true
    piradio.emit('statechange',state)
});

piradio.on('volumeup', () => {
    if (state.volume < 96) piradio.emit('volume', state.volume + 5)
});

piradio.on('volumedown', () => {
    if (state.volume > 5) piradio.emit('volume', state.volume - 5)
});

piradio.on('volume', (vol) => {
    state.volume = vol
    piradio.emit('statechange',state)
});

piradio.on('ampon', (on) => {
    state.ampon = on
    piradio.emit('statechange',state)
});
