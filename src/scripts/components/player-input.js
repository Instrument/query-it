/**
 * This module sets up the player input component
 *
 */
import View from '../structures/view';
import { autobind } from 'core-decorators';
import EVENTS_PLAYER from '../events/player';
import socket from '../util/socket';
import SOUNDS from '../events/sounds';
import $ from 'jquery';

/**
 *
 * @constructor PlayerInput
 * @extends View
 * @description PlayerInput component
 *
 */
export default class PlayerInput extends View {

  /**
   *
   * @function beforeRender
   * @description Sets up false consts and empty obj for input values
   *
   */
  @autobind
  beforeRender() {
    this.answer1Submitted = false;
    this.answer2Submitted = false;
    this.inputValues = {};
  }

  /**
   *
   * @function initialize
   * @description When initialized, empty answers and set up consts for
   * input and container elements
   *
   */
  @autobind
  initialize() {
    this.clearAnswers();
    this.playerContainer = this.$element.find('.js-player-input-container');
    this.player1Container = this.$element.find('.js-player-one-container');
    this.player2Container = this.$element.find('.js-player-two-container');
    this.player1 = this.$element.find('.js-player-input-team-one');
    this.player2 = this.$element.find('.js-player-input-team-two');
    this.playerInput = this.$element.find('.js-player-input');
  }

  /**
   *
   * @function visible
   * @description Make sure inputs are clear and display the inputs after
   * question has animated.
   * @listens {EVENTS_PLAYER.PLAYER_INPUT}
   *
   */
  @autobind
  visible() {
    socket.clear();
    this.clearAnswers();
    this.$element.find('.js-player-input-visible').addClass('is-active');
    $(document).on(EVENTS_PLAYER.PLAYER_INPUT, this.parseAnswers);
  }

  /**
   *
   * @function parseAnswers
   * @description If answer hasn't been submitted yet, grab players input data
   * @param {event} e - Socket event
   * @param {object} data = Socket data object
   *
   */
  @autobind
  parseAnswers(e, data) {
    if (data.client === 1 && !this.answer1Submitted) {
      this.inputValues['player' + data.client + 'Answer'] = data.running;
    }
    if (data.client === 2 && !this.answer2Submitted) {
      this.inputValues['player' + data.client + 'Answer'] = data.running;
    }
    this.onSocketMessage(data);
  }

  /**
   *
   * @function clearAnswers
   * @description make sure object is empty and no player input is submitted
   *
   */
  @autobind
  clearAnswers() {
    this.inputValues = {};
    this.answer1Submitted = false;
    this.answer2Submitted = false;
  }

  /**
   *
   * @function teardown
   * @description Stop listening to player input events and
   * remove submitted and active classes
   *
   */
  tearDown() {
    $(document).off(EVENTS_PLAYER.PLAYER_INPUT, this.parseAnswers);
    this.playerContainer.toArray().forEach((item) => {
      $(item).removeClass('is-submitted');
    });

    this.playerInput.toArray().forEach((item) => {
      $(item).removeClass('is-active');
    });
  }

  /**
   *
   * @function onTimerDone
   * @description When timer for the question runs out, get the players input
   * If player hasn't entered anything animate as necessary
   *
   */
  @autobind
  onTimerDone(player, timeout){
    this.playerContainer.toArray().forEach((item, i) => {
      const playerInput = $(item).find('.js-player-input');
      if (playerInput.text()  === 'enter your answer' || playerInput.text()  === '') {
        if (player && player === i + 1) {
          $(item).addClass('is-hidden');
        }
        if (timeout) {
          $(item).addClass('is-hidden');
        }
      } else {
        if (player && player === i + 1) {
          $(item).addClass('is-submitted');
        }
        if (timeout) {
          $(item).addClass('is-submitted');
        }
      }
    });
  }

  /**
   *
   * @function hideOverflowInputText
   * @description Makes sure that the user only sees their input as it fits
   * on the screen. Overflow gets hidden this way.
   * @returns {string} Returns players input
   *
   */
  @autobind
  hideOverflowInputText(client) {
    let playerInputText = client;
    if (playerInputText.length > 21) {
      playerInputText = playerInputText.slice(playerInputText.length - 21, playerInputText.length - 1);
    }
    return playerInputText;
  }

