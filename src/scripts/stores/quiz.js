/**
 * This module sets up the quiz store
 *
 */
import $ from 'jquery';
import QuizFlow from './quizFlow';
import Player from './player';

const opts = () => {
  return {
    main: {
      current: 0,
      players: [
        Player(),
        Player(),
      ],
    },
    flow: [],
  };
};

/**
 *
 * @function Quiz
 * @returns {object} Quiz store options
 *
 */
export default function Quiz(data) {
  return $.extend({}, opts(), {flow: QuizFlow(data)});
};
