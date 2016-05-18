import mixin from './mixin';

/**
 * Creates an instances eventable mixin.
 * @param {array<string>} types - The event types.
 * @return {function}
 */
export default function(...types) {
  /**
   * The instanced lookup.
   * @param {object} scope - The scope.
   * @return {Map}
   */
  function getEventLookup(scope) {
    if (!scope.__eventLookup) {
      scope.__eventLookup = types.reduce((sum, t) => {
        sum.set(t, new Set());
        return sum;
      }, new Map());
    }

    return scope.__eventLookup;
  }

  /**
   * The instanced set of handlers.
   * @param {object} scope - The scope.
   * @param {string} name - The name.
   * @return {Set}
   */
  function getHandlers(scope, name) {
    const lookup = getEventLookup(scope);
    const handlers = lookup.get(name);

    if (!handlers) {
      throw new Error(`Expected an event name to be one of the following: [${types.join(', ')}]. But received "${name}".`);
    }

    return handlers;
  }

  const m = mixin({

    /**
     * Trigger an event.
     * @param {string} name - The event name.
     * @param {array=} data - The fn data.
     */
    trigger(name, ...data) {
      const handlers = getHandlers(this, name);

      handlers.forEach((fn) => {
        fn(...data);
      });
    },

    /**
     * Add a listener.
     * @param {string} name - The event name.
     * @param {function} fn - The callback function.
     */
    on(name, fn) {
      const handlers = getHandlers(this, name);

      if (!handlers) { return; }

      if (!fn) {
        throw new Error('Cannot attach an event without a function');
      }

      handlers.add(fn);

      return () => { // eslint-disable-line consistent-return
        this.off(name, fn);
      };
    },

    /**
     * Remove a listener.
     * @param {string} name - The event name.
     * @param {function} fn - The callback function to remove.
     */
    off(name, fn) {
      const handlers = getHandlers(this, name);

      if (handlers) {
        handlers.delete(fn);
      }
    },
  });

  return function makeEventable(target) {
    m(target.prototype);

    if (typeof target.prototype.tearDown === 'function') {
      const originalTearDown = target.prototype.tearDown;
      target.prototype.tearDown = function eventableTearDown() {
        this.__eventLookup = null;
        return originalTearDown.apply(this, arguments);
      };
    }
  };
}
