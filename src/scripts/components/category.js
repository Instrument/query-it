/**
 * This module sets up the category component
 *
 */
import { autobind } from 'core-decorators';
import { fadeInText } from '../util/animation';
import SOUNDS from '../events/sounds';
import socket from '../util/socket';
import View from '../structures/view';

/**
 *
 * @constructor Category
 * @extends View
 * @description Category component
 *
 */
export default class Category extends View {

  /**
   *
   * @function beforeRender
   * @description Gets the db name
   * @param {string} db - Passed in from panel
   *
   */
  beforeRender(db) {
    this.db = db;
  }

  /**
   *
   * @function addDbDescription
   * @description If db is GDELT add/animate the description,
   * otherwise just show the db name.
   *
   */
  @autobind
  addDbDescription() {
    socket.sound(SOUNDS.DATABASE, [1, 2]);
    const description = this.$element.find('.js-db-description');
    if (this.db === 'GDELT') {
      description.text('Global Database of Events, Language, and Tone');
      fadeInText(this.$element.find('.js-animation'), 30);
    }
  }

  /**
   *
   * @function render
   * @description Renders category component markup
   *
   */
  render() {
    return this.parse`
        <div class="panel__heading">
          ${ this.db }
          <div class="category__description js-db-description js-animation animate"></div>
        </div>
    `;
  }
}
