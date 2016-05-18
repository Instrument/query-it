/**
 * This module sets up the analysis store
 *
 */
import $ from 'jquery';
import Timer from './timer';
import EVENTS from '../events/threeEvents';
import AnalysisInternal from './analysisInternal';

const opts = () => {
  return {
    main: {
      current: 0,
    },
    nodes: [
      AnalysisInternal(),
      AnalysisInternal(),
      AnalysisInternal(),
    ]
  };
};

/**
 *
 * @function Analysis
 * @returns {object} Analysis store options
 *
 */
export default function Analysis() {
  return $.extend({}, opts(), {});
};
