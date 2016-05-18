/**
 * This module sets up the results panel and it's states
 *
 */
import { autobind } from 'core-decorators';
import Panel from './panel';
import Header from '../components/header';
import Winner from '../components/player-winner';
import getState from '../util/getState';
import Timer from '../components/timer';
import TIMER_EVENTS from '../events/timer';
import Session from '../components/session';

/**
 *
 * @constructor Results
 * @extends Panel
 * @description Results panel
 *
 */
export default class Results extends Panel {

  /**
   *
   * @function beforeRender
   * @description Connects to results store to get states and creates
   * empty array/object for contents
   *
   */
  beforeRender () {
    this.state = getState.connect('Results');
    this.state.current = this.state.stages[this.state.key];

    this.contents = {};
  }

  /**
   *
   * @function reflow
   * @description When panel reflows find out the winner so we can display
   *
   */
  reflow() {
    this.reInitCycle();
    this.firstComp('Winner').displayWinner();
  }

  /**
   *
   * @function bindEvents
   * @description Start timer and increment step when complete. Add
   * active class to first state
   *
   */
  bindEvents() {
    this.addSectionActiveClass('showWinner');
    this.components.forEach((item) => {
      if(item.constructor.name === 'Timer') {
        item.startTimer(()=>{
          this.incrementStep();
        });
      }
    });
  }

  /**
   *
   * @function addSectionActiveClass
   * @description Add/remove active classes and animate text
   * based on current state
   * @param {string} currentStateName
   *
   */
  @autobind
  addSectionActiveClass(currentStateName) {
    const current = this.state.current.name;
    const allSections = this.$element.find('.section-animate');
    const section = this.$element.find('.section-animate.' + current);

    if (current === currentStateName) {
      setTimeout(() => {
        section.addClass('is-active').removeClass('inactive');
        if (currentStateName === 'showSession') {
          this.firstComp('Session').showTextAnimation();
        }
      }, 100);
    } else {
        allSections.removeClass('is-active').addClass('inactive');
    }
  }

  /**
   *
   * @function incrementStep
   * @description Gets current state from the store and runs necessary fns
   * as states change
   *
   */
  @autobind
  incrementStep() {
    const state = this.state;
    this.state.key ++;
    this.state.current = state.stages[this.state.key];
    const current = state.current;

    if(current) {
      this.reInitCycle();
      this.bindEvents();
      this.addSectionActiveClass(current.name);
    } else {
      this.done();
    }
  }

  /**
   *
   * @function render
   * @description Renders results panel markup and components
   *
   */
  render() {
    const state = this.state.current;
    const current = state.name;
    const timerParams = state.timer;

    return this.parse`
    <div class="panel--results">
      ${ Timer.bind(null, timerParams) }
      <div class="section-animate showWinner">
        ${Winner}
      </div>
      <div class="section-animate showSession">
        ${Session}
      </div>
    </div>
    `;
  }
}
