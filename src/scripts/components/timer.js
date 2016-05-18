/**
 * This module sets up the timer component
 *
 */
import View from '../structures/view';
import { autobind } from 'core-decorators';
import EVENTS from '../events/timer';
import SOUNDS from '../events/sounds';
import socket from '../util/socket';

/**
 *
 * @constructor Timer
 * @extends View
 * @description Timer component
 *
 */
export default class Timer extends View {

  /**
   *
   * @function beforeRender
   * @description Gets data from panel for display purposes
   * @param {string} time - Passed in from panel
   * @param {string} visible - Passed in from panel
   * @param {string} countDown - Passed in from panel
   * @param {string} database - Passed in from panel
   *
   */
  beforeRender(time = 10, visible = true, countDown = true, database) {
    this.time = time;
    this.visible = visible;
    this.countDown = countDown;
    this.display = '';
    this.database = database;
    this.timeout;

    this.stateClass = '';
  }

  /**
   *
   * @function startTimer
   * @description Start timer based on store settings. Different options
   * for counting up or down and playing sounds.
   * @param {callback} cb - Callback function to run after timer is finished.
   *
   */
  @autobind
  startTimer(cb) {
    const timing = this.countDown ? 1000 : 100;
    if (this.countDown) {
      this.time--;
    } else {
      this.time++;
    }

    this.timeout = setTimeout(this.startTimer.bind(null, cb), timing);
    this.display = this.countDown ? this.time : parseFloat(this.time / 10, 1).toFixed(1);

    if (!this.countDown) {
      this.stateClass = 'is-counter';
    }
    if (this.countDown && (this.time <= 16 && this.time >= 4)) {
      if (this.visible) {
        socket.sound(SOUNDS.TIMER, [1, 2]);
      }
    }

    if (this.countDown && (this.time <= 3 && this.time >= 1)) {
      this.stateClass = 'is-almost-out';
      if (this.visible) {
        socket.sound(SOUNDS.TIMER_ENDING, [1, 2]);
      }
    } else if (this.time === 0) {
      this.stopTimer(cb);
    }

    this.reInitCycle();
  }

  /**
   *
   * @function stopTimer
   * @description Stops or pauses a timer
   * @param {callback} cb - Callback function to run after timer is stopped.
   * @param {boolean} paused - Should timer pause
   *
   */
  @autobind
  stopTimer(cb, paused) {
    if (paused) {
      clearTimeout(this.timeout);
    } else {
      clearTimeout(this.timeout);
      if (cb) {
        cb(this.display);
      }
      this.tearDown();
    }
  }

  /**
   *
   * @function isActive
   * @description Makes the timer visible
   *
   */
  isActive() {
    this.$element.find('.js-timer').addClass('active').removeClass('hidden');
    this.visible = true;
  }

  /**
   *
   * @function tearDown
   * @description Clears timeOut and removes timer
   *
   */
  tearDown() {
    clearTimeout(this.timeout);
    this.timeout = null;
    this.$element.remove();
  }

  /**
   *
   * @function render
   * @description Renders timer component markup
   *
   */
  @autobind
  render() {
    const style = this.visible ? 'active' : 'hidden';
    const timerContent = !this.countDown ? 'Querying ' + this.database + '&nbsp;&nbsp;/&nbsp;&nbsp;' : '';
    return this.parse`
      <div class="timer js-timer ${this.stateClass} ${style}">
        <span class="timer__number">${timerContent}<span class="timer__digit">${ this.display }</span></span>
      </div>
    `;
  }
};
