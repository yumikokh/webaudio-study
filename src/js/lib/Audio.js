import EventEmitter from "eventemitter2";

const _AudioContext = window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
const _context = _AudioContext ? new _AudioContext() : null;
let _muteNode = null;
if (_context) {
    _muteNode = _context.createGain();
    _muteNode.connect(_context.destination);
}

// スマホで任意のタイミングで砕石できるようになる魔法らしい
function onFirstPointerDown() {
    document.body.removeEventListener("touchstart", onFirstPointerDown)
    document.body.removeEventListener("mousedown", onFirstPointerDown)
    _context.createBufferSource().start(0)
}
document.body.addEventListener("touchstart", onFirstPointerDown)
document.body.addEventListener("mousedown", onFirstPointerDown)


export default class Audio extends EventEmitter {
    constructor(url) {
        super();

        this.url = url;
        this.type = 'lowpass';
        this._isDisposed = false;
    }

    _createSource(_buffer) {
        this._gainNode = _context.createGain();
        this._gainNode.connect(_muteNode);

        this._filterNode = _context.createBiquadFilter();
        this._filterNode.connect(this._gainNode);
        this._filterNode.type = this.type;

        this._filterNode.value = 440;

        this._source = _context.createBufferSource();
        this._source.buffer = _buffer;
        this._source.connect(this._filterNode);

        return this._source;
    }

    load() {
        this._loadPromise = this._loadPromise || new Promise(resolve => {
            const _request = new XMLHttpRequest();
            _request.open("GET", this.url, true);
            _request.responseType = "arraybuffer";
            _request.onload = () => {
                _context.decodeAudioData(_request.response, _buffer => {
                    resolve(this._createSource(_buffer));
                })
            }
            _request.send();
        })
        return this._loadPromise;
    }

    isEnded() {
        return this._isDisposed;
    }

    start() {
        if (this._isDisposed) {
            return;
        }
        return this.load().then(_source => new Promise(resolve => {
            _source.start(0);
            console.log(this._filterNode.frequency, this._filterNode.detune, this._filterNode.Q)
            _source.onended = () => {
                this._dispose();
                this.emit("audio:ended");
                resolve();
            }
        }))
    }

    stop() {
        if (this._isDisposed) {
            return;
        }
        this._dispose();
    }

    _dispose() {
        this._isDisposed = true;
        this.load().then(_source => {
            try {
                _source.disconnect();
                _source.stop(0);
            } catch (e) {
                console.log(e);
            } finally {
                if (this._gainNode) {
                    this._gainNode.disconnect();
                    this._gainNode = null;
                }
            }

        })
    }

    setMute(isMute = true) {
        if (this._isDisposed) {
            return;
        }
        if (isMute) {
            _muteNode.gain.value = 0;
        } else {
            _muteNode.gain.value = 1;
        }
    }

    setFrequency(_value) {
        if (this._isDisposed || !this._filterNode) {
            return;
        }
        const frequency = this._filterNode.frequency;
        const value = _value * frequency.defaultValue * 2;
        frequency.value = value;
    }

    setQuality(_value) {
        if (this._isDisposed || !this._filterNode) {
            return;
        }
        const quality = this._filterNode.Q;
        const value = 3 - _value * 4;
        quality.value = value;
        // console.log(value, quality.value)
    }

    setFilterType(_type) {
        this.type = _type;
        if (this._isDisposed || !this._filterNode) {
            return;
        }
        this._filterNode.type = this.type;
    }

};
