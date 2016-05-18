/**
 * This module sets up the player store
 *
 */
import $ from 'jquery';

const opts = () => {
  return {
    answers: [],
    score: 0,
  };
};

/**
 *
 * @function Player
 * @returns {object} Player store options
 *
 */
export default function Player() {
  return $.extend({}, opts(), {});
};
