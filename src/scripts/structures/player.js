/**
 * This module sets up the player component
 *
 */
import View from './view';
import { autobind } from 'core-decorators';
import SOUNDS from '../events/sounds';
import EVENTS_PLAYER from '../events/player';
import socket from '../util/socket';
import $ from 'jquery';

/**
 *
 * @constructor Player
 * @extends View
 * @description Player component
 *
 */
export default class Player extends View {

  /**
   *
   * @function initialize
   * @description Set up containers and consts for panel
   *
   */
  initialize() {
    this.player1 = this.$element.find('.js-player-one-press');
    this.player2 = this.$element.find('.js-player-two-press');
    this.player1Entered = false;
    this.player2Entered = false;
    this.entered = false;
    this.timeout = null;
  }

  /**
   *
   * @function setActive
   * @description Gets the db name
   * @param {JQuery} player - player DOM element
   * @param {number} client - player 1 or 2
   *
   */
  @autobind
  setActive(player, client) {
    player.addClass('is-active').find('.player__copy').text('Ready Player ' + client);
  }

  /**
   *
   * @function onInput
   * @description Gets the db name
   * @param {object} data - socket data
   * @param {function} cb - callback function run after player keypresses
   *
   */
  @autobind
  onInput(data, cb) {
    if (data.client === 1) {
      if (!this.player1Entered) {
        this.setActive(this.player1, data.client);
        socket.sound(SOUNDS.PLAYER1_JOINS, [1]);
        this.player1Entered = true;
      }
    } else {
      if (!this.player2Entered) {
        this.setActive(this.player2, data.client);
        socket.sound(SOUNDS.PLAYER2_JOINS, [2]);
        this.player2Entered = true;
      }
    }

    if(!this.entered) {
      this.timeout = setTimeout(cb, 4000);
      this.entered = true;
    }

    if (this.player1Entered && this.player2Entered) {
      clearTimeout(this.timeout);
      $(document).off(EVENTS_PLAYER.PLAYER_INPUT, this.inputReceived);
      setTimeout(cb, 1000);
    }

  }

  /**
   *
   * @function render
   * @description Renders player component markup
   *
   */
  render() {
    return this.parse`
      <div class="player">
        <div class="player__press js-player-one-press">
          <span class="player__copy">Press <span class="player__highlight">Query It!</span> to play</span>
        </div>
        <div class="player__press player__press--two js-player-two-press">
          <span class="player__copy">Press <span class="player__highlight">Query It!</span> to play</span>
        </div>
      </div>
    `;
  }
}
