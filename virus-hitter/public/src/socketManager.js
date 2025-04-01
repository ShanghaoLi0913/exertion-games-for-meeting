export class SocketManager {
  constructor(serverURL, options = {}) {
    const { nickname } = options;
    const queryUrl = nickname ? `${serverURL}?nickname=${nickname}` : serverURL;

    this.socket = io(queryUrl);
    this.eventHandlers = {};

    this.socket.on('connect', () => {
      console.log('🟢 Connected:', this.socket.id);
    });

    this.socket.on('clientSummary', (data) => {
      this.#trigger('clientSummary', data);
    });

    this.socket.on('serverState', (data) => {
      this.#trigger('serverState', data);
    });

    this.socket.on('bulletFired', (data) => {
      this.#trigger('bulletFired', data);
    });

    this.socket.on('bulletProduced', (data) => {
      this.#trigger('bulletProduced', data);
    });

    this.socket.on('init', (data) => {
      this.#trigger('init', data);
    });

    this.socket.on('gameEnd', (data) => {
      this.#trigger('gameEnd', data);
    });

    this.socket.on('gameReset', (data) => {
      this.#trigger('gameReset', data);
    });
  }

  // --- 注册事件 ---
  on(eventName, callback) {
    this.eventHandlers[eventName] = callback;
  }

  #trigger(eventName, data) {
    if (this.eventHandlers[eventName]) {
      this.eventHandlers[eventName](data);
    }
  }

  // --- 发事件 ---
  syncState(state) {
    this.socket.emit('syncState', state);
  }

  updateVirusHP(hp) {
    this.socket.emit('updateVirusHP', hp);
  }

  fireBullet(assistantId) {
    this.socket.emit('fireBullet', assistantId);
  }

  produceBullet() {
    this.socket.emit('produceBullet');
  }

  syncShoulderDis(dis) {
    this.socket.emit('syncShoulderDis', dis);
  }
}
