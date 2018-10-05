/**
 * This module sets up the question panel and it's states
 *
 */
import Panel from './panel';
import Header from '../components/header';
import Timer from '../components/timer';
import socket from '../util/socket';
import { autobind } from 'core-decorators';
import PlayerScore from '../components/player-score';
import Category from '../components/category';
import GetReady from '../components/get-ready';
import getState from '../util/getState';
import setState from '../util/setState';
import PlayerInput from '../components/player-input';
import Sequel from '../components/sequel';
import TIMER_EVENTS from '../events/timer';
import EVENTS_PLAYER from '../events/player';
import { fadeInText } from '../util/animation';
import $ from 'jquery';

/**
 *
 * @constructor Question
 * @extends Panel
 * @description Question panel
 *
 */
export default class Question extends Panel {

  /**
   *
   * @function beforeRender
   * @description Connects to question store to get panel states and creates
   * empty array for player answers
   *
   */
  beforeRender (id) {
    this.state = getState.connectAt('Question', id);
    this.state.current = this.state.stages[this.state.key];
    this.contents = this.state.data;

    this.id = id + 1;
    this.inputValues = [{answer: ''},{answer: ''}];
  }

  /**
   *
   * @function getInputValue
   * @description Adds player answers to answer array
   * @param {event} e - Input event
   * @param {object} data - Input data
   *
   */
  @autobind
  getInputValue(e, data){
    this.inputValues = [
      { answer: data.answer1 },
      { answer: data.answer2 }
    ];
  }

  /**
   *
   * @function bindEvents
   * @description Wait until the question has been animated before
   * starting timer for question
   * @param {string} current - Component name
   *
   */
  @autobind
  bindEvents(current) {
    this.components.forEach((item) => {
      if(item.constructor.name === 'Timer') {
        if (current === 'animateQuestion') {
          this.firstComp('Timer').stopTimer(null, true);
        } else {
          item.startTimer(()=>{
            this.incrementStep();
          });
        }
      }
    });
  }

  /**
   *
   * @function reflow
   * @description On panel reflow clear socket and reInitCycle
   *
   */
  reflow() {
    socket.clear();
    this.reInitCycle();
    this.firstComp('Category').addDbDescription();
  }

  /**
   *
   * @function reflow
   * @description Before sending sql along to analysis panel and Sequel component,
   * format it correctly with the user input
   * @param {string} userInput - User inputted string
   * @returns {string} String of sql
   *
   */
  formatSql(userInput) {
    const dbSequel = this.contents.inputSQL;
    const lineBreaks = dbSequel.replace(/\\n/g, '<br />').replace(/\\t/g, '&nbsp;&nbsp;');
    const replaceInput = lineBreaks.replace(/\w*userInput\w*/g, "<span class='sequel__user-input'>" + userInput + "</span>");

    return replaceInput;
  }

  /**
   *
   * @function answersLockedIn
   * @description If both players lock in their answers, stop timer
   * and move to the next step
   *
   */
  @autobind
  answersLockedIn() {
    this.firstComp('Timer').stopTimer();
    setTimeout(() => {
      this.incrementStep();
    }, 1000)
  }

