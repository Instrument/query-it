import AppState from './store.js';
import $ from 'jquery';

export default {
  main(data) {
    return AppState.main;
  },

  pushAnswers(obj) {
    AppState.app.main.players[0].answers.push(obj[0]);
    AppState.app.main.players[1].answers.push(obj[1]);
  },

  updatePlayerScore(player, id, data) {
    const results = AppState.app.main.players[player].answers[id];
    $.extend(results, data);
    
    AppState.app.main.players[player].score += data.score;
  },

  incrementNode(str) {
    AppState.app.flow[str].main.current ++;
  }
}
