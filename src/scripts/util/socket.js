import $ from 'jquery';
import Paramalama from 'paramalama';
import SoundEffects from './sound-effects';
let socket, soundEffects;

class Router {
  constructor() {
    const params = Paramalama( window.location.href );
    soundEffects = new SoundEffects();
    if (params.live) {
      socket = new WebSocket(((window.location.protocol === "https:") ? "wss://" : "ws://") + location.hostname + ':8095');
      socket.onmessage = this.parseMessage;
      socket.onopen = this.clear;
    } else {
      socket = {
        readyState: 0
      }
    }
  }

  parseMessage(e) {
    let msg = JSON.parse(e.data);
    $(document).trigger(msg.event, msg.data);
  }

  clear() {
    $(document).trigger('clear', {});
    if (socket.readyState === 1) {
      socket.send(JSON.stringify({
        event: 'clear',
        data: {},
      }));
    }
  }

  sound(sound, clients) {
    soundEffects.play(sound);
  }

  logError(data) {
    if (socket.readyState === 1) {
      socket.send(JSON.stringify({
        event: 'logError',
        data: data,
      }));
    }
  }
}

export default new Router();
