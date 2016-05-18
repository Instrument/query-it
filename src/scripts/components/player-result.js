/**
 * This module sets up the player result component
 *
 */
import View from '../structures/view';
import { autobind } from 'core-decorators';
import getState from '../util/getState';
import $ from 'jquery';

/**
 *
 * @constructor PlayerResult
 * @extends View
 * @description PlayerResult component
 *
 */
export default class PlayerResult extends View {

  /**
   *
   * @function beforeRender
   * @description Gets the player id. Connects to question store
   * to display players points
   * @param {number} id - Passed in from panel
   *
   */
  beforeRender(id) {
      this.id = id;
      this.setupPlayers();
      this.state = getState.connectAt('Question', id);
      this.contents = this.state.data;
  }

  /**
   *
   * @function setupPlayers
   * @description Sets up players for display of data
   *
   */
  setupPlayers() {
    const players = getState.players();

    this.player1 = players[0];
    this.player2 = players[1];
  }

  /**
   *
   * @function animate
   * @description Loops through players results for display on screen
   *
   */
  @autobind
  animate() {
    const $el = this.$element.find('.js-player-anim');

    $el.each(function(i, elem){
      const $result = $(elem).find('.js-player-result');
      $result.each(function(i, elem){
        setTimeout(() => {
          if (i < $result.length - 1) {
            $(elem).fadeOut(() => {
              $(elem).next().fadeIn();
            });
          } else {
            $(elem).next().fadeIn();
          }
        }, (i + 1) * 2000);
      });
    });
  }

  /**
   *
   * @function formatNumber
   * @description Adds commas in appropriate places for large numbers
   * based on locale
   * @param {number}
   * @returns {number}
   *
   */
  formatNumber(number) {
    return Number(number).toLocaleString('en');
  }

  /**
   *
   * @function render
   * @description Renders player result component markup
   *
   */
  render() {
    const topAnswer = this.contents.answerValue;
    const play1 = this.player1.answers[this.id] || null;
    const player1Answer = play1 ? play1.answer : '';
    const player1Result = play1 ? play1.results.toString() : '';
    const player1Score  = play1 ? play1.score.toString() : '';
    const points1String = play1 && play1.score === 1 ? 'Point' : 'Points';
    const play2 = this.player2.answers[this.id] || null;
    const player2Answer = play2 ? play2.answer : '';
    const player2Result = play2 ? play2.results.toString() : '';
    const player2Score = play2 ? play2.score.toString() : '';
    const points2String = play2 && play2.score === 1 ? 'Point' : 'Points';
    return this.parse`
      <div class="player-results">
        <div class="player-results__container player-results__container--team-one">
          <div class="player-results__label">Player 1</div>
          <div class="player-results__result js-player-anim">
           <span class="js-player-result">${ player1Answer }</span>
           <span class="player-results__final js-player-result">${ this.formatNumber(player1Result) } Results</span>
           <span class="player-results__final player-results__winner js-player-result">${player1Score}% of Top Result</span>
           <span class="player-results__final player-results__winner js-player-result">+ ${player1Score} ${points1String}</span>
          </div>
        </div>
        <div class="player-results__container player-results__container--team-two">
          <div class="player-results__label" for="team-two">Player 2</div>
          <div class="player-results__result js-player-anim">
            <span class="js-player-result">${ player2Answer }</span>
            <span class="player-results__final js-player-result">${ this.formatNumber(player2Result) } Results</span>
            <span class="player-results__final player-results__winner js-player-result">${player2Score}% of Top Result</span>
            <span class="player-results__final player-results__winner js-player-result">+ ${player2Score} ${points2String}</span>
          </div>
        </div>
      </div>
    `;
  }
}
