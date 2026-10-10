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

        // Multi-Track Procedural Synthwave Library
        this.tracks = [
            {
                name: 'CYBER CITY 2077',
                bpm: 124,
                bass: [
                    55.00, 55.00, 110.00, 55.00, 55.00, 55.00, 82.41, 55.00,
                    43.65, 43.65, 87.31, 43.65, 43.65, 43.65, 87.31, 65.41,
                    65.41, 65.41, 130.81, 65.41, 65.41, 65.41, 98.00, 65.41,
                    49.00, 49.00, 98.00, 49.00, 49.00, 49.00, 73.42, 61.74
                ],
                lead: [
                    220.00, 0, 261.63, 293.66, 329.63, 0, 293.66, 0,
                    349.23, 0, 329.63, 293.66, 261.63, 0, 220.00, 0,
                    261.63, 0, 329.63, 392.00, 329.63, 0, 261.63, 0,
                    246.94, 0, 293.66, 329.63, 293.66, 0, 246.94, 0
                ]
            },
            {
                name: 'OUTRUN SUNSET',
                bpm: 114,
                bass: [
                    65.41, 0, 65.41, 130.81, 65.41, 0, 98.00, 130.81,
                    55.00, 0, 55.00, 110.00, 55.00, 0, 82.41, 110.00,
                    43.65, 0, 43.65, 87.31, 43.65, 0, 65.41, 87.31,
                    49.00, 0, 49.00, 98.00, 49.00, 0, 73.42, 98.00
                ],
                lead: [
                    329.63, 392.00, 440.00, 0, 392.00, 329.63, 293.66, 0,
                    261.63, 293.66, 329.63, 0, 293.66, 261.63, 220.00, 0,
                    349.23, 392.00, 440.00, 0, 392.00, 349.23, 329.63, 0,
                    293.66, 329.63, 392.00, 0, 329.63, 293.66, 246.94, 0
                ]
            },
            {
                name: 'HYPERDRIVE 140',
                bpm: 140,
                bass: [
                    73.42, 73.42, 146.83, 73.42, 73.42, 146.83, 110.00, 73.42,
                    65.41, 65.41, 130.81, 65.41, 65.41, 130.81, 98.00, 65.41,
                    55.00, 55.00, 110.00, 55.00, 55.00, 110.00, 82.41, 55.00,
                    43.65, 43.65, 87.31, 43.65, 49.00, 49.00, 98.00, 61.74
                ],
                lead: [
                    440.00, 0, 440.00, 523.25, 587.33, 0, 523.25, 0,
                    392.00, 0, 392.00, 440.00, 523.25, 0, 440.00, 0,
                    329.63, 0, 329.63, 392.00, 440.00, 0, 392.00, 0,
                    293.66, 0, 349.23, 392.00, 440.00, 0, 493.88, 0
                ]
            }
        ];

        this.currentTrackIndex = 0;
        this.loadTrack(0);
    }

    loadTrack(index) {
        this.currentTrackIndex = index % this.tracks.length;
        const trk = this.tracks[this.currentTrackIndex];
        this.bpm = trk.bpm;
        this.bassSequence = trk.bass;
        this.melodyLeadSequence = trk.lead;
        return trk;
    }

    nextTrack() {
        const nextIdx = (this.currentTrackIndex + 1) % this.tracks.length;
        const trk = this.loadTrack(nextIdx);
        this.step = 0;
        return trk;
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

            // Reusable white noise buffer for explosion & distortion SFX
            const bufferSize = Math.floor(this.ctx.sampleRate * 0.5);
            this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = this.noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
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

    playLaser() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.12);
    }

    playRailgunFire() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;

        // Sub-bass heavy magnetic kick
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sawtooth';
        sub.frequency.setValueAtTime(220, now);
        sub.frequency.exponentialRampToValueAtTime(32, now + 0.35);

        subGain.gain.setValueAtTime(0.7, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        sub.connect(subGain);
        subGain.connect(this.sfxGain);
        sub.start(now);
        sub.stop(now + 0.35);

        // High frequency magnetic discharge snap
        const snap = this.ctx.createOscillator();
        const snapGain = this.ctx.createGain();
        snap.type = 'square';
        snap.frequency.setValueAtTime(1800, now);
        snap.frequency.exponentialRampToValueAtTime(150, now + 0.14);

        snapGain.gain.setValueAtTime(0.45, now);
        snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        snap.connect(snapGain);
        snapGain.connect(this.sfxGain);
        snap.start(now);
        snap.stop(now + 0.14);
    }

    playPlasmaHit() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.08);
    }

    playBossAlarm() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;
        for (let i = 0; i < 2; i++) {
            const time = now + i * 0.18;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(440, time);
            osc.frequency.linearRampToValueAtTime(880, time + 0.12);
            gain.gain.setValueAtTime(0.3, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(time);
            osc.stop(time + 0.15);
        }
    }

    playPortalWarp() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.3);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    playPortalWarpOverdrive() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(280, now);
        osc1.frequency.exponentialRampToValueAtTime(1400, now + 0.36);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(560, now);
        osc2.frequency.exponentialRampToValueAtTime(2800, now + 0.36);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(700, now);
        filter.frequency.exponentialRampToValueAtTime(2600, now + 0.36);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.36);
        osc2.stop(now + 0.36);
    }

    playMineArm() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.setValueAtTime(1800, now + 0.04);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.1);
    }

    playMineDetonate() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;

        // Sub bass blast
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.45);

        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.45);

        // Electric distortion noise
        if (this.noiseBuffer) {
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;
            const nFilter = this.ctx.createBiquadFilter();
            nFilter.type = 'bandpass';
            nFilter.frequency.setValueAtTime(600, now);
            nFilter.frequency.exponentialRampToValueAtTime(150, now + 0.35);

            const nGain = this.ctx.createGain();
            nGain.gain.setValueAtTime(0.45, now);
            nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            noise.connect(nFilter);
            nFilter.connect(nGain);
            nGain.connect(this.sfxGain);
            noise.start(now);
            noise.stop(now + 0.35);
        }
    }

    playMineChain(chainLevel = 1) {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const baseFreq = Math.min(880, 200 + chainLevel * 85);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.42);

        gain.gain.setValueAtTime(0.65, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.42);
    }

    playSlowMo() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.45);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, now);
        filter.frequency.exponentialRampToValueAtTime(320, now + 0.45);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.45);
    }

    playParry() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1200, now);
        osc1.frequency.exponentialRampToValueAtTime(2400, now + 0.08);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(600, now);
        osc2.frequency.exponentialRampToValueAtTime(1800, now + 0.08);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.sfxGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.28);
        osc2.stop(now + 0.28);
    }

    playNaniteRepair() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now);
        osc1.frequency.exponentialRampToValueAtTime(1046.50, now + 0.16);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(659.25, now);
        osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.16);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.sfxGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.28);
        osc2.stop(now + 0.28);
    }

    playPulseNova() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;

        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sawtooth';
        sub.frequency.setValueAtTime(180, now);
        sub.frequency.exponentialRampToValueAtTime(30, now + 0.42);

        subGain.gain.setValueAtTime(0.75, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

        sub.connect(subGain);
        subGain.connect(this.sfxGain);
        sub.start(now);
        sub.stop(now + 0.42);

        const sweep = this.ctx.createOscillator();
        const sweepGain = this.ctx.createGain();
        sweep.type = 'sine';
        sweep.frequency.setValueAtTime(800, now);
        sweep.frequency.exponentialRampToValueAtTime(150, now + 0.35);

        sweepGain.gain.setValueAtTime(0.45, now);
        sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        sweep.connect(sweepGain);
        sweepGain.connect(this.sfxGain);
        sweep.start(now);
        sweep.stop(now + 0.35);
    }

    playVortexSiphon() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;

        // Gravitational swirling oscillator
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.25);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.5);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        // Lowpass resonance filter
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.exponentialRampToValueAtTime(1800, now + 0.25);
        filter.frequency.exponentialRampToValueAtTime(400, now + 0.5);
        filter.Q.setValueAtTime(6, now);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.5);
    }

    playThermalCloak() {
        this.init();
        if (this.isMuted) return;
        const now = this.ctx.currentTime;

        // Ethereal phase shifter shimmer
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.18);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.45);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.45);
    }

    // Cyber Voice Announcer System
    announce(text, priority = false) {
        if (this.isMuted) return;
        const enabled = localStorage.getItem('neonSnake_voiceEnabled') !== 'false';
        if (!enabled) return;

        if ('speechSynthesis' in window) {
            try {
                if (priority) window.speechSynthesis.cancel();
                const utter = new SpeechSynthesisUtterance(text);
                utter.rate = 1.15;
                utter.pitch = 0.85;
                utter.volume = 0.8;
                
                // Pick an English or robotic-sounding voice if available
                const voices = window.speechSynthesis.getVoices();
                const cyberVoice = voices.find(v => v.lang && v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('David') || v.name.includes('Robot') || v.name.includes('Zira') || v.name.includes('Samantha')));
                if (cyberVoice) utter.voice = cyberVoice;

                window.speechSynthesis.speak(utter);
            } catch (e) {
                // Non-blocking fallback
            }
        }
    }

    toggleVoice() {
        const current = localStorage.getItem('neonSnake_voiceEnabled') !== 'false';
        const next = !current;
        localStorage.setItem('neonSnake_voiceEnabled', next.toString());
        return next;
    }
}

window.cyberAudio = new CyberAudioEngine();
