/**
 * This module sets up the intro panel and it's states
 *
 */
import Panel from './panel';
import { autobind } from 'core-decorators';
import Player from '../structures/player';
import Header from '../components/header';
import Timer from '../components/timer';
import getState from '../util/getState';
import EVENTS_PLAYER from '../events/player';
import sessions from '../util/sessions';
import Session from '../components/session';
import { getNextSession } from '../util/nextSession';
import { fadeInText } from '../util/animation';
import $ from 'jquery';

/**
 *
 * @constructor Intro
 * @extends Panel
 * @description Intro panel
 *
 */
export default class Intro extends Panel {

  /**
   *
   * @function beforeRender
   * @description Connects to intro store to get states and creates
   * empty array/object for players and questions
   *
   */
  beforeRender() {
    this.state = getState.connect('Intro');
    this.state.current = this.state.stages[this.state.key];
    this.doneCalled = false;
    this.players = [];
    this.question = {};
  }

  /**
   *
   * @function reflow
   * @description When panel reflows starts timer and listens for input
   * @listens {EVENTS_PLAYER.PLAYER_INPUT} Listes for player input to start game
   *
   */
  reflow() {
    $(document).on(EVENTS_PLAYER.PLAYER_INPUT, this.inputReceived);
    this.firstComp('Timer').startTimer(this.incrementStep);
  }

  /**
   *
   * @function inputReceived
   * @description When a player is ready, pause the timer and
   * see if panel should finish
   * @param {event} e - Input event
   * @param {object} data - Input data
   *
   */
  @autobind
  inputReceived(e, data) {
    this.firstComp('Timer').stopTimer(null, "paused");
    this.firstComp("Player").onInput(data, this.finish);
  }

  /**
   *
   * @function showTextAnimation
   * @description As states of panel change, animate different text elements
   * @param {string} element - Element to animate
   *
   */
  showTextAnimation(element) {
    setTimeout(() => {
      fadeInText(this.$element.find(element), 30);
    }, 0);
  }

  /**
   *
   * @function addSectionActiveClass
   * @description As states of panel change, add active class to current section
   *
   */
  @autobind
  addSectionActiveClass() {
    const current = this.state.current.name;
    const section = this.$element.find('.section-animate.' + current);

    setTimeout(() => {
      section.addClass('is-active').removeClass('inactive');
    }, 100);
  }

  /**
   *
   * @function incrementStep
   * @description Gets current state from the store and runs necessary fns
   * as states change
   * @fires {event} Current state visualization event
   *
   */
  @autobind
  incrementStep() {
    this.state.key ++;
    this.state.key = this.state.stages[this.state.key]  ? this.state.key : 0;
    this.state.current = this.state.stages[this.state.key];

    if(this.state.current.name === 'showQuestion') {
      this.question = getState.getRandomQuestion();
    }

    $(document).trigger(this.state.current.threeEvent);

    this.reInitCycle();
    this.reflow();

    this.addSectionActiveClass(this.state.current.name);

    if(this.state.current.name === 'showIntro') {
      this.showTextAnimation('.js-intro .js-animation');
    }

    if(this.state.current.name === 'showQuestion') {
      this.showTextAnimation('.js-question .js-animation');
    }

    if(this.state.current.name === 'showSession') {
      this.firstComp('Session').showTextAnimation();
    }

  }

  /**
   *
   * @function finish
   * @description Panel is done and ready to move on
   *
   */
  @autobind
  finish() {
    if (!this.doneCalled) {
      this.done();
      this.doneCalled = true;
    }
  }

  /**
   *
   * @function tearDown
   * @description Unbinds panel listeners
   *
   */
  tearDown() {
    $(document).off(EVENTS_PLAYER.PLAYER_INPUT, this.inputReceived);
  }

  /**
   *
   * @function render
   * @description Renders intro panel markup and components
   *
   */
  render() {
    const timerParams = this.state.current.timer;

    return this.parse`
    <div class="panel--intro intro">
      ${ Timer.bind(null,  timerParams) }
      <div class="panel__container">
        <div class="intro__copy-container section-animate showIntro js-intro">
          <div class="intro__heading">Query It!</div>
          <div class="intro__description js-animation animate">Powered by BigQuery</div>
        </div>
      </div>
      <div class="panel__container">
        <div class="section-animate showQuestion js-question">
          <div class="panel__col panel__question panel__subheading js-animation animate">${ this.question.question }</div>
        </div>
      </div>
      <div class="panel__container">
        <div class="section-animate showSession">
          ${Session}
        </div>
      </div>
      ${Player}
    </div>
    `;
  }
}
