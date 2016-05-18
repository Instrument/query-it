/**
 * This module sets up the header component
 *
 */
import View from '../structures/view';
import { autobind } from 'core-decorators';

/**
 *
 * @constructor Header
 * @extends View
 * @description Header component
 *
 */
export default class Header extends View {

  /**
   *
   * @function beforeRender
   * @description Gets info from panel
   * @param {string} heading
   * @param {string} color
   * @param {string} visible
   * @param {string} modifier
   *
   */
  beforeRender(heading, color, visible, modifier) {
    this.heading = heading;
    this.color = color;
    this.visible = visible;
    this.modifier = modifier
  }

  /**
   *
   * @function isHidden
   * @description Hide if necessary
   *
   */
  @autobind
  isHidden() {
    this.$element.find('.js-header').addClass('is-hidden');
  }

  /**
   *
   * @function isVisible
   * @description Display if necessary
   *
   */
  @autobind
  isVisible() {
    this.$element.find('.js-header').removeClass('is-hidden').addClass('is-visible');
  }

  /**
   *
   * @function render
   * @description Renders header component markup
   *
   */
  render() {
    return this.parse`
      <div class="header header--${this.color} js-header ${this.visible} ${this.modifier}">
        <div class="header__label">
          ${this.heading}
        </div>
      </div>
    `;
  }
}
