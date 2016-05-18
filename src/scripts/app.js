/**
 * This module sets up the app
 *
 */
import '../styles/global.scss';
import Quiz from './containers/quiz';
import { autobind } from 'core-decorators';
import $ from 'jquery';
import Visuals from './visuals';
import SocketDebugger from './util/socketDebugger';
import Paramalama from 'paramalama';

/**
 *
 * @constructor Application
 * @description Application set up.
 *
 */
export default class Application {
  constructor($element) {
    this.currentPane = 0;
    this.$element = $element;
    this.params = Paramalama( window.location.href );

    this.initialize();
  }

  /**
   *
   * @function initialize
   * @description Displays viz or not based on url param.
   *
   */
  initialize() {
    $(document).on('refresh', (evt, data) => {
      if(data.refresh) {
        window.location.reload();
      }
    });
    if (!this.params.dev) {
      this.visuals = $('.js-visuals').map(function setupVisuals() {
        return new Visuals($(this));
      });
      $('body').css('cursor', 'none');
    }

    if(!this.params.viz) {
      this.quiz = new Quiz({element: this.$element});
      this.socketDebugger = new SocketDebugger();
    }
  }
}

window.app = new Application($('#next-big-query'));