  /**
   *
   * @function incrementStep
   * @description Increment through each state from state store and run
   * necessary functions for each. Pushes answers to store
   * @listens {EVENTS_PLAYER.KEYPRESS} For player to input answer
   * @listens {EVENTS_PLAYER.ANSWER_SUBMITTED} For player to lock in answer
   * @listens {animationDone} Waits for question to animate
   * before allowing player to input answer
   *
   */
  @autobind
  incrementStep() {
    const state = this.state;
    this.state.key ++;
    this.state.current = state.stages[this.state.key];
    const current = this.state.current;
    const animate = current && current.name === 'animateQuestion';
    const scrim = $('.bg');
    const reInitTimer = current && current.name === 'showSequel' ? 500 : 0 ;

    if (!current) {
      scrim.removeClass('is-active');
      return this.done();
    }

    if (current.name === 'animateQuestion') {
      $(document).on(EVENTS_PLAYER.KEYPRESS, this.getInputValue);
      $(document).on(EVENTS_PLAYER.ANSWER_SUBMITTED, this.answersLockedIn);
    } else {
      $(document).off(EVENTS_PLAYER.KEYPRESS, this.getInputValue);
      $(document).off(EVENTS_PLAYER.ANSWER_SUBMITTED, this.answersLockedIn);
    }

    if (current.name === 'showSequel') {
      this.firstComp('PlayerInput').onTimerDone(null, 'timeout');
      setState.pushAnswers(this.inputValues);
    }

    setTimeout(()=> {
      this.reInitCycle();
      setTimeout(()=> {
        const player1EmptyUndef = this.inputValues[0].answer === '' || this.inputValues[0].answer === undefined;
        const player2EmptyUndef = this.inputValues[1].answer === '' || this.inputValues[1].answer === undefined;
        this.bindEvents(current.name);
        if (current.name === 'showSequel') {
          scrim.addClass('is-active');
          this.firstComp('Header').isHidden();
          this.firstComp('Sequel').hideUnanswered();
          if (player1EmptyUndef && player2EmptyUndef) {
            $(document).trigger(current.threeEvent || '', [ 'skip' ]);
            this.firstComp('Timer').stopTimer();
            scrim.removeClass('is-active');
            this.done();
            $(document).off('animationDone', this.activatePlayerInput);
          } else {
            this.firstComp('Sequel').highlight();
            $(document).trigger(current.threeEvent || '');
            setTimeout(() => {
              this.firstComp('Sequel').autoscroll(current);
            }, 1000);
          }
        }
        if(animate) {
          fadeInText(this.$element.find('.js-animation'), 30);
          if (current.name === 'animateQuestion') {
            $(document).on('animationDone', this.activatePlayerInput);
          }
        }
      }, 0);
    }, reInitTimer);
  }

  /**
   *
   * @function activatePlayerInput
   * @description Waits for question to finish animating before displaying
   * player inputs, starting timer
   *
   */
  @autobind
  activatePlayerInput() {
    this.firstComp('PlayerInput').visible();
    this.firstComp('Timer').isActive();
    this.firstComp('Timer').startTimer(()=>{
      this.incrementStep();
      this.firstComp('Timer').stopTimer();
    });
    $(document).off('animationDone', this.activatePlayerInput);
  }

  /**
   *
   * @function render
   * @description Renders question panel markup and components
   *
   */
  @autobind
  render() {
    const state = this.state.current;
    const current = state.name;
    const score = state.score.visible;
    const timerParams = state.timer;
    const activeCategory = current === 'showCategory' ? 'is-active' : 'inactive';
    const activeGetReady = current === 'showGetReady' ? 'is-active' : 'inactive';
    const animateQuestion = current === 'animateQuestion' ? 'is-active' : 'inactive';
    const activeSequel = current === 'showSequel' ? 'is-active' : 'inactive';
    const activeScore = (score === true) && (this.id >= 2) ? 'is-active' : 'inactive';
    const headingText = `Round ${this.id} of 3`;

    return this.parse`
    <div class="">
      ${ Header.bind(null, {heading: headingText, color: "white"})}
      ${ Timer.bind(null, timerParams) }

      <div class="question-subsection">
        <div class="panel__container category section-animate ${activeCategory}">
          ${ Category.bind(null, {db: this.contents.databases })}
        </div>

        ${ GetReady.bind(null, {activeClass: activeGetReady}) }

      <div class="panel__container">
        <div class="section-animate panel__col panel__question panel__subheading ${animateQuestion}">
          <div class="js-animation animate">${ this.contents.question }</div>
        </div>
      </div>

      <!-- Conditionally show/hide !-->
      <div class="section-animate ${activeScore}">
          ${PlayerScore}
      </div>

      ${PlayerInput}

      <!-- Conditionally show/hide !-->
      <div class="section-animate ${activeSequel}">
        <div class="sequel__header">Generating query</div>
        ${Sequel.bind(null, {playerOne: this.formatSql(this.inputValues[0].answer), playerTwo: this.formatSql(this.inputValues[1].answer), playerOneAnswer: this.inputValues[0].answer, playerTwoAnswer: this.inputValues[1].answer})}
      </div>

    </div>
    `;
  }
}
