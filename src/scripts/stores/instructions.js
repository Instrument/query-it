/**
 * This module sets up the instructions store
 *
 */
import $ from 'jquery';
import Timer from './timer';
import EVENTS from '../events/threeEvents';

const opts = () => {
  return {
    main: {
      current: 0,
    },
    nodes: [
      {
        threeEvent: EVENTS.INSTRUCTIONS,
      }
    ]
  };
};

/**
 *
 * @function Instructions
 * @returns {object} Instructions store options
 *
 */
export default function Instructions() {
  return $.extend({}, opts(), {});
};
