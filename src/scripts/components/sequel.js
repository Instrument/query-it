/**
 * This module sets up the sequel component
 *
 */
import View from '../structures/view';
import { autobind } from 'core-decorators';
import EVENTS from '../events/panel';
import $ from 'jquery';
import SOUNDS from '../events/sounds';
import socket from '../util/socket';
import hljs from 'highlight.js';

/**
 *
 * @constructor Sequel
 * @extends View
 * @description Sequel component
 *
 */
export default class Sequel extends View {

  /**
   *
   * @function beforeRender
   * @description Gets player one and two answers and sequel
   * @param {string} playerOne - Passed in from panel
   * @param {string} playerTwo - Passed in from panel
   * @param {string} playerOneAnswer - Passed in from panel
   * @param {string} playerTwoAnswer - Passed in from panel
   *
   */
  beforeRender(playerOne, playerTwo, playerOneAnswer, playerTwoAnswer) {
    this.playerOne = playerOne;
    this.playerTwo = playerTwo;
    this.playerOneAnswer = playerOneAnswer;
    this.playerTwoAnswer = playerTwoAnswer;
  }

  /**
   *
   * @function hideUnanswered
   * @description If player left question unanswered, don't display sql
   *
   */
  hideUnanswered() {
    this.$element.find('.js-sequel-content').toArray().forEach((item, i) => {
      if ((i === 0) && (this.playerOneAnswer === undefined || this.playerOneAnswer === '')) {
        $(item).hide();
      } else if ((i === 1) && (this.playerTwoAnswer === undefined || this.playerTwoAnswer === '')) {
        $(item).hide();
      }
    }
  )};

  /**
   *
   * @function hightlight
   * @description Use highlight.js to syntax highlight sql and play a sound.
   *
   */
  @autobind
  highlight() {
    socket.sound(SOUNDS.SQL, [1, 2]);
    hljs.configure({
      language: 'sql',
    });
    this.$element.find('.js-sequel-content').toArray().forEach((item) => {
      hljs.highlightBlock(item);
      $(item).parent().addClass('is-visible');
    });
  }

  /**
   *
   * @function autoScroll
   * @description Autoscroll sql based on length of panel so user can see it all
   * @params {string} current - Current timer settings from store
   *
   */
  @autobind
  autoscroll(current) {
    const scrollContainer = this.$element.find('.js-autoscroll');
    const scrollContainerHeight = scrollContainer.find('.js-sequel-content').outerHeight();
    const sequelTimer = (current.timer.timer / 1.5) * 1000;
    scrollContainer.each(function(){
      $(this).animate({scrollTop: scrollContainerHeight}, sequelTimer, 'swing');
    });
  }

  /**
   *
   * @function render
   * @description Renders sequel component markup
   *
   */
  render() {
    return this.parse`
      <div class="sequel">
        <div class="sequel__container sequel__container--one js-sequel js-sequel-one js-autoscroll">
          <div class="js-sequel-content"><code class="sequel__sql" data-manual>${ this.playerOne }</code></div>
        </div>
        <div class="sequel__container sequel__container--two js-sequel js-sequel-two js-autoscroll">
          <div class="js-sequel-content"><code class="sequel__sql" data-manual>${ this.playerTwo }</code></div>
        </div>
      </div>
    `;
  }
}

