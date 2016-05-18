/**
 * This module sets up the timer store
 *
 */
import $ from 'jquery';

const opts = {
    timer: 10,
    visible: false,
    countdown: true,
};

/**
 *
 * @function Analysis
 * @param {number} - Duration of timer in seconds
 * @param {boolean} - Should timer be visible
 * @param {boolean} - Should timer count down instead of up
 * @returns {object} Analysis store options
 *
 */
export default function TimerStore(timer, visible, countdown) {
  return $.extend({}, opts, {timer, visible, countdown});
};
