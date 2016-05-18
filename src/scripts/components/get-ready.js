/**
 * This module sets up the get ready component
 *
 */
import View from '../structures/view';

/**
 *
 * @constructor GetReady
 * @extends View
 * @description GetReady component
 *
 */
export default class GetReady extends View {

  /**
   *
   * @function beforeRender
   * @description Gets the active class
   * @param {string} activeClass - Passed in from panel
   *
   */
  beforeRender(activeClass) {
    this.activeClass = activeClass;
  }

  /**
   *
   * @function render
   * @description Renders getReady component markup
   *
   */
  render() {
    return this.parse`
      <div class="panel__container section-animate ${this.activeClass}">
        <div class="panel__heading panel__heading--category">
          Get Ready
        </div>
      </div>
    `;
  }
}
