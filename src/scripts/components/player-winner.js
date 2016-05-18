/**
 * This module sets up the player winner component
 *
 */
import { autobind } from 'core-decorators';
import View from '../structures/view';
import getState from '../util/getState';
import SOUNDS from '../events/sounds';
import socket from '../util/socket';
import $ from 'jquery';

/**
 *
 * @constructor Winner
 * @extends View
 * @description Winner component
 *
 */
export default class Winner extends View {

  /**
   *
   * @function beforeRender
   * @description Connects to player store to display scores
   *
   */
  beforeRender() {
      const players = getState.players();

      this.player1Score = players[0].score;
      this.player2Score = players[1].score;
      this.winner = this.player1Score > this.player2Score ? 0 : 1;
      this.score = players[this.winner].score || 0;
      this.tie = players[0].score === players[1].score;
  }

  /**
   *
   * @function displayWinner
   * @description Plays sounds, displays points, appends correct winner ui
   *
   */
  @autobind
  displayWinner() {
    const winner = (this.winner + 1);
    const winnerString = winner.toString();
    const winnerContainer = this.$element.find('.js-winner-container');
    const winnerCopy = this.$element.find('.js-winner-copy');
    const winnerPoints = this.$element.find('.js-winner-points');

    if (this.tie) {
      winnerCopy.html('It&apos;s a<br />tie!')
      socket.sound(SOUNDS.WINNER, [1, 2]);
    } else {
      winnerCopy.html('Player ' + winnerString + '<br />Wins!')
      socket.sound(SOUNDS.WINNER, [winner]);

      winnerPoints.toArray().forEach((item, i) => {
        if (this.player1Score > this.player2Score && i === 0) {
          $(item).addClass('winner__points--winner');
        } else if (this.player2Score > this.player1Score && i === 1) {
          $(item).addClass('winner__points--winner');
        }
      });
    }
    setTimeout(() => {
      winnerContainer.addClass('is-active');
      winnerPoints.addClass('is-active');
    }, 1000);
  }

  /**
   *
   * @function render
   * @description Renders category component markup
   *
   */
  render() {
    const score1 = this.player1Score.toString();
    const score2 = this.player2Score.toString();
    const points1String = this.player1Score === 1 ? 'Point' : 'Points';
    const points2String = this.player2Score === 1 ? 'Point' : 'Points';

    return this.parse`
        <div class="winner__result">
          <div class="winner__container js-winner-container">
            <div class="panel__subheading js-winner-copy"></div>
          </div>
        </div>
        <div class="winner__points js-winner-points">
          <div class="winner__points--center">
            ${ score1 }<br />${ points1String }
          </div>
        </div>
        <div class="winner__points js-winner-points winner__points--two">
          <div class="winner__points--center">
            ${ score2 }<br /> ${points2String}
          </div>
        </div>
    `;
  }
}
