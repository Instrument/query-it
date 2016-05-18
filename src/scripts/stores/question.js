/**
 * This module sets up the question store
 *
 */
import $ from 'jquery';
import TimerStore from './timer';
import QuestionInternal from './questionInternal';

const opts = () => {
  return {
    main: {
      current: 0,
    },
    nodes: [
      QuestionInternal(),
      QuestionInternal(),
      QuestionInternal(),
    ],
  };
};

/**
 *
 * @function QuestionStore
 * @returns {object} QuestionStore store options
 *
 */
export default function QuestionStore(data) {
  const nodes = data.map((item) => QuestionInternal(item));
  return $.extend({}, opts(), {nodes});
};
