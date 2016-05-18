/**
 * This module sets up the results store
 *
 */
import $ from 'jquery';
import EVENTS from '../events/threeEvents';
import TimerStore from './timer';

const opts = () => {
  return {
    main: {
      current: 0,
    },
    nodes: [
      {
        key: 0,
        threeEvent: EVENTS.INTRO,
        stages: [
          {
            name: 'showWinner',
            timer: TimerStore(10, false),
          },
          {
            name: 'showSession',
            timer: TimerStore(10, false),
          }
        ]
      }
    ]
  }
};

/**
 *
 * @function Results
 * @returns {object} Results store options
 *
 */
export default function Results() {
  return $.extend({}, opts(), {});
};
