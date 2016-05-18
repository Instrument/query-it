/**
 * This module sets up the session component
 *
 */
import { autobind } from 'core-decorators';
import View from '../structures/view';
import Header from '../components/header';
import sessions from '../util/sessions';
import { getNextSession } from '../util/nextSession';
import { fadeInText } from '../util/animation';
import $ from 'jquery';

/**
 *
 * @constructor Session
 * @extends View
 * @description Session component
 *
 */
export default class Session extends View {

  /**
   *
   * @function showTextAnimation
   * @description If there is a time for next session animate session time
   * otherwise animate the no session text
   *
   */
  showTextAnimation() {
    setTimeout(() => {
      if (getNextSession(sessions.data).time !== undefined) {
        fadeInText(this.$element.find('.js-final-session .js-animation'), 30);
      } else {
        fadeInText(this.$element.find('.js-no-session .js-animation'), 30);
      }
    }, 0);
  }

  /**
   *
   * @function render
   * @description Renders session component markup
   *
   */
  render() {
    const getSessions = getNextSession(sessions.data);
    const hasSession = getSessions.time !== undefined ? 'active-sessions' : 'inactive-sessions';
    const sessionDay = getSessions.day;
    const sessionTime = getSessions.time;
    const sessionLocation = getSessions.location;

    return this.parse`
      <div class="panel__container js-session-info">
        <div class="session__session ${hasSession}">
          <div class="session__container session__session--has-session">
            <div class="panel__subheading panel__col panel__col--smallest js-final-session">
                <div class="intro__description">BigQuery talk ${sessionDay} at</div>
                <div class="js-animation animate">${sessionTime} / ${sessionLocation}</div>
            </div>
          </div>
          <div class="session__container--small session__session--has-no-session">
            <div class="panel__heading panel__heading--session">Try BigQuery!</div>
            <div class="js-no-session">
              <div class="intro__description session__callout js-animation animate">cloud.google.com/bigquery</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}