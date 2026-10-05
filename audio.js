// Web Audio API Procedural Synthwave Sound & Music Engine
// 100% self-contained, no external audio files required.

class CyberAudioEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.isMusicPlaying = false;
        this.masterVolume = 0.7;
        this.musicVolume = 0.45;
        this.sfxVolume = 0.65;

        // Music state
        this.bpm = 124;
        this.step = 0;
        this.timer = null;
        this.nextNoteTime = 0;
        this.scheduleAheadTime = 0.1;
        this.lookahead = 25; // ms
        
        // Synthwave chord progression (Am - F - C - G in A minor)
        this.rootFreqs = {
            'A1': 55.00, 'C2': 65.41, 'E2': 82.41,
            'F1': 43.65, 'A2': 110.00, 'G1': 49.00,
            'D2': 73.42, 'B1': 61.74
        };

        this.bassSequence = [
            55.00, 55.00, 110.00, 55.00, 55.00, 55.00, 82.41, 55.00, // Am
            43.65, 43.65, 87.31, 43.65, 43.65, 43.65, 87.31, 65.41,  // F
            65.41, 65.41, 130.81, 65.41, 65.41, 65.41, 98.00, 65.41, // C
            49.00, 49.00, 98.00, 49.00, 49.00, 49.00, 73.42, 61.74   // G
        ];

        this.melodyLeadSequence = [
            220.00, 0, 261.63, 293.66, 329.63, 0, 293.66, 0,
            349.23, 0, 329.63, 293.66, 261.63, 0, 220.00, 0,
            261.63, 0, 329.63, 392.00, 329.63, 0, 261.63, 0,
            246.94, 0, 293.66, 329.63, 293.66, 0, 246.94, 0
        ];
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
            
            // Master gain
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);

            // Music bus
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
            this.musicGain.connect(this.masterGain);

            // SFX bus with subtle distortion / limiter
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
            this.sfxGain.connect(this.masterGain);

            // Analyser node for live HUD frequency spectrum visualizer
            this.analyser = this.ctx.createAnalyser();
            this.analyser.fftSize = 64;
            this.masterGain.connect(this.analyser);
            this.analyser.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    getVisualizerData() {
        if (!this.analyser) return null;
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);
        return dataArray;
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime, 0.05);
        }
        return this.isMuted;
    }

    startMusic() {
        this.init();
        if (this.isMusicPlaying) return;
        this.isMusicPlaying = true;
        this.step = 0;
        this.nextNoteTime = this.ctx.currentTime + 0.05;
        this.scheduler();
    }

    stopMusic() {
        this.isMusicPlaying = false;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    scheduler() {
        if (!this.isMusicPlaying) return;
        while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
            this.scheduleStep(this.step, this.nextNoteTime);
            const secondsPerBeat = 60.0 / this.bpm;
            const secondsPer16th = secondsPerBeat / 4.0; // 16th notes
            this.nextNoteTime += secondsPer16th;
            this.step = (this.step + 1) % 32;
        }
        this.timer = setTimeout(() => this.scheduler(), this.lookahead);
    }

    scheduleStep(stepIndex, time) {
        if (this.isMuted) return;

        // 1. Kick on beats 0, 4, 8, 12, 16, 20, 24, 28 (four-on-the-floor)
        if (stepIndex % 4 === 0) {
            this.triggerSynthKick(time);
        }

        // 2. Snare / Cyber Clap on 4, 12, 20, 28
        if (stepIndex % 8 === 4) {
            this.triggerCyberSnare(time);
        }

        // 3. Hi-hat on offbeats
        if (stepIndex % 2 === 1) {
            this.triggerHiHat(time, stepIndex % 4 === 2 ? 0.35 : 0.15);
        }

        // 4. Synthwave Arpeggio Bass (Every 16th note)
        const bassFreq = this.bassSequence[stepIndex % this.bassSequence.length];
        if (bassFreq) {
            this.triggerBassArp(time, bassFreq);
        }

        // 5. Synth Melody Lead (Select steps)
        const leadFreq = this.melodyLeadSequence[stepIndex % this.melodyLeadSequence.length];
        if (leadFreq > 0) {
            this.triggerSynthLead(time, leadFreq);
        }
    }

    // Drum Synths
    triggerSynthKick(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, time);
        osc.frequency.exponentialRampToValueAtTime(38, time + 0.08);

        gain.gain.setValueAtTime(0.8, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(time);
        osc.stop(time + 0.25);
    }

    triggerCyberSnare(time) {
        // Noise + body tone
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, time);
        osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);
        oscGain.gain.setValueAtTime(0.4, time);
        oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
        osc.connect(oscGain);
        oscGain.connect(this.musicGain);
        osc.start(time);
        osc.stop(time + 0.12);

        // White noise burst
        const bufferSize = this.ctx.sampleRate * 0.15;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1000, time);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.3, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.musicGain);

        noise.start(time);
        noise.stop(time + 0.18);
    }

    triggerHiHat(time, vol = 0.2) {
        const bufferSize = this.ctx.sampleRate * 0.04;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(7500, time);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        noise.start(time);
        noise.stop(time + 0.04);
    }

    // Melodic synth voices
    triggerBassArp(time, freq) {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        // Lowpass filter envelope with cyber resonance
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, time);
        filter.frequency.exponentialRampToValueAtTime(150, time + 0.14);
        filter.Q.setValueAtTime(6, time);

        gain.gain.setValueAtTime(0.35, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(time);
        osc.stop(time + 0.15);
    }

    triggerSynthLead(time, freq) {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc1.type = 'square';
        osc2.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq, time);
        // Slight detune for rich vintage synth chorus
        osc2.frequency.setValueAtTime(freq * 1.004, time);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1800, time);
        filter.Q.setValueAtTime(2.5, time);

        gain.gain.setValueAtTime(0.18, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + 0.22);
        osc2.stop(time + 0.22);
    }

    // Sound Effects (SFX)
    playEat(isBonus = false) {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        const startFreq = isBonus ? 587.33 : 440;
        const midFreq = isBonus ? 880 : 659.25;
        const endFreq = isBonus ? 1174.66 : 880;

        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(midFreq, now + 0.05);
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.12);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.16);
    }

    playBoost() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(320, now + 0.2);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, now);
        filter.frequency.linearRampToValueAtTime(2400, now + 0.2);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    playCrash() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;

        // Low boom
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.5);
        oscGain.gain.setValueAtTime(0.8, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.5);

        // Crash noise explosion
        const bufferSize = this.ctx.sampleRate * 0.4;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, now);
        filter.frequency.exponentialRampToValueAtTime(300, now + 0.4);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.6, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);

        noise.start(now);
        noise.stop(now + 0.4);
    }

    playPowerup() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    playPhase() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(300, now + 0.2);

        filter.type = 'notch';
        filter.frequency.setValueAtTime(450, now);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    playEmp() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.35);
    }

    playClick() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.04);
    }
}

window.cyberAudio = new CyberAudioEngine();
