/**
 * This module sets up the analysis panel and it's states
 *
 */
import { autobind } from 'core-decorators';
import Panel from './panel';
import Header from '../components/header';
import getState from '../util/getState';
import setState from '../util/setState';
import Timer from '../components/timer';
import PlayerResult from '../components/player-result';
import TIMER_EVENTS from '../events/timer';
import EVENTS from '../events/panel';
import THREE_EVENTS from '../events/threeEvents';
import SOUNDS from '../events/sounds';
import socket from '../util/socket';
import $ from 'jquery';

/**
 *
 * @constructor Analysis
 * @extends Panel
 * @description Analysis panel
 *
 */
export default class Analysis extends Panel {

  /**
   *
   * @function beforeRender
   * @description Connects to analysis store to get panel states
   *
   */
  beforeRender (id) {
    this.state = getState.connectAt('Analysis', id);
    this.state.current = this.state.stages[this.state.key];
    this.question = getState.connectAt('Question', id);
    this.contents = this.question.data;

    this.id = id;

    this.timeElapsed = 0;
    this.visibleItems = [];
    this.toAnimate = 0;
    this.last = null
    this.queryFailed = false;
    this.bytesProcessed = 0;
    this.formingSoundPlayed = false;
    this.labelSoundPlayed = false;
    this.flyInSoundPlayed = false;
  }

  /**
   *
   * @function onRingForming
   * @description Plays sound when ring forms. Sets variable to
   * make sure sound is only played once.
   *
   */
  @autobind
  onRingForming() {
    if (!this.formingSoundPlayed) {
      socket.sound(SOUNDS.RING_FORMING, [1, 2]);
      $(document).off('ringForming', this.onRingForming);
      this.formingSoundPlayed = true;
    }
  }

  /**
   *
   * @function onRingLabels
   * @description Plays sound when ring labels appear. Sets variable to
   * make sure sound is only played once.
   *
   */
  @autobind
  onRingLabels() {
    if (!this.labelSoundPlayed) {
      socket.sound(SOUNDS.FILLER, [1, 2]);
      $(document).off('ringLabels', this.onRingLabels);
      this.labelSoundPlayed = true;
    }
  }

  /**
   *
   * @function onFlyIn
   * @description Plays sound when visualization flies in to
   * correct answer. Sets variable to make sure sound is only played once.
   *
   */
  @autobind
  onFlyIn() {
    if (!this.flyInSoundPlayed) {
      socket.sound(SOUNDS.FLY_IN, [1, 2]);
      $(document).off('flyIn', this.onFlyIn);
      this.flyInSoundPlayed = true;
    }
  }

  /**
   *
   * @function onTriggerSounds
   * @description Listen for events from visualization
   * @listens {ringForming} When ring forms
   * @listens {ringLabels} When labels appear
   * @listens {flyIn} When answer fly in
   *
   */
  @autobind
  onTriggerSounds() {
    this.formingSoundPlayed = false;
    this.labelSoundPlayed = false;
    this.flyInSoundPlayed = false;
    $(document).on('ringForming', this.onRingForming);
    $(document).on('ringLabels', this.onRingLabels);
    $(document).on('flyIn', this.onFlyIn);
  }

