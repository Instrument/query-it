/**
 * This module sets up the question internal store
 *
 */
import $ from 'jquery';
import TimerStore from './timer';
import QuestionText from './questionText';
import EVENTS from '../events/threeEvents';

const opts = () => {
  return {
    threeEvent: EVENTS.QUESTION,
    key: 0,
    data: QuestionText(),
    stages: [
      {
        name: 'showCategory',
        timer: TimerStore(7, false),
        score: {
          visible: true
        }
      },
      {
        name: 'animateQuestion',
        timer: TimerStore(16, false, true),
        score: {
          visible: false
        }
      },
      {
        name: 'showSequel',
        threeEvent: EVENTS.SUBMIT_QUERY,
        timer: TimerStore(9, false),
        score: {
          visible: false
        }
      }
    ]
  };
};

/**
 *
 * @function QuestionInternalStore
 * @returns {object} Question internal store options
 *
 */
export default function QuestionInternalStore(data) {
  return $.extend({}, opts(), {data});
};
