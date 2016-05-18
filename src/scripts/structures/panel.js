/**
 * Sets up containers/screens for groups of components
 *
 */
import View from './view';
import EVENTS from '../events/panel';
import TIMER_EVENTS from '../events/timer';
import getState from '../util/getState';
import $ from 'jquery';

/**
 *
 * @constructor Panel
 * @extends View
 * @description Sets up containers/screens for groups of
 * components and adds panel class based on panel name
 *
 */
export default class Panel extends View {
  constructor(...params) {
    super(...params);

    this.$element.addClass('panel panel-animation--' + this.$element.data('component').toLowerCase());
  }

  /**
   *
   * @function done
   * @description Panel is done and should move on
   * @fires {EVENTS.DONE}
   *
   */
  done() {
    setTimeout(()=>{
      $(document).trigger(EVENTS.DONE);
    }, 0);
  }

  /**
   *
   * @function reflow
   * @description Panel reflow
   *
   */
  reflow() { }

  /**
   *
   * @function show
   * @description Panel is on screen and displaying. Binds any panel
   * events, adds active class and triggers any needed events
   * @fires threeEvent from state store to change visualizations
   *
   */
  show() {
    this.reflow();
    this.bindEvents();

    this.$element.addClass('is-active');

    if(this.state && this.state.threeEvent) {
      $(document).trigger(this.state.threeEvent);
    }
  }

  /**
   *
   * @function bindEvents
   * @description Panel events to bind.
   *
   */
  bindEvents() {}

  /**
   *
   * @function hide
   * @description Panel is off screen and not displaying. Tears down any components
   * and removes active class
   *
   */
  hide() {
    this.tearDown();
    this.killComps();
    this.$element.removeClass('is-active');
  }

}