  /**
   *
   * @function reflow
   * @description When panel reflows submit query to big query with the player answer
   * and wait for a response. Afterwards calculate the users score and push it to the
   * player store
   * @listens {event} Current state visualization event.
   *
   */
  @autobind
  reflow() {
    const main = getState.main();
    const arry = [];
    const players = main.players;

    this.onTriggerSounds();

    for (var player in players) {
      arry.push(this.makeQuery(players[player]));
    }

    Promise.all(arry).catch((err) => {
      return arry;
    }).then(function(data) {
      data.forEach((el,k) => {
        if(!el.jobComplete) {
          this.queryFailed = true;

          let p = players[k]
          p = {
            answer: p.answers[this.id],
            sql: this.contents.sequel
          };

          el.userData = p;
          socket.logError(el);
        }
      });

      if(!this.queryFailed) {
        $(document).trigger(this.state.current.threeEvent, [this.contents.top10]);

        for (var player in players) {
          if (players[player].answers[this.id].answer === '') {
            setState.updatePlayerScore(player, this.id, {score: 0, results: 0});
          } else {
            setState.updatePlayerScore(player, this.id, this.calcScore(data[player]));
          }
        }

        const gb = this.toGB(data[0].totalBytesProcessed);
        this.bytesProcessed = isNaN(gb) ? 0 : gb;
      } else {
        setState.updatePlayerScore(0, this.id, {score: 0, results: 0});
        setState.updatePlayerScore(1, this.id, {score: 0, results: 0});
        $(document).trigger(THREE_EVENTS.BUMMER);
      }
      this.components.forEach((item) => {
        if(item.constructor.name === 'Timer') {
          item.stopTimer(this.incrementStep);
        }
      });
    }.bind(this));
  }

  /**
   *
   * @function bindEvents
   * @description Start timer and increment step when complete
   *
   */
  bindEvents() {
    this.components.forEach((item) => {
      if(item.constructor.name === 'Timer') {
        item.startTimer(()=>{
          this.incrementStep();
        });
      }
    });
  }

  /**
   *
   * @function makeQuery
   * @description Prepare and send ajax request of sql with user input to bigQuery
   * @param {object} data - Object of answers for each player.
   *
   */
  @autobind
  makeQuery(data) {
    const answer = data.answers[this.id] ? data.answers[this.id].answer : '';
    return new Promise((resolve, reject) => {
      const dbSequel = this.contents.inputSQL;
      const lineBreaks = dbSequel.replace(/\\n/g, ' ').replace(/\\t/g, ' ');
      const addPlayerInput = lineBreaks.replace(/userInput/g, answer);
      socket.sound(SOUNDS.VISUALS, [1, 2]);
      $.ajax({
        type: "POST",
        url: "http://" + window.location.hostname + ":3000/",
        data: {
          'query': addPlayerInput
        },
        success: (response) => {
          resolve(response);
        },
        error: (resp) => {
          reject(resp);
        },
        dataType: 'json',
        timeout: 32000
      });
    });

  }

  /**
   *
   * @function incrementStep
   * @description Gets current state from the store and runs necessary fns
   * as states change
   * @fires {event} Current state visualization event
   *
   */
  @autobind
  incrementStep(time) {
    const state = this.state;
    let current;
    const inc = _ => {
      this.state.key ++;
      this.state.current = state.stages[this.state.key];
      current = this.state.current;
    };

    inc();

    if(current && ((current.name === 'error' && !this.queryFailed) ||
       (current.name === 'showAnswer' && this.queryFailed))) {
      inc();
    }

    this.timeElapsed = time;

    if (current) {
      this.reInitCycle();

      this.bindEvents();

      if(current.name === 'showAnswer') {
        this.animateEls = this.$element.find('.js-animate-in .js-animate-in-el');
        this.last = this.animateEls.last();
        this.animateIn();
      }
    } else {
      this.done();
    }
  }

  /**
   *
   * @function formatNumber
   * @description Adds commas in appropriate places for large numbers
   * based on locale
   * @param {number}
   * @returns {number}
   *
   */
  formatNumber(number) {
    return Number(number).toLocaleString('en');
  }

  /**
   *
   * @function toGB
   * @description Converts bytes processed number returned in bigQuery
   * to GB for display
   * @param {num}
   * @returns {number}
   *
   */
  toGB(num) {
    return (((parseInt(num, 10) / 1024) / 1024) / 1024).toFixed(2);
  }

