/**
 * This module sets up the quiz flow store
 *
 */
import $ from 'jquery';
import Intro from './intro';
import Question from './question';
import Instructions from './instructions';
import Analysis from './analysis';
import Results from './results';

const opts = () => {
  return {
    Intro: Intro(),
    Instructions: Instructions(),
    Question: [],
    Analysis: Analysis(),
    Results: Results(),
  }
};

/**
 *
 * @function QuizFlow
 * @returns {object} QuizFlow store options
 *
 */
export default function QuizFlow(data) {
  return $.extend({}, opts(), {Question: Question(data)});
};
