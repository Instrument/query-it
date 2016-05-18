/**
 * This module sets up the gameplay for the quiz
 *
 */

import View from '../structures/view';
import Intro from '../structures/intro';
import Instructions from '../structures/instructions';
import Question from '../structures/question';
import Analysis from '../structures/analysis';
import Results from '../structures/results';
import { autobind } from 'core-decorators';
import getState from '../util/getState';
import setState from '../util/setState';
import $ from 'jquery';

/**
 *
 * @constructor Quiz
 * @extends View
 * @description Initializes quiz.
 *
 */
export default class Quiz extends View {
  /**
   *
   * @function beforeRender
   * @description Runs initQuiz to get state
   *
   */
  beforeRender() {
    this.initQuiz();
  }

  /**
   *
   * @function initialize
   * @description Bind events needed for quiz
   *
   */
  initialize() {
    this.bindEvents();
  }

  /**
   *
   * @function bindEvents
   * @description Animates intro and adds class to intro panel. Looks for
   * current state and shows/hides panels as needed.
   *
   */
  @autobind
  bindEvents() {
    this.components[this.state.main.current].show();
    this.firstComp('Intro').showTextAnimation('.js-intro .js-animation');
    this.firstComp('Intro').addSectionActiveClass('showIntro');

    $(document).on('PANEL_DONE', () => {
      const old = this.components[this.state.main.current];
      this.state.main.current += 1;

      let next = this.components[this.state.main.current];

      if(next) {
        old.hide();
        next.show();
      } else {
        this.tearDown();
        setTimeout(()=>{
          this.initQuiz();
          this.reInitCycle();
          this.bindEvents();
        }, 0);
      }
    });
  }

  /**
   *
   * @function initQuiz
   * @description Gets a new state for the quiz that includes three random questions
   *
   */
  @autobind
  initQuiz() {
    const data = getState.newState();
    this.state = data;
  }

  /**
   *
   * @function tearDown
   * @description Tears down entire quiz including all panels
   *
   */
  tearDown() {
    $(document).off('PANEL_DONE');
    this.$element.html();
    this.killComps();
  }

  /**
   *
   * @function render
   * @description Renders all panels needed for complete quiz.
   *
   */
  render() {
    return this.parse`
      <div class="bg"></div>
      ${Intro}
      ${Instructions}
      ${Question.bind(null, {id: 0})}
      ${Analysis.bind(null, {id: 0})}
      ${Question.bind(null, {id: 1})}
      ${Analysis.bind(null, {id: 1})}
      ${Question.bind(null, {id: 2})}
      ${Analysis.bind(null, {id: 2})}
      ${Results}
    `;
  }
}