  /**
   *
   * @function calcScore
   * @description Starts at 0. If calcs number of rows with top score to give
   * score. If any rows are returned player gets at least 1 point.
   * @param {data} Data returned from bigQuery response
   * returns {object} - Player score and results.
   *
   */
  calcScore(data) {
    let score = 0;
    try {
      const total = parseFloat(this.contents.answerValue, 10);
      let results = data.rows ? parseFloat(data.rows[0].f[1].v, 10) : 0;
      results = isNaN(results) ? 0 : results;
      if (results > total) {
        score = 100;
      } else {
        score = Math.floor((results/total) * 100);
        if ( score === 0 && results > 0 ) {
          score = 1;
        } else if (isNaN(score)) {
          score = 0;
        }
      }

      return { score, results };
    } catch(e) {
      return { score: 0, results: 0 };
    }
  }

  /**
   *
   * @function animateIn
   * @description Animates in different parts of the players answers and top answer.
   *
   */
  @autobind
  animateIn() {
    const curr = this.animateEls.eq(this.toAnimate);
    const answerReveal = this.$element.find('.js-answer-reveal');
    const playerResult = this.$element.find('.js-player-result');
    const rowsSearched = this.$element.find('.js-rows-searched');
    const prev = this.animateEls.eq(this.toAnimate - 1);
    let toIncrement = 3000;
    const standardDelay = 9000;

    if (prev && prev[0] !== answerReveal[0]) {
      let timing = 500;
      prev.addClass('inactive-out');
      if(rowsSearched[0] === prev[0]) {
        timing = 7000;
        toIncrement = toIncrement + timing;
      }

      setTimeout(()=> {
        prev.removeClass('inactive-out active');
        curr.addClass('active');
      }, toIncrement);
    } else {
      curr.addClass('active');
    }

    if(curr[0] === rowsSearched[0]) {
      rowsSearched.addClass('active');
      setTimeout(()=>{$(document).trigger(this.state.current.threeEvent);}, standardDelay);
    };

    if(curr[0] === answerReveal[0]) {
      setTimeout(() => {
        this.firstComp('Header').isVisible();
        playerResult.addClass('active');
        answerReveal.addClass('active');
        socket.sound(SOUNDS.ANSWER_REVEALED, [1, 2]);
        this.firstComp('PlayerResult').animate();
      }, standardDelay);
    };

    this.toAnimate ++;

    if(!this.last.hasClass('active')) {
      setTimeout(this.animateIn, toIncrement);
    } else {
      setTimeout(this.incrementStep, standardDelay);
    }
  }

  /**
   *
   * @function render
   * @description Renders analysis panel markup and components
   *
   */
  render() {
    const state = this.state.current;
    const current = state.name;
    const timerParams = state.timer;
    timerParams.database = this.contents.databases;
    const activeAnswer = current === 'showAnswer' ? 'is-active' : 'inactive';
    const error = current === 'error' ? 'is-active' : 'inactive';

    return this.parse`
      ${ Timer.bind(null, timerParams) }
      <div class="section-animate ${ error }">
        <div class="panel__container panel__subheading">
          <p class="panel__content">
            Bummer
            <span class="panel__sub-content">
              Your query timed out
            </span>
          </p>
        </div>
      </div>

      <div class="section-animate ${activeAnswer}">
        ${ Header.bind(null, {heading: "RESULTS", color: 'white', visible: 'is-hidden' })}
        <div class="panel__container panel__subheading panel__col panel__animate-container js-animate-in">
          <p class="panel__content panel__animate-content js-animate-in-el">
            ${ this.bytesProcessed } GB
            <span class="panel__sub-content">
              Searched in ${ this.timeElapsed } seconds
            </span>
          </p>
          <p class="panel__content panel__animate-content js-animate-in-el js-rows-searched">
            ${ this.formatNumber(this.contents.rowsSearched) }
            <span class="panel__sub-content">Rows analyzed</span>
          </p>
          <p class="panel__content panel__animate-content js-answer-reveal js-animate-in-el">
            ${ this.contents.answer }<br />
            <span class="panel__sub-content">
              ${ this.formatNumber(this.contents.answerValue) } ${ this.contents.units }
            </span>
          </p>
        </div>
        <div class="panel__animate-content panel__animate-content--result js-player-result">
          ${PlayerResult.bind(null, {id: this.id})}
        </div>
      </div>
    `;
  }
}
