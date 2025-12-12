// Real-time WebSocket Client
class RealtimeClient {
  constructor() {
    this.ws = null;
    this.callbacks = {};
    this.connected = false;
    this.autoReconnect = true;
    this.reconnectDelay = 3000;
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.hostname}:3000`;
    
    try {
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log('✅ Connected to real-time server');
        this.connected = true;
        this.fire('connected', {});
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 Received:', message.type);
          this.fire(message.type, message.data);
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.fire('error', { error: error.message });
      };
      
      this.ws.onclose = () => {
        console.log('⚠️ Disconnected from real-time server');
        this.connected = false;
        this.fire('disconnected', {});
        
        if (this.autoReconnect) {
          setTimeout(() => this.connect(), this.reconnectDelay);
        }
      };
    } catch (e) {
      console.error('Failed to create WebSocket:', e);
    }
  }

  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  off(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    }
  }

  fire(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error('Callback error:', e);
        }
      });
    }
  }

  disconnect() {
    this.autoReconnect = false;
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Global instance
const realtime = new RealtimeClient();

// Auto-connect when page loads
document.addEventListener('DOMContentLoaded', () => {
  realtime.connect();
});
