/**
 * This module sets up the analysis internal store
 * @fires {event} Current state visualization events
 *
 */
import $ from 'jquery';
import TimerStore from './timer';
import QuestionText from './questionText';
import EVENTS from '../events/threeEvents';

const opts = () => {
  return {
    key: 0,
    stages: [
      {
        name: 'showAnalysis',
        threeEvent: EVENTS.QUERY_COMPLETE,
        timer: {
          time: 0,
          visible: true,
          countDown: false,
          database: '',
        }
      },
      {
        name: 'error',
        timer: TimerStore(10, false),
        score: {
          visible: false,
        }
      },
      {
        name: 'showAnswer',
        threeEvent: EVENTS.RESULTS,
        timer: {
          time: 0,
          visible: false,
          countDown: false
        }
      }
    ]
  };
};

/**
 *
 * @function AnalysisInternalStore
 * @param {object} data
 * @returns {object} Internal analysis store options
 *
 */
export default function AnalysisInternalStore(data) {
  return $.extend({}, opts(), {data});
};
