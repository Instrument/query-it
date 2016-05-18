import AppState from './store.js';
import Quiz from '../stores/quiz.js';
import { questions } from '../../data/data.json';
import Paramalama from 'paramalama';
import _ from 'lodash';

const QUESTIONS = {
  QUIZ: 3
}

let pool = _.cloneDeep(questions);
let used = [];

const getUnique = (arr1, arr2) => {
  return _.find(arr1, i => {
    return !_.some(arr2, el => {
      return _.trim(el.databases.toLowerCase()) === _.trim(i.databases.toLowerCase());
    });
  });
};

export default {
  all() {
    return AppState.app;
  },

  main() {
    return AppState.app.main;
  },

  players() {
    return AppState.app.main.players;
  },

  connect(str) {
    const connectedFlow = AppState.app.flow[str];
    const current = connectedFlow.main.current;
    const state = connectedFlow.nodes[current];

    return state;
  },

  connectAt(str, id) {
    const connectedFlow = AppState.app.flow[str];
    const state = connectedFlow.nodes[id];

    return state;
  },

  getRandomQuestion() {
    return questions[_.random(questions.length - 1)];
  },

  newState() {
    pool = _.shuffle(pool);
    const data = [];
    const params = Paramalama( window.location.href );

    if(params.questions) {
      const arr = params.questions.split(',');
      arr.forEach(i => {
        var index = _.findIndex(questions, x => {
          return x.rowIndex === parseInt(i, 10);
        });
        if (index > -1) {
          data.push(questions[index]);
        }
      });
    } else {
      _.times(3, () => {
        let item = getUnique(pool, data);

        if(_.isUndefined(item)) {
           const unique = getUnique(used, data);
           const allQuestionsOfThisDB = _.filter(used, el => el.databases === unique.databases);
           pool.push(...allQuestionsOfThisDB);
           used = _.difference(used, pool);

           _.shuffle(pool);

           item = getUnique(pool, data);
         }

         data.push(item);
         used.push(item);
         pool = _.difference(pool, data);
      });
    }

    const state = Quiz(data);

    AppState.app = state;

    return state;
  }
}
