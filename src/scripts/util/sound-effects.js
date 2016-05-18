const lib = {
  'answer_lockin': require('../../../wavs/answer_lockin.wav'),
  'answer_revealed': require('../../../wavs/answer_revealed.wav'),
  'database': require('../../../wavs/database.wav'),
  'endtheme_loop': require('../../../wavs/endtheme_loop.wav'),
  'filler': require('../../../wavs/filler.wav'),
  'fly_in': require('../../../wavs/fly_in.wav'),
  'instructions': require('../../../wavs/instructions.wav'),
  'labels_display': require('../../../wavs/labels_display.wav'),
  'player1_joins': require('../../../wavs/player1_joins.wav'),
  'player2_joins': require('../../../wavs/player2_joins.wav'),
  'question_timer': require('../../../wavs/question_timer.wav'),
  'ring_forming': require('../../../wavs/ring_forming.wav'),
  'sql': require('../../../wavs/sql.wav'),
  'timer_ending': require('../../../wavs/timer_ending.wav'),
  'timer': require('../../../wavs/timer.wav'),
  'visuals': require('../../../wavs/visuals.wav'),
  'winner': require('../../../wavs/winner.wav'),
};

export default class SoundEffects {
  constructor () {
    const keys = Object.keys(lib);

    keys.forEach(key => lib[key] = new Audio(lib[key]));
  }

  play(sound) {
    lib[sound].currentTime = 0;
    lib[sound].play();
  }
}
