/**
 * This module sets up the instructions panel and it's states
 *
 */
import { autobind } from 'core-decorators';
import Panel from './panel';
import Header from '../components/header';
import getState from '../util/getState';
import { fadeInText } from '../util/animation';
import SOUNDS from '../events/sounds';
import socket from '../util/socket';

/**
 *
 * @constructor Instructions
 * @extends Panel
 * @description Instructions panel
 *
 */
export default class Instructions extends Panel {

  /**
   *
   * @function beforeRender
   * @description Connects to instructions store to get states
   *
   */
  beforeRender() {
    this.state = getState.connect('Instructions');
  }

  /**
   *
   * @function bindEvents
   * @description Start timer and play a sound
   *
   */
  bindEvents() {
    this.components.forEach((item) => {
      if(item.constructor.name === 'Timer') {
        item.startTimer(this.done);
      }
    });
    this.animateIn();
    socket.sound(SOUNDS.INSTRUCTIONS, [1, 2]);
  }

  /**
   *
   * @function animateIn
   * @description Animate instructions in and move to next panel.
   *
   */
  @autobind
  animateIn() {
    const curr = this.$element.find('.js-animate-in .js-animate-in-el');
    setTimeout(() => {
      curr.addClass('active');
      fadeInText(curr.find('.js-animation'), 20);
    }, 1000);
    setTimeout(this.done, 5000);
  }

  /**
   *
   * @function render
   * @description Renders instructions panel markup and components
   *
   */
  render() {
    const timerParams = this.state.timer;
    return this.parse`
    <div class="instructions">
      <div class="instructions__description">
        <div class="instructions__heading">Get ready!</div>
        <ul class="instructions__list panel__animate-container js-animate-in">
          <li class="instructions__item panel__animate-content panel__animate-content--has-height js-animate-in-el">
            <span class="instructions__instruction js-animation">Query Big Data in real time</span>
          </li>
        </ul>
      </div>
    </div>
    `;
  }
}
