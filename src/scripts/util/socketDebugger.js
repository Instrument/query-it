import { autobind } from 'core-decorators';
import socket from '../util/socket';
import $ from 'jquery';

export default class SocketDebugger {
  constructor($element) {
    this.runningInputs = {
      player1: {
        event: "playerInput",
        data: {
          running: '',
          submitted: false,
          client: 1,
        }
      },
      player2: {
        event: "playerInput",
        data: {
          running: '',
          submitted: false,
          client: 2,
        }
      }
    }
    this.singleCharRegex = new RegExp(/^[a-z ]$/);
    this.initialize();
  }

  @autobind
  initialize() {
    $(window).on('keypress', this.onKeyPress);
    $(window).on('keydown', this.onKeyDown);

    $(document).on('clear', function() {
      this.clearPlayer(1);
      this.clearPlayer(2);
    }.bind(this));
  }

  @autobind
  submitPlayerAnswer(playerNum) {
    this.runningInputs['player' + playerNum].data.submitted = true;
    this.updateLocalInput(playerNum);
  }

  @autobind
  updateLocalInput(playerNum) {
    $(document).trigger("playerInput", {
      "running":this.runningInputs['player' + playerNum].data.running,
      "submitted":this.runningInputs['player' + playerNum].data.submitted,
      "client":playerNum});
  }

  @autobind
  clearPlayer(playerNum) {
    this.runningInputs['player' + playerNum].data.submitted = false;
    this.runningInputs['player' + playerNum].data.running = '';
    // this.logCurrent();
  }

  @autobind
  logCurrent() {
    console.log('--------');
    console.log('Player 1: ', this.runningInputs.player1.data.running, this.runningInputs.player1.data.submitted);
    console.log('Player 2: ', this.runningInputs.player2.data.running, this.runningInputs.player2.data.submitted);
  }

  @autobind
  onKeyDown(e) {
    if (e.keyCode === 8) {
      e.preventDefault();
      if (e.shiftKey) {
        let run = this.runningInputs.player2.data.running;
        this.runningInputs.player2.data.running = run.slice(0, run.length - 1);
        this.updateLocalInput(2);
      } else {
        let run = this.runningInputs.player1.data.running;
        this.runningInputs.player1.data.running = run.slice(0, run.length - 1);
        this.updateLocalInput(1);
      }
     // this.logCurrent();
    }
  }

  @autobind
  onKeyPress(e) {
    e.preventDefault();
    if (e.keyCode === 13) {
      if (e.shiftKey) {
        this.submitPlayerAnswer(2);
      } else {
        this.submitPlayerAnswer(1);
      }
    } else if (e.keyCode) {
      let key = String.fromCharCode(e.keyCode).toLowerCase();
      if (this.singleCharRegex.exec(key)) {
        if (e.shiftKey) {
          this.runningInputs.player2.data.running += key;
          this.updateLocalInput(2);
        } else {
          this.runningInputs.player1.data.running += key;
          this.updateLocalInput(1);
        }
      }
    }

    // this.logCurrent();
  }
}
