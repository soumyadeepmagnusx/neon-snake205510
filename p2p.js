// PeerJS WebRTC Peer-to-Peer Multiplayer Module

class CyberP2PManager {
    constructor() {
        this.peer = null;
        this.conn = null;
        this.isHost = false;
        this.isConnected = false;
        this.roomCode = null;
        this.callbacks = {
            onConnected: () => {},
            onDisconnected: () => {},
            onData: () => {},
            onError: () => {}
        };
    }

    generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `NEON-${code}`;
    }

    initHost(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
        this.isHost = true;
        this.roomCode = this.generateRoomCode();

        if (typeof Peer === 'undefined') {
            this.callbacks.onError('PeerJS library not loaded. Check internet connection.');
            return;
        }

        const peerId = `neonsnake-${this.roomCode.toLowerCase()}`;
        this.peer = new Peer(peerId, {
            debug: 1
        });

        this.peer.on('open', (id) => {
            console.log('[P2P] Host initialized with room code:', this.roomCode);
            if (this.callbacks.onHostReady) {
                this.callbacks.onHostReady(this.roomCode);
            }
        });

        this.peer.on('connection', (connection) => {
            console.log('[P2P] Client connected!');
            this.conn = connection;
            this.setupConnectionHandlers();
        });

        this.peer.on('error', (err) => {
            console.error('[P2P Error]', err);
            // If ID is taken, try another
            if (err.type === 'unavailable-id') {
                this.initHost(callbacks);
            } else {
                this.callbacks.onError(err.message || 'P2P Connection Error');
            }
        });
    }

    initClient(targetCode, callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
        this.isHost = false;
        const normalizedCode = targetCode.trim().toUpperCase();
        this.roomCode = normalizedCode.startsWith('NEON-') ? normalizedCode : `NEON-${normalizedCode}`;

        if (typeof Peer === 'undefined') {
            this.callbacks.onError('PeerJS library not loaded.');
            return;
        }

        this.peer = new Peer(null, {
            debug: 1
        });

        this.peer.on('open', () => {
            const hostPeerId = `neonsnake-${this.roomCode.toLowerCase()}`;
            console.log('[P2P] Connecting to host:', hostPeerId);
            this.conn = this.peer.connect(hostPeerId, {
                reliable: false // UDP-like low latency for game ticks
            });

            this.setupConnectionHandlers();
        });

        this.peer.on('error', (err) => {
            console.error('[P2P Error]', err);
            this.callbacks.onError(err.message || 'Failed to connect to host');
        });
    }

    setupConnectionHandlers() {
        if (!this.conn) return;

        this.conn.on('open', () => {
            console.log('[P2P] DataChannel opened successfully');
            this.isConnected = true;
            this.callbacks.onConnected(this.isHost);
        });

        this.conn.on('data', (data) => {
            this.callbacks.onData(data);
        });

        this.conn.on('close', () => {
            console.log('[P2P] Connection closed');
            this.isConnected = false;
            this.callbacks.onDisconnected();
        });

        this.conn.on('error', (err) => {
            console.error('[P2P Conn Error]', err);
            this.callbacks.onError(err);
        });
    }

    send(data) {
        if (this.conn && this.isConnected && this.conn.open) {
            this.conn.send(data);
        }
    }

    disconnect() {
        if (this.conn) {
            this.conn.close();
            this.conn = null;
        }
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        this.isConnected = false;
        this.isHost = false;
    }
}

window.cyberP2P = new CyberP2PManager();
