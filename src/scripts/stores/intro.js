/**
 * This module sets up the intro store
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
    nodes: [{
      threeEvent: EVENTS.INTRO,
      key: 0,
      stages: [{
        name: 'showIntro',
        threeEvent: EVENTS.INTRO,
        timer: TimerStore(10, false)
      },{
        name: 'showQuestion',
        threeEvent: EVENTS.QUESTION,
        timer: TimerStore(10, false)
      },{
        name: 'showSession',
        threeEvent: EVENTS.INTRO,
        timer: TimerStore(10, false)
      }]
    }]
  };
};

/**
 *
 * @function Intro
 * @returns {object} Intro store options
 *
 */
export default function Intro() {
  return $.extend({}, opts(), {});
};