  /**
   *
   * @function displayAnswers
   * @description If an answer hasn't been submitted yet, display the
   * answer on screen, add active class to change color of text and hide any overflow
   * @param {string} player - player element
   * @param {string} answer - player's answer
   * @param {number} playerId - player 1 or 2
   * @param {boolean} answerSubmitted - has answer been submitted yet
   *
   */
  @autobind
  displayAnswers(player, answer, playerId, answerSubmitted) {
    if (!answerSubmitted) {
      player.text((this.hideOverflowInputText(answer) ? this.hideOverflowInputText(answer) : ''));
      player.addClass('is-active');
      this.hideOverflowInputText(answer);
    }
  }

  /**
   *
   * @function submitAnswers
   * @description If an answer has been submitted play a sound and make
   * sure a user can't submit more than once
   * @param {obj} data - socket data
   * @param {number} playerId - player 1 or 2
   * @param {boolean} answerSubmitted - has answer been submitted yet
   *
   */
  @autobind
  submitAnswers(data, playerId, answerSubmitted) {
    if (data.submitted && data.client === playerId && !answerSubmitted) {
      socket.sound(SOUNDS.ANSWER_LOCKIN, [playerId]);
      if (playerId === 1) {
        this.answer1Submitted = true;
      } else if (playerId === 2) {
        this.answer2Submitted = true;
      }
    }
  }

  /**
   *
   * @function submitUnanswered
   * @description If an answer is submitted empty, clear out default text and
   * make sure they can't submit anything else
   * @param {object} data - socket data
   * @param {number} playerId - player 1 or 2
   * @param {object} playerElem - jqeury object of element to clear out
   *
   */
  @autobind
  submitUnanswered(data, playerId, playerElem) {
    if (data.running.length === 0) {
      playerElem.text('');
      if (data.submitted) {
        if (playerId === 1) {
          this.answer1Submitted = true;
        } else if (playerId === 2) {
          this.answer2Submitted = true;
        }
      }
    }
  }

  /**
   *
   * @function onSocketMessage
   * @description Listens to socket to display and submit player answers
   * @param {object} data - socket data
   * @fires {EVENTS_PLAYER.ANSWER_SUBMITTED} To play a sound
   * @fires {EVENTS_PLAYER.KEYPRESS}
   *
   */
  @autobind
  onSocketMessage(data) {
    const obj = {
      answer1: this.inputValues.player1Answer,
      answer2: this.inputValues.player2Answer
    }

    if (data.submitted) {
      this.onTimerDone(data.client);
    }

    if (obj.answer1) {
      this.displayAnswers(this.player1, obj.answer1, data.client, this.answer1Submitted);
      this.submitAnswers(data, data.client, this.answer1Submitted);
    }

    if (obj.answer2) {
      this.displayAnswers(this.player2, obj.answer2, data.client, this.answer2Submitted);
      this.submitAnswers(data, data.client, this.answer2Submitted);
    }

    if (data.client === 1) {
      this.submitUnanswered(data, data.client, this.player1)
    } else if (data.client === 2) {
      this.submitUnanswered(data, data.client, this.player2)
    }

    if (this.answer1Submitted && this.answer2Submitted) {
      $(document).trigger(EVENTS_PLAYER.ANSWER_SUBMITTED);
      $(document).off(EVENTS_PLAYER.PLAYER_INPUT, this.parseAnswers);
      $(document).off(EVENTS_PLAYER.KEYPRESS, obj);
    }

    $(document).trigger(EVENTS_PLAYER.KEYPRESS, obj);
  }

  /**
   *
   * @function render
   * @description Renders player input component markup
   *
   */
  render() {
    return this.parse`
      <div class="section-animate js-player-input-visible">
        <div class="player-input">
          <div class="player-input__container player-input__container--team-one js-player-one-container js-player-input-container">
            <label class="player-input__label" for="team-one">Player 1</label>
            <div class="player-input__checkmark"></div>
            <div class="player-input__input js-player-input-team-one js-player-input">enter your answer</div>
          </div>
          <div class="player-input__container player-input__container--team-two js-player-two-container js-player-input-container">
            <label class="player-input__label" for="team-two">Player 2</label>
            <div class="player-input__input player-input__input--right js-player-input-team-two js-player-input">enter your answer</div>
            <div class="player-input__checkmark"></div>
          </div>
        </div>
      </div>
    `;
  }
}
