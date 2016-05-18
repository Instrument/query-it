/**
 * This module sets up the player scores component
 *
 */
import View from '../structures/view';
import getState from '../util/getState';

/**
 *
 * @constructor PlayerScores
 * @extends View
 * @description PlayerScores component
 *
 */
export default class PlayerScores extends View {

  /**
   *
   * @function beforeRender
   * @description Connects to players store to display scores
   *
   */
  beforeRender() {
    const players = getState.players();

    this.player1Score = players[0].score.toString();
    this.player2Score = players[1].score.toString();
  }

  /**
   *
   * @function render
   * @description Renders player score component markup
   *
   */
  render() {
    return this.parse`
      <div class="player-scores">
        <div class="player-scores__container">
          <div class="player-scores__heading">
            Player 1
          </div>
          <div class="player-scores__score">
            Score: ${ this.player1Score }
          </div>
        </div>
        <div class="player-scores__container player-scores__container--two is-active">
          <div class="player-scores__heading">
            Player 2
          </div>
          <div class="player-scores__score">
            Score: ${ this.player2Score }
          </div>
        </div>
      </div>
    `;
  }
}
