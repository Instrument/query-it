/**
 * View is used only to
 * extend repeated render functionality
 */

/**
 *
 * @constructor View
 * @description The View constructor
 *
 */
export default class View {
  constructor(...params) {
    const el = params.filter((item) => {
      return item.hasOwnProperty('element');
    });

    const param = params.filter((item) => {
      return !item.hasOwnProperty('element');
    });

    this.$element = el[0].element;
    this.components = [];

    const passed = param[0] || {};
    params = Object.keys(passed).map((k) => passed[k]);

    this.beforeRender(...params);
    this.reInitCycle();

    this.initialize();
  }

  /**
  *
  * @function parse
  * @description Parse list of components
  * @param {string} strings
  * @param {string} values
  * @returns {string} component name with random id
  *
  */
  parse(strings, ...values) {
    let result = '';

    strings.forEach((v, k)=> {
      const injector = values[k] || '';
      let dataReturned = injector;

      if (typeof injector === 'function') {
        const uniqueId = Math.random().toString(36).substr(2, 9);
        this.__pre_injectors.push({id: uniqueId, Component: injector});
        dataReturned = '<div data-component="'+ injector.name + '-' + uniqueId +'"></div>';
      }

      result += v + dataReturned;
    });

    return result;
  }

  /**
  *
  * @function reInitCycle
  * @description Clear all instances of components and reinitialize new ones
  *
  */
  reInitCycle() {
    this.killComps();

    this.components = null;
    this.components = [];
    // Add Tear Down HERE
    this.__pre_injectors = [];

    this.$element.html(this.render());

    this.__pre_injectors.forEach((item)=> {
      this.createComponent(item);
    });

    this.__pre_injectors = undefined;
  }

  /**
  *
  * @function createComponent
  * @description Add new component to object
  * @param {obj} obj
  *
  */
  createComponent(obj) {
    const { id, Component } = obj;
    const el = this.$element.find('[data-component="'+ Component.name +'-'+ id +'"]');

    this.components.push(new Component({element: el}));
  }

  /**
  *
  * @function comps
  * @description All component names for a given view
  * @param {str} Component name
  * @returns {string} Component names for a given view
  *
  */
  comps(str) {
    return this.components.filter((item) => {
      return item.constructor.name === str;
    })
  }

  /**
  *
  * @function killComps
  * @description Nulls and tears downs all components for a given view
  *
  */
  killComps() {
    if(!this.components) { return; }
    this.components.forEach((item, k) => {
      item.tearDown();
      item = null;
    });

    this.components = null;
  }

  /**
  *
  * @function firstComp
  * @description First component name
  * @param {str} Component name
  * @returns {string} First component name for a given view
  *
  */
  firstComp(str) {
    return this.comps(str)[0];
  }

  /**
  *
  * @function initialize
  * @description Initializes view
  * @returns {Boolean}
  *
  */
  initialize()  {
    return true;
  }

  /**
  *
  * @function tearDown
  * @description Tears down view
  * @returns {Boolean}
  *
  */
  tearDown() {
    return true;
  }

  /**
  *
  * @function beforeRender
  * @description Before render
  * @returns {Boolean}
  *
  */
  beforeRender() {
    return true;
  }

  /**
  *
  * @function render
  * @description Render markup in empty div
  * @returns {string} div
  *
  */
  render() {
    return `<div></div>`;
  }
}
