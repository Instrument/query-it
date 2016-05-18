import { autobind } from 'core-decorators';
import SELECTORS from './constants/states.js';
import $ from 'jquery';

/**
 *
 * @description: Canvas visuals displayed under the UI
 *
 */
export default class Visuals {
  /**
   *
   * @constructor: Visuals
   * @description: Particle Visuals constructor
   * @param { $element } jquery element container
   *
   */

  element; //class reference

  //These values are used to define the grid view, and the total number of particles
  scaleMult = 4; //used to calculate the space between particles in the grid/stack view
  parX = 8; //number of particles on the x-axis per each color group (blue, red, yellow, green)
  parY = 14; //number of particles on the y-axis overall
  parZ = 24; //number of particles on the z-axis overall
  space = 1/16 * this.scaleMult;

  percentageLimit = 0.02; //if a result value of the top 10 is less than this percentage limit it is not displayed in the visualization
  gapSize = 0.06;   //controls ring gaps

  //incOrders use two arrays, first is colors to define which color groups are used in order.  0=blue, 1=red, 2=yellow, 3=green.
  //the numof array correlates to the colors, so in incOrders[0], blue/colors[0] will have 3 pieces of the pie chart that are blue.
  incOrders = [
    { //blue
      colors: [0,3,2,1],
      numof: [3,1,2,4]
    },
    { //yellow
      colors: [2,1,3,0],
      numof: [3,3,1,3]
    },
    { //green 1
      colors: [3,2,1,0],
      numof: [3,3,2,2]
    },
    { //green 2
      colors: [3,0,2,1],
      numof: [3,3,2,2]
    },
    { // red / pink
      colors: [1,0,2,3],
      numof: [3,3,4,0]
    }
  ];

  clumpTrigger = 400; //this is a counter for how many render ticks to complete before triggering an action

  questionParticleMin = 90; //minimum number of particles in the question display
  quesitonParticleVariable = 50; //number of random particles to be added to the particleMin
  fadeDistance = 300; //z depth position where particles in the instruction view begin to fade

  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;
  aspect = this.windowWidth / this.windowHeight;

  container;//html reference used to append html labels
  stats;//stats object reference.
  overlay; //reference to html container that html labels are added into, this is inside of the container object

  //used for the constant mesh rotation
  XDIR = 1; //XDIR controls if the mesh rotation on the x-axis is increasing or decreasing
  XLIM = 0.1; //the limit used in both positive and negative ranges for the x-axis rotation, once limit is reached XDIR is negated



  state = SELECTORS.INTRO; //variable to track the current state, used all over, but mainly in the render loop

  //variables used in the physics loop
  multp;
  multn;

  //grid layout variables used in the construction of the stack / grid layouts
  yinc = 0;
  zinc = 0;

  timeouts = [];  //array of setTimeout references for clearing timeouts when fastforwarding

  //these variables are used to manage and define the colors of the final ring resolve
  incIndex = 0;
  incOrder = []; //set from incOrders color of incIndex which is randomized
  incNums = []; //set from the incOrders numof arrays based on the incIndex.  These numbers are how many of each color defined by incOrders[#].colors

  //vertex and fragment shader reference, and a counter for the loader
  vs;
  fs;
  shadersLoaded = 0;

  //three.js main objects.
  camera;
  cameraTarget; //used for camera.lookAt references so that the THREE.Object3D can be tweened easily.
  scene; //base three.js scene reference
  renderer; //base three.js rendere using the WebGL renderer.
  composer; //composer to apply shader effects to the whole render as post effects
  effect; //container for the anti-aliasing effect

  //this is the buffer geometry instance that contains all but the background particles, along with it's material, and mesh that contains the gemoetry instance
  geometry;
  material;
  mesh;

  //this is the buffer geometry instance that contains just the background particles, along with it's material, and mesh that contains the gemoetry instance
  geometry2;
  material2;
  mesh2;

  time = 0; //global time variable, currently not being used for much but was at one point used as part of the physics calculations

  //empty containers used to tween values such as a time variable, which is then referenced in the render loops
  tweenContainer = {};
  tweenContainer2 = {};

  //Colors is populated by the data/colors.json file
  colors = [];
  colorSet = 0; //colorSet is used to specify which of the mutliple full color pallet sets to use.  Currently we only use the 0/default color pallet

  particleCount = ((this.parX * this.parY) * this.parZ) * 4; //Total particles
  particleCount2 = 20; //Number of particles used the background particle system used for the Intro display mode.

  translateArray = new Float32Array( this.particleCount * 3 ); //reference for all particles current position in main display;  array is * 3 to account for x, y, and z values for each vertex
  velocityArray = new Array (this.particleCount * 3 ); //reference for the velocity of each particle in x,y,z format
  targetArray = new Float32Array (this.particleCount * 3 ); //reference for target / end translate positions.  This is used by the shader to LERP between the translate array and target array based on the time uniform value of the gemoetry object
  modesArray = new Float32Array ( this.particleCount ); //this is an array even though it really only looks at the first value to control which rendering method to use in the render loop function
  timesArray = new Float32Array ( this.particleCount ); //time reference used by shaders, that is manually set, used for LERP functions in the shader when in mode 1
  scaleArray = new Float32Array( this.particleCount ); //array of floats for the scale of each particle
  scaleTargetArray = Array ( this.particleCount );  //array of target scale sizes, used when tweening particle sizes
  scaleOriginArray = Array ( this.particleCount );  //array of starting scale sizes, used when tweening particle sizes
  massArray = new Array( this.particleCount ); //mass per particle used in physics loop
  accelerationArray = new Array( this.particleCount * 3); //acceleration in x,y,z for each particle used in physics loop
  colorsArray = new Float32Array( this.particleCount * 3 ); //Array of current color for each particle defined in r,g,b with values of 0 to 1
  colorsTargetArray = new Float32Array( this.particleCount * 3); //Array of target colors used when translating from current colorsArray value to colorTargetArray values
  attractTargetArray = new Float32Array( this.particleCount );  //An array of index values for which Attract target objects a particle is attraced to in the physics loop

  opacityArray = new Float32Array( this.particleCount );  //array of opacity values for each particle
  stackArray = new Float32Array ( this.particleCount * 3 ); //array of particles in the grid positions, with blocks of parX x parY x parZ per color group blue, red, yellow, green
  shuffledStackArray = new Float32Array ( this.particleCount * 3 ); //same as stack array but with positions randomized

  //All of these are the same as above but used for the smaller buffer geometry used for background particles.
  translateArray2 = new Float32Array( this.particleCount2 * 3 );
  targetArray2 = new Float32Array (this.particleCount2 * 3 );
  modesArray2 = new Float32Array ( this.particleCount2 );
  timesArray2 = new Float32Array ( this.particleCount2 );
  scaleArray2 = new Float32Array( this.particleCount2 );
  scaleTargetArray2 = new Array ( this.particleCount2 );
  scaleOriginArray2 = new Array ( this.particleCount2 );
  massArray2 = new Array( this.particleCount2 );
  accelerationArray2 = new Array( this.particleCount2 * 3);
  colorsArray2 = new Float32Array( this.particleCount2 * 3 );
  colorsTargetArray2 = new Float32Array( this.particleCount2 * 3 );
  attractTargetArray2 = new Float32Array( this.particleCount2 );
  velocityArray2 = new Array( this.particleCount2 * 3 );
  opacityArray2 = new Float32Array( this.particleCount2 );
  stackArray2 = new Float32Array ( this.particleCount2 * 3 );

  shuffleIndexArray = new Array( this.particleCount );//used to generate the shuffledStackArray

  //clumps display variables
  clumpPoints = []; //the are Vector3 objects that the attractTargetArray values reference
  clumpOriginPoints = []; //starting position for clumpPoints, used for tweening clumpPoints
  clumpTargetPoints = []; //ending position for clumpPoints, use for tweening clumpPoints
  clumpMass = []; //mass of each of the clump points used in the physics loops
  limits = []; //this is an array of values used to limit particles acceleration, this helps force the particles into orbits around the clumpPoints
  clumpCounter = 0; //this int is incremented in the render loop until it hits the clumpTrigger value, at which point something is triggered from the render loop

  //These variables are generic and used by the positioning and render loops as needed
  a = 0;
  b = 0;
  d = 0;
  e = 0;
  f = 0;

  xx; //temporary x value used for assignment in loops
  yy; //temporary y value used for assignment in loops
  zz; //temporary z value used for assignment in loops
  ti; //counter for sub groups of particles

  scales; //reference the the scale values from the geometry object, fed by the scalesArray, used to updated values in the buffer geometry object
  scalesTargets; //reference the the scaleTarget values from the geometry object, fed by the scalesTargetArray, used to updated values in the buffer geometry object
  modes; //reference the the mode value from the geometry object
  times; //reference the the time value from the geometry object
  attractTarget; //reference the the attractTarget values from the geometry object, fed by the attractArray, used to updated values in the buffer geometry object
  acceleration; //reference the the acceleration values from the geometry object, fed by the attractTargetArray, used to updated values in the buffer geometry object
  velocity; //reference the the velocity values from the geometry object, fed by the velocityArray, used to updated values in the buffer geometry object
  mass; //reference the the mass values from the geometry object, fed by the massArray, used to updated values in the buffer geometry object

  //same as above except for the background particle buffer geometry objet
  scales2;
  scalesTargets2;
  modes2;
  times2;
  attractTarget2;
  acceleration2;
  velocity2;
  mass2;

  //question particle display variables
  questionDisplayParticleCount;   //starting index of particles used in the question display modes
  questionDisplayParticleEnd; //ending index of particles used in the question display, these change based on the color selected

  percentages; //object that stores the percentages passed in from the UI in the queryComplete event

  currentColor = ""; //reference for the currently selected color used in the question mode

  targetDotIndex = 0; //reference to the particle index of the center particle in the to percentage piece of the ring, this is the particle that is zoomed into on the results

  labelPositions = []; //an array of xy positions of labels in relation to the viz ring converted to screen coordinates
  labelAnchorPositions = []; //an array of anchor positions on the actual ring in xy converted to screen coordinates
  labelDots = []; //an array of label objects, the label dots contain the labels themselves that float off of the ring a bit
  labelAnchors = []; //an array of the label anchor points that are directly on the ring
  labels = [];  //an array of the html label elements
  labelVectorPositions = []; //an array of xyz positions in the 3d scene for each label

  //These vectors are all used through the class for vector calculations.  Static instance are used to prevent memory leaks / garbage collection
  tempVector = new THREE.Vector3(0, 0, 0);
  tempVector2 = new THREE.Vector3(0, 0, 0);
  tempVector3 = new THREE.Vector3(0, 0, 0);
  tempVector4 = new THREE.Vector3(0, 0, 0);
  forceVector = new THREE.Vector3(0,0,0);
  tempVelocity = new THREE.Vector3(0,0,0);
  tempAcceleration = new THREE.Vector3(0,0,0);
  extraDotStartVector = new THREE.Vector3(0,0,0);
  extraDotEndVector = new THREE.Vector3(0,0,0);

  //flags used for different states
  pause = false; //pause prevents the render loop from running, once set to true, animate() must be called again to start the render loop
  queryComplete = false; //flag used to track if the queryComplete has been triggered after the submitQuery has fired. Used primarily to prevent bummer from being called right after a complete event has fired

  constructor( element ) {
    this.$element = $(element);
    this.initialize();
  }

  initialize() {
    this.initEvents(); //events are all for the debug / development buttons
    this.loadShaders(); //load shader files before continuing, you should never need to modify the v1.vs and f1.fs files
  }

  //Init all event listeners to integrate with the UI.
  @autobind
  initEvents() {
    $(document).on('intro', this.triggerIntro);
    $(document).on('instructions', this.triggerInstructions);
    $(document).on('question', this.triggerQuestion);
    $(document).on('submit_query', this.triggerSubmitQuery);
    $(document).on('query_complete', this.triggerQueryComplete);
    $(document).on('bummer', this.triggerBummer);
  }

  //function to load shader files
  @autobind
  loadShaders() {
    let self = this;

    $.ajax({url: "viz/scripts/v1.vs", success: function(result){
      self.vs = result;
      self.shaderLoad();
    }});

    $.ajax({url: "viz/scripts/f1.fs", success: function(result){
      self.fs = result;
      self.shaderLoad();
    }});
  }

  //handle shader file loads
  @autobind
  shaderLoad() {
    this.shadersLoaded++;

    if (this.shadersLoaded === 2) {
      this.loadColors();
    }
  }

  //load colors.json object
  @autobind
  loadColors() {
    $.ajax({
      dataType: "json",
      url: "data/colors.json",
      success: this.colorsLoaded
    });
  }

  //handle colors.json load
  @autobind
  colorsLoaded(data) {
    this.processColors(data);
    this.clearTimeouts();
    this.timeouts.push(setTimeout(this.setup, 10));
  }

  //function that loops through all the colors and runs them through the hexToRgb function to convert hex to rgb values from 0-1
  @autobind
  processColors(data) {
    var self = this;
    var colorsetindex = 0;
    var colorindex = 0;

    for (var i=0; i<data.colors.length; i++) {
      this.colors[i] = new Array();
      for (var a=0; a<4; a++) {
        this.colors[i][a] = new Array();
      }
    }

    data.colors.forEach(function(colset) {
      colorindex = 0;
      colset.colors.forEach(function(col){
        switch (col.label) {
          case "red":
            colorindex = 1;
          break;
          case "green":
            colorindex = 3;
          break;
          case "blue":
            colorindex = 0;
          break;
          case "yellow":
            colorindex = 2;
          break;
        }
        col.colors.forEach(function(color) {
          self.colors[colorsetindex][colorindex].push(self.hexToRgb(color));
        });
      });

      colorsetindex++;
    });
  }

  //function to convert hex strings into rgb values from 0-1
  @autobind
  hexToRgb(hex) {
    console.log("hexToRgb");
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16)/255,
        parseInt(result[2], 16)/255,
        parseInt(result[3], 16)/255
    ] : null;
  }

  //generic shuffle function
  @autobind
  shuffle(array) {
    var rand, index = -1,
      length = array.length,
      result = Array(length);
    while (++index < length) {
      rand = Math.floor(Math.random() * (index + 1));
      result[index] = result[rand];
      result[rand] = array[index];
    }
    return result;
  }

  //creates a shuffled index array of particles used for the shuffled stack/grid view
  @autobind
  initShuffleIndexes() {
    for (var i=0; i< this.particleCount; i++) {
      this.shuffleIndexArray[i] = i * 3;
    }
    this.shuffleIndexes();
  }

  //shuffles the shuffleIndexArray
  @autobind
  shuffleIndexes() {
    this.shuffleIndexArray = this.shuffle(this.shuffleIndexArray);

    for (var i=0, i3=0, l=this.particleCount; i<l; i++, i3 += 3) {
      this.shuffledStackArray[ this.shuffleIndexArray[i] + 0 ] = this.stackArray[ i3 + 0];
      this.shuffledStackArray[ this.shuffleIndexArray[i] + 1 ] = this.stackArray[ i3 + 1];
      this.shuffledStackArray[ this.shuffleIndexArray[i] + 2 ] = this.stackArray[ i3 + 2];
    }
  }

  //Clear timeouts clears all setTimeout references as needed
  @autobind
  clearTimeouts() {
    for(var i=0; i<this.timeouts.length; i++){
      clearTimeout(this.timeouts[i]);
    }
    this.timeouts = [];
  }

  //ClearLabels empties out html label elements
  @autobind
  clearLabels() {
    if(this.labels){
      for (var i=0; i<this.labels.length; i++) {
        this.labels[i].innerHTML = "";
        this.labelDots[i].removeAttribute('style');
      }
    }
  }

  //function to pause the render loop
  @autobind
  pauseVisuals() {
    this.pause = true;
  }

  //unpauses / starts back up the render loop
  @autobind
  unPauseVisuals() {
    this.pause = false;
    this.animate();
  }

  //this is the initial setup of the entire THREE.js scene, including building out the buffer geometry objects and defining the stack / grid positions, as well as initializing the render and composer
  @autobind
  setup() {
    if ( !Detector.webgl ) {
      Detector.addGetWebGLMessage();
      return false;
    }

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setClearColor( 0x222d33, 1 );

    if ( this.renderer.extensions.get( 'ANGLE_instanced_arrays' ) === false ) {
      document.getElementById( "notSupported" ).style.display = "";
      return false;
    }

    this.container = document.querySelector( '.js-visuals' );

    this.camera = new THREE.PerspectiveCamera(90, this.windowWidth / this.windowHeight, 1, 1500000 );
    this.cameraTarget = new THREE.Object3D();

    this.camera.position.z = 1000;

    this.scene = new THREE.Scene();

    this.scene.add(this.cameraTarget)


    this.geometry = new THREE.InstancedBufferGeometry();
    this.geometry.copy( new THREE.CircleBufferGeometry( 1, 6 ) );

    this.geometry2 = new THREE.InstancedBufferGeometry();
    this.geometry2.copy( new THREE.CircleBufferGeometry( 1, 6 ) );

    this.geometry.addAttribute( "opacity", new THREE.InstancedBufferAttribute( this.opacityArray, 1, 1 ).setDynamic( true ) );
    this.geometry.addAttribute( "scale", new THREE.InstancedBufferAttribute( this.scaleArray, 1, 1 ).setDynamic( true ) );
    this.geometry.addAttribute( "attracttarget", new THREE.InstancedBufferAttribute( this.attractTargetArray, 1, 1 ).setDynamic( true ) );
    this.geometry.addAttribute( "mode", new THREE.InstancedBufferAttribute( this.modesArray, 1, 1 ).setDynamic( true ));
    this.geometry.addAttribute( "time", new THREE.InstancedBufferAttribute( this.timesArray, 1, 1 ).setDynamic( true ));

    this.geometry2.addAttribute( "opacity", new THREE.InstancedBufferAttribute( this.opacityArray2, 1, 1 ).setDynamic( true ) );
    this.geometry2.addAttribute( "scale", new THREE.InstancedBufferAttribute( this.scaleArray2, 1, 1 ).setDynamic( true ) );
    this.geometry2.addAttribute( "attracttarget", new THREE.InstancedBufferAttribute( this.attractTargetArray2, 1, 1 ).setDynamic( true ) );
    this.geometry2.addAttribute( "mode", new THREE.InstancedBufferAttribute( this.modesArray2, 1, 1 ).setDynamic( true ));
    this.geometry2.addAttribute( "time", new THREE.InstancedBufferAttribute( this.timesArray2, 1, 1 ).setDynamic( true ));

    this.scales = this.geometry.getAttribute( 'scale' );
    this.scalesArray = this.scales.array;

    this.modes = this.geometry.getAttribute ( 'mode' );
    this.modesArray = this.modes.array;

    this.times = this.geometry.getAttribute ( 'time' );
    this.timesArray = this.times.array;


    this.scales2 = this.geometry2.getAttribute( 'scale' );
    this.scalesArray2 = this.scales2.array;

    this.modes2 = this.geometry2.getAttribute ( 'mode' );
    this.modesArray2 = this.modes2.array;

    this.times2 = this.geometry2.getAttribute ( 'time' );
    this.timesArray2 = this.times2.array;


    /*
     *  This loop created 4 groups of particles aranched into irregular cubes based on the parX, parY and parZ values
     *  using space as the distance between each other and place in the stack buffer
     */

    for (var i = 0, i3 = 0, l = this.particleCount2; i < l; i++, i3 += 3) {
      this.scalesArray2[ i ] = 0;//0; //set initial scale
      this.opacityArray2[ i ] = 1;

      this.massArray2[ i ] = 0.5 + (Math.random()*50);

      this.attractTargetArray2[ i ] = 0;

      this.velocityArray2[ i3  + 0 ] = 0;
      this.velocityArray2[ i3  + 1 ] = 0;
      this.velocityArray2[ i3  + 2 ] = 0;

      this.accelerationArray2[ i3  + 0 ] = 0;
      this.accelerationArray2[ i3  + 1 ] = 0;
      this.accelerationArray2[ i3  + 2 ] = 0;

      this.modesArray2[ i ] = 1;

      this.a = Math.floor(Math.random() * this.colors[this.colorSet][0].length);
      this.colorsArray2[ i3 + 0 ] = this.colors[this.colorSet][0][this.a][0];
      this.colorsArray2[ i3 + 1 ] = this.colors[this.colorSet][0][this.a][1];
      this.colorsArray2[ i3 + 2 ] = this.colors[this.colorSet][0][this.a][2];

      this.xx = i;

      this.stackArray2[ i3 + 0 ] = this.xx * this.space;
      this.stackArray2[ i3 + 1 ] = 0;
      this.stackArray2[ i3 + 2 ] = 0;

      this.translateArray2 [ i3 + 0 ] = this.stackArray2[ i3 + 0 ];
      this.translateArray2 [ i3 + 1 ] = this.stackArray2[ i3 + 1 ];
      this.translateArray2 [ i3 + 2 ] = this.stackArray2[ i3 + 2 ];

    }

    this.geometry2.addAttribute( "stack", new THREE.InstancedBufferAttribute( this.stackArray2, 3, 1 ) );
    this.geometry2.addAttribute( "attractTarget", new THREE.InstancedBufferAttribute( this.attractTarget2, 3, 1 ) );
    this.geometry2.addAttribute( "target", new THREE.InstancedBufferAttribute( this.targetArray2, 3, 1 ).setDynamic( true ) );

    this.geometry2.addAttribute( "translate", new THREE.InstancedBufferAttribute( this.translateArray2, 3, 1 ).setDynamic( true ) );
    this.geometry2.addAttribute( "color", new THREE.InstancedBufferAttribute( this.colorsArray2, 3, 1 ).setDynamic( true ) );
    this.geometry2.addAttribute( "colortarget", new THREE.InstancedBufferAttribute( this.colorsArray2, 3, 1 ).setDynamic( true ) );
    this.geometry2.addAttribute( "colorStart", new THREE.InstancedBufferAttribute( this.colorsArray2, 3, 1 ) );


    for (var i = 0, i3 = 0, l = this.particleCount; i < l; i ++, i3 += 3 ) {

      this.scalesArray[ i ] = 0;
      this.opacityArray[ i ] = 1;

      this.massArray[ i ] = 0.5 + (Math.random()*50);

      this.attractTargetArray[ i ] = 0;

      this.velocityArray[ i3  + 0 ] = 0;
      this.velocityArray[ i3  + 1 ] = 0;
      this.velocityArray[ i3  + 2 ] = 0;

      this.accelerationArray[ i3  + 0 ] = 0;
      this.accelerationArray[ i3  + 1 ] = 0;
      this.accelerationArray[ i3  + 2 ] = 0;
      this.modesArray[ i ] = 1;

      if( i / l < 0.25 ) {  //reds

        this.a = Math.floor(Math.random() * this.colors[this.colorSet][0].length);
        this.colorsArray[ i3 + 0 ] = this.colors[this.colorSet][0][this.a][0];
        this.colorsArray[ i3 + 1 ] = this.colors[this.colorSet][0][this.a][1];
        this.colorsArray[ i3 + 2 ] = this.colors[this.colorSet][0][this.a][2];

        this.ti = i;

        this.xx = this.ti % (this.parX);
        this.yy = this.yinc;

        if (this.xx === this.parX - 1) {
          this.yinc++;
        }

        this.zz = this.zinc;

        if (this.yy === this.parY - 1 && this.xx == this.parX-1) {
          this.zinc++;
        }

        if (this.ti % (this.parX * this.parY) === 0) {
          this.yinc = 0;
        }

        this.stackArray[ i3 + 0 ] = (-1 * this.space  * this.parX * 2) + this.xx * this.space;
        this.stackArray[ i3 + 1 ] = (this.space * this.yy) - (this.space * this.parY) * 0.5;
        this.stackArray[ i3 + 2 ] = (this.space * this.zz) - (this.space * this.parZ) * 0.5;

      } else if ( i / l < 0.5 ) { //greens

        if (i / l === 0.25) {
          this.yinc = 0;
          this.zinc = 0;
        }

        this.a = Math.floor(Math.random() * this.colors[this.colorSet][1].length);
        this.colorsArray[ i3 + 0 ] = this.colors[this.colorSet][1][this.a][0];
        this.colorsArray[ i3 + 1 ] = this.colors[this.colorSet][1][this.a][1];
        this.colorsArray[ i3 + 2 ] = this.colors[this.colorSet][1][this.a][2];

        this.ti = i - (l * 0.25);

        this.xx = this.ti % (this.parX);
        this.yy = this.yinc;

        if (this.xx === this.parX - 1) {
          this.yinc++;
        }

        this.zz = this.zinc;

        if (this.yy === this.parY - 1 && this.xx == this.parX - 1) {
          this.zinc++;
        }

        if (this.ti % (this.parX*this.parY) === 0) {
          this.yinc = 0;
        }

        this.stackArray[ i3 + 0 ] = (-1 * this.space * this.parX) + (this.xx) * this.space;
        this.stackArray[ i3 + 1 ] = (this.space * this.yy) - (this.space * this.parY) * 0.5;
        this.stackArray[ i3 + 2 ] = (this.space * this.zz) - (this.space * this.parZ) * 0.5;

      } else if (i / l < 0.75 ) { //blue

        if (i / l === 0.5) {
          this.yinc = 0;
          this.zinc = 0;
        }

        this.a = Math.floor(Math.random() * this.colors[this.colorSet][2].length);
        this.colorsArray[ i3 + 0 ] = this.colors[this.colorSet][2][this.a][0];
        this.colorsArray[ i3 + 1 ] = this.colors[this.colorSet][2][this.a][1];
        this.colorsArray[ i3 + 2 ] = this.colors[this.colorSet][2][this.a][2];

        this.ti = i - (l * 0.5);

        this.xx = this.ti % (this.parX);
        this.yy = this.yinc;

        if (this.xx === this.parX - 1) {
          this.yinc++;
        }

        this.zz = this.zinc;

        if (this.yy === this.parY - 1 && this.xx == this.parX-1) {
          this.zinc++;
        }

        if (this.ti % (this.parX * this.parY) === 0) {
          this.yinc = 0;
        }

        this.stackArray[ i3 + 0 ] = this.xx * this.space;
        this.stackArray[ i3 + 1 ] = (this.space * this.yy) - (this.space * this.parY)*  0.5;
        this.stackArray[ i3 + 2 ] = (this.space * this.zz) - (this.space * this.parZ) * 0.5;

      } else {  //yellow

        if (i / l === 0.75) {
          this.yinc = 0;
          this.zinc = 0;
        }

        this.a = Math.floor(Math.random() * this.colors[this.colorSet][3].length);
        this.colorsArray[ i3 + 0 ] = this.colors[this.colorSet][3][this.a][0];
        this.colorsArray[ i3 + 1 ] = this.colors[this.colorSet][3][this.a][1];
        this.colorsArray[ i3 + 2 ] = this.colors[this.colorSet][3][this.a][2];

        this.ti = i - (l * 0.75);

        this.xx = this.ti%(this.parX);
        this.yy = this.yinc;

        if (this.xx === this.parX - 1) {
          this.yinc++;
        }

        this.zz = this.zinc;

        if (this.yy === this.parY - 1 && this.xx == this.parX - 1) {
          this.zinc++;
        }

        if (this.ti % (this.parX * this.parY) === 0) {
          this.yinc = 0;
        }

        this.stackArray[ i3 + 0 ] = (this.space * this.parX) + (this.xx) * this.space;
        this.stackArray[ i3 + 1 ] = (this.space * this.yy) - (this.space * this.parY)*0.5;
        this.stackArray[ i3 + 2 ] = (this.space * this.zz) - (this.space * this.parZ)*0.5;
      }
      this.colorsTargetArray[i3 + 0] = this.colorsArray[i3 + 0];
      this.colorsTargetArray[i3 + 1] = this.colorsArray[i3 + 1];
      this.colorsTargetArray[i3 + 2] = this.colorsArray[i3 + 2];

      this.translateArray [ i3 + 0 ] = this.stackArray[ i3 + 0 ];
      this.translateArray [ i3 + 1 ] = this.stackArray[ i3 + 1 ];
      this.translateArray [ i3 + 2 ] = this.stackArray[ i3 + 2 ];
    }

    this.geometry.addAttribute( "stack", new THREE.InstancedBufferAttribute( this.stackArray, 3, 1 ) );

    this.geometry.addAttribute( "shufflestack", new THREE.InstancedBufferAttribute( this.shuffledStackArray, 3, 1 ));

    this.geometry.addAttribute( "attractTarget", new THREE.InstancedBufferAttribute( this.attractTarget, 3, 1 ) );
    this.geometry.addAttribute( "target", new THREE.InstancedBufferAttribute( this.targetArray, 3, 1 ).setDynamic( true ) );

    this.geometry.addAttribute( "translate", new THREE.InstancedBufferAttribute( this.translateArray, 3, 1 ).setDynamic( true ) );
    this.geometry.addAttribute( "velocity", new THREE.InstancedBufferAttribute( this.velocityArray, 3, 1 ));
    this.geometry.addAttribute( "color", new THREE.InstancedBufferAttribute( this.colorsArray, 3, 1 ).setDynamic( true ) );
    this.geometry.addAttribute( "colortarget", new THREE.InstancedBufferAttribute( this.colorsArray, 3, 1 ).setDynamic( true ) );
    this.geometry.addAttribute( "colorStart", new THREE.InstancedBufferAttribute( this.colorsArray, 3, 1 ) );

    this.material = this.material2 = new THREE.RawShaderMaterial( {
      uniforms: {
        map: { type: "t", value: THREE.ImageUtils.loadTexture( "viz/textures/sprites/circleFlat2.png" ) },
        //map: { type: "t", value: THREE.ImageUtils.loadTexture( "viz/textures/sprites/circle.png" ) },
        time: { type: "f", value: 0.0},
        mode: { type: "f", value: 0.0},
        colortime: { type: "f", value: 0.0}
      },
      vertexShader: this.vs,
      fragmentShader: this.fs,
      transparent: true,
      depthTest: true,
      depthWrite: true
    } );

    this.material.uniforms[ 'colortime' ].value = 1;
    this.material2.uniforms[ 'colortime' ].value = 1;

    this.material.uniforms[ 'mode' ].value = 3.0; // question display
    this.material2.uniforms[ 'mode' ].value = 1.0;

    this.mesh2 = new THREE.Mesh( this.geometry2, this.material2 );
    this.mesh2.scale.set( 500, 500, 500 );

    this.scene.add( this.mesh2 );
    this.mesh2.position.z = -100;

    this.initShuffleIndexes();

    this.mesh = new THREE.Mesh( this.geometry, this.material );

    this.mesh.scale.set( 500, 500, 500 );
    this.mesh.matrixAutoUpdate = true;

    this.scene.add( this.mesh );

    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( this.windowWidth, this.windowHeight );
    this.container.appendChild( this.renderer.domElement );

    this.overlay = document.createElement("div");
    this.overlay.classList.add("viz-overlay");
    this.overlay.classList.add("js-viz-overlay");
    this.container.appendChild( this.overlay );

    this.composer = new THREE.EffectComposer( this.renderer );
    this.composer.addPass( new THREE.RenderPass( this.scene, this.camera ) );

    this.effect = new THREE.ShaderPass ( THREE.FXAAShader );
    this.effect.enabled = true;
    this.effect.uniforms.resolution.value = new THREE.Vector2(1 / this.windowWidth, 1 / this.windowHeight);
    this.composer.addPass(this.effect);


    var effectCopy = new THREE.ShaderPass(THREE.CopyShader);
    effectCopy.renderToScreen = true;
    this.composer.addPass (effectCopy);

    //Uncomment this to view stats again.
    // this.stats = new Stats();
    // this.stats.domElement.style.position = 'absolute';
    // this.stats.domElement.style.top = '0px';
    // this.container.appendChild( this.stats.domElement );

    this.triggerIntroEffect("blue");

    this.translates = this.geometry.getAttribute( 'translate' );
    this.translatesArray = this.translates.array;

    this.scales = this.geometry.getAttribute( 'scale' );
    this.scalesArray = this.scales.array;

    this.colorsAttr = this.geometry.getAttribute( 'color' );
    this.colorsArray = this.colorsAttr.array;

    this.colorTargets = this.geometry.getAttribute( 'colortarget' );
    this.colorTargetsArray = this.colorTargets.array;

    this.opacitys = this.geometry.getAttribute( 'opacity' );
    this.opacityArray = this.opacitys.array;

    this.translates2 = this.geometry2.getAttribute( 'translate' );
    this.translatesArray2 = this.translates2.array;

    this.scales2 = this.geometry2.getAttribute( 'scale' );
    this.scalesArray2 = this.scales2.array;

    this.colors2 = this.geometry2.getAttribute( 'color' );
    this.colorsArray2 = this.colors2.array;

    this.opacitys2 = this.geometry2.getAttribute( 'opacity' );
    this.opacityArray2 = this.opacitys2.array;

    window.addEventListener( 'resize', this.onWindowResize, false );

    this.animate();
    return true;
  }

  //Event handling functions that trigger different states.

  //Trigger for the intro effect
  @autobind
  triggerIntro(event) {
    if (this.state !== SELECTORS.INTRO) {
      this.state = SELECTORS.INTRO;
      this.queryComplete = false;
      this.triggerIntroEffect("blue");
    }
  }

  //trigger for the instructions view
  @autobind
  triggerInstructions(event) {
    this.state = SELECTORS.INSTRUCTIONS;
    TweenMax.to(this, 3, {fadeDistance: 1000});
    TweenMax.to(this.mesh2.position, 2*2.5, {z: 0, onComplete:this.moveExtraDot, ease: Power2.easeInOut});

    this.extraDotStartVector.x = this.translateArray2[0];
    this.extraDotStartVector.y = this.translateArray2[1];
    this.extraDotStartVector.z = this.translateArray2[2];

    this.extraDotEndVector.x = 30 + Math.random() * 20 - 10;
    this.extraDotEndVector.y = -23 + Math.random()*2 - 2;
    this.extraDotEndVector.z = this.translateArray2[2];//Math.random()*2 - 1;

    this.tweenContainer.time = 0;
    this.tweenContainer2.time = 0;
    TweenMax.to(this.tweenContainer, 1*2.5, {time: 1, ease:Power2.easeOut});
    TweenMax.to(this.tweenContainer2, 1*2.5, {time: 1, ease:Power2.easeIn});
    this.scaleOriginArray2 [ 0 ] = 30000;
    this.scaleTargetArray2[ 0 ] = 10 + Math.random()*60;

  }

   //Trigger for the bummer event,  It checks if the queryComplete flag has been set before running to prevent false bummer triggers
  @autobind
  triggerBummer(event) {
    if (!this.queryComplete) {
      for(var i=0, i3=0, l=this.particleCount; i<l; i++, i3 += 3) {
        this.scaleOriginArray[i] = this.scaleArray[i];
        this.scaleTargetArray[i] = 0;
        this.targetArray[i3 + 0] = this.shuffledStackArray[i3 + 0];
        this.targetArray[i3 + 1] = this.shuffledStackArray[i3 + 1];
        this.targetArray[i3 + 2] = this.shuffledStackArray[i3 + 2];
      }

      for(var i=0; i<this.particleCount2; i++){
        this.scaleArray2[i] = 0;
        this.scaleOriginArray2[i] = 0;
        this.scaleTargetArray2[i] = 0;
      }

      this.tweenContainer.time = 0;
      TweenMax.killTweensOf(this.tweenContainer);
      TweenMax.to(this.tweenContainer, 3, {time: 1,onUpdate: this.updateTime, onComplete: this.updateTranslates, ease: Power2.easeOut});

      this.material.uniforms[ 'mode' ].value = 1.0;
    }
  }

  //function that moved / scales out the large background particle/dot that is visible in intro mode
  @autobind
  moveExtraDot() {
    this.colorsArray[ (this.questionDisplayParticleEnd + 1) * 3  + 0] = this.colorsArray2[0];
    this.colorsArray[ (this.questionDisplayParticleEnd + 1) * 3  + 1] = this.colorsArray2[1];
    this.colorsArray[ (this.questionDisplayParticleEnd + 1) * 3  + 2] = this.colorsArray2[2];

    this.translateArray[ (this.questionDisplayParticleEnd + 1) * 3  + 0] = this.translateArray2[0];
    this.translateArray[ (this.questionDisplayParticleEnd + 1) * 3  + 1] = this.translateArray2[1];
    this.translateArray[ (this.questionDisplayParticleEnd + 1) * 3  + 2] = this.translateArray2[2];


    this.scaleOriginArray[ this.questionDisplayParticleEnd + 1 ] = this.scaleOriginArray2[ 0 ];
    this.scaleTargetArray[ this.questionDisplayParticleEnd + 1 ] = this.scaleTargetArray2[ 0 ];

    this.scaleArray[ this.questionDisplayParticleEnd + 1 ] = this.scalesArray2[0];

    this.opacityArray[this.questionDisplayParticleEnd] = this.opacityArray2[0];

    this.scaleTargetArray2[ 0 ] = 0
    this.scalesArray2[ 0 ] = 0;
    this.opacityArray2[ 0 ] = 1;

  }

  //triggers the question effect, this randomly selects one of the 4 color groups
  @autobind
  triggerQuestion(event) {
    this.queryComplete = false;
    this.clearLabels();
    var color = "red";
    switch (Math.round(Math.random()*3)) {
      case 1:
        color = "green";
      break;
      case 2:
        color = "blue";
      break;
      case 3:
        color = "yellow";
      break;
    }

    if (this.pause) {
      this.unPauseVisuals();
    }
    this.state = SELECTORS.INSTRUCTIONS;
    this.triggerQuestionEffect(color);
  }

  //handler for submitQuery event which is a combination of the gridUnder effect and actionQuery
  @autobind
  triggerSubmitQuery(event, param) {
    const timing = param === 'skip' ? 10 : 8000;

    TweenMax.killTweensOf(this);
    TweenMax.killTweensOf(this.tweenContainer);
    TweenMax.killTweensOf(this.tweenContainer2);
    TweenMax.killTweensOf(this.camera.position);

    this.triggerGridUnder();

    this.clearTimeouts();
    this.timeouts.push(setTimeout(this.actionQuery, timing));
    // this.timeouts.push(setTimeout(this.actionQuery, 3000));
  }

  //handler for the queryComplete event
  @autobind
  triggerQueryComplete(event, per) {
    this.queryComplete = true;
    this.percentages = per;

    if (per === undefined) {
       this.percentages = [];
    }

    if(this.percentages.length < 10){
      var toadd = 10 - this.percentages.length;
      for(var i=this.percentages.length; i < 10; i++){
        this.percentages[i] = {"label":"", "number": 0}
      }
    }

    var total = 0;
    for (var i=0; i<this.percentages.length; i++) {
      total += this.percentages[i].number;
    }
    for (var i=0; i<this.percentages.length; i++) {
      this.percentages[i].percent = this.percentages[i].number / total;
      if (this.percentages[i].percent < this.percentageLimit) { //This is where the pie slices that are less that 2% are removed
        this.percentages[i].percent = 0;
        this.percentages[i].number = 0;

      }
    }
    total = 0;
    for (var i=0; i<this.percentages.length; i++) {
      total += this.percentages[i].number;
    }

    for (var i=0; i<this.percentages.length; i++) {
      if(this.percentages[i].number > 0){
        this.percentages[i].percent = this.percentages[i].number / total;
      } else {
        this.percentages[i].percent = 0;
      }

    }

    this.clearTimeouts();

    if (this.state !== SELECTORS.QUERY2PART2) {
      this.splitClumpsToColors();
      this.timeouts.push(setTimeout(this.triggerRing, 500));
    } else {
      this.triggerRing();
    }
  }

  //triggers the gridUnder view which is the shuffleStack view
  @autobind
  triggerGridUnder(event){
    for (var i=0, i3=0, l=this.particleCount2; i<l; i++, i3+=3) {
      this.scaleOriginArray2[i] = this.scaleArray2[i];
      this.scaleTargetArray2[i] = 0;
    }

    TweenMax.to(this.camera.position, 3, {z: 1000, ease:Power2.easeInOut});
    var targets = this.geometry.getAttribute( 'target' );
    var stack = this.geometry.getAttribute( 'stack' );
    this.stackArray = stack.array;

    for (var i = 0, i3 = 0, l = this.particleCount; i < l; i ++, i3 += 3 ) {

      this.scaleOriginArray[i] = this.scaleArray[i];
      this.scaleTargetArray[ i ] = 7;

      if (i < this.questionDisplayParticleStart || i > this.questionDisplayParticleEnd ) {
        this.translateArray[i3 + 0] = this.shuffledStackArray[i3 + 0];
        this.translateArray[i3 + 1] = this.shuffledStackArray[i3 + 1];
        this.translateArray[i3 + 2] = this.shuffledStackArray[i3 + 2];

        this.colorsArray[ i3 + 0 ] = this.colorsTargetArray[ i3 + 0 ];
        this.colorsArray[ i3 + 1 ] = this.colorsTargetArray[ i3 + 1 ];
        this.colorsArray[ i3 + 2 ] = this.colorsTargetArray[ i3 + 2 ];
      }

      this.targetArray[i3 + 0] = this.shuffledStackArray[i3 + 0];
      this.targetArray[i3 + 1] = this.shuffledStackArray[i3 + 1];
      this.targetArray[i3 + 2] = this.shuffledStackArray[i3 + 2];
    }

    targets.needsUpdate = true;
    this.tweenContainer.time = 0;
    this.tweenContainer.scale = 0;

    TweenMax.to(this.tweenContainer, 3, {scale: 10, time: 1, colorTime: 1, onUpdate: this.updateTime, onComplete: this.updateTranslates, ease: Power2.easeOut});

    this.material.uniforms[ 'mode' ].value = 1.0;
  }

  //variation of the triggerResult function but triggers a zoom, this is the currently used results trigger
  @autobind
  triggerResults(){
    this.state = SELECTORS.RESULTS2;
    var targetIndex = this.targetDotIndex;//0;
    $(document).trigger("flyIn");

    for (var i=0; i<this.labelDots.length; i++) {
      TweenMax.killTweensOf(this.labelDots[i]);
      TweenMax.to(this.labelDots[i], 0.5, { opacity: 0, ease:Power2.easeOut });
    }

    for (var i=0, i3=0; i<this.scalesArray.length; i++, i3 += 3) {
      this.scaleOriginArray[i] = this.scaleTargetArray[i];
      this.scaleTargetArray[i] = 0;

      if (i === this.targetDotIndex) {
        this.scaleTargetArray[i] = 12.7;
      }

    }

    this.tempVector.x = this.targetArray[(targetIndex*3) + 0];
    this.tempVector.y = this.targetArray[(targetIndex*3) + 1];
    this.tempVector.z = this.targetArray[(targetIndex*3) + 2];

    this.tempVector2 = this.tempVector.clone();

    this.mesh.updateMatrix();
    this.mesh.updateMatrixWorld();

    this.tempVector2 = this.mesh.localToWorld( this.tempVector2 );

    this.tweenContainer.time = 0;

    this.cameraTarget.position.x = this.mesh.position.x;
    this.cameraTarget.position.y = this.mesh.position.y;
    this.cameraTarget.position.z = this.mesh.position.z;

    this.cameraTarget.position.x = this.tempVector2.x;
    this.cameraTarget.position.y = this.tempVector2.y;
    this.cameraTarget.position.z = this.tempVector2.z;

    TweenMax.killTweensOf(this.tweenContainer);
    TweenMax.killTweensOf(this.camera.position);
    TweenMax.killTweensOf(this.camera.rotation);
    TweenMax.killTweensOf(this.cameraTarget.position);

    TweenMax.to(this.tweenContainer, 1, {time: 1, delay: 0.5, ease:Power2.easeIn, onUpdate:this.updateColorTime });

    TweenMax.to(this.cameraTarget.rotation, 1.5, {x: 0, y: 0, z: 0, ease:Power2.easeInOut});
    TweenMax.to(this.camera.position, 1.5, {x: this.tempVector2.x, y: this.tempVector2.y, z:this.tempVector2.z + 1.5, ease:Power2.easeInOut, onComplete: this.pauseVisuals});
  }

  //handler for the intro effect based on the color passed, currently only blue is ever used.
  @autobind
  triggerIntroEffect(color) {
    this.clearLabels();

    if (this.pause) {
      this.unPauseVisuals();
    }

    this.mesh2.position.z = 0;
    for (var i = 0, i3 = 0, l = this.particleCount2; i < l; i ++, i3 += 3 ) {
      this.scaleArray2[i] = 0;
      this.scaleOriginArray2[i] = 0;
      this.scaleTargetArray2[i] = 0;
      this.opacityArray2[i] = 1;

      this.translateArray2[i3 + 0] = 0;
      this.translateArray2[i3 + 1] = 0;
      this.translateArray2[i3 + 2] = 0;
      this.targetArray2[i3 + 0] = 0;
      this.targetArray2[i3 + 1] = 0;
      this.targetArray2[i3 + 2] = 0;
    }

    for (var i =0, i3 = 0, l = this.particleCount; i < l; i++, i3 += 3){
      this.scaleOriginArray[i] = this.scaleArray[i];
      this.scaleTargetArray[i] = 0;
      this.opacityArray[i] = 1.0;
    }
    this.geometry.getAttribute('opacity').needsUpdate = true;

    switch (color) {
      case "blue":
        this.colorsArray2[0] = 0.2588;
        this.colorsArray2[1] = 0.5215;
        this.colorsArray2[2] = 0.9568;
      break;
      case "red":
        this.colorsArray2[0] = this.colors[this.colorSet][1][0][0];
        this.colorsArray2[1] = this.colors[this.colorSet][1][0][1];
        this.colorsArray2[2] = this.colors[this.colorSet][1][0][2];
      break;
      case "yeallow":
        this.colorsArray2[0] = this.colors[this.colorSet][2][1][0];
        this.colorsArray2[1] = this.colors[this.colorSet][2][1][1];
        this.colorsArray2[2] = this.colors[this.colorSet][2][1][2];
      break;
      case "green":
        this.colorsArray2[0] = this.colors[this.colorSet][3][0][0];
        this.colorsArray2[1] = this.colors[this.colorSet][3][0][1];
        this.colorsArray2[2] = this.colors[this.colorSet][3][0][2];
      break;
    }

    this.triggerQuestionEffect(color);

    this.scaleTargetArray2 [ 0 ] = 30000;

    this.translateArray2[0] = -2;
    this.translateArray2[1] = 0;
    this.translateArray2[2] = -100;

    this.targetArray2[0] = -2;
    this.targetArray2[1] = 0;
    this.targetArray2[2] = -100;
    this.tweenContainer.time = 0;

    TweenMax.to(this.tweenContainer, 1, {time: 1});
    TweenMax.to(this.mesh2.position, 1, {z: -100});

    this.material.uniforms[ 'mode' ].value = 3.0;
  }

  //handler for the question effect of a specific color set by triggerQuestion
  @autobind
  triggerQuestionEffect(color) {
    this.questionDisplayParticleStart = 0;
    switch (color) {
      case "green":
        this.questionDisplayParticleStart = this.particleCount * 0.25;
      break;
      case "blue":
        this.questionDisplayParticleStart = this.particleCount * 0.5;
      break;
      case "yellow":
        this.questionDisplayParticleStart = this.particleCount * 0.75;
      break;
    }

    if (color != this.currentColor) {
      this.currentColor = color;
      this.questionDisplayParticleEnd = this.questionDisplayParticleStart + this.questionParticleMin + Math.round(Math.random()*this.quesitonParticleVariable);

      for (var i = 0, i3 = 0, l = this.particleCount2; i < l; i ++, i3 += 3 ) {
        this.scaleArray2[i] = 0;
        this.scaleOriginArray2[i] = 0;
        this.scaleTargetArray2[i] = 0;
      }

      for (var i =0, i3 = 0, l = this.particleCount; i < l; i++, i3 += 3){
        this.scaleOriginArray[i] = this.scaleArray[i];
        this.scaleTargetArray[i] = 0;
        this.opacityArray[i] = 1.0;

        if ( i/l < 0.25 ) {
          this.a = Math.floor(Math.random() * this.colors[this.colorSet][0].length);
          this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][0][this.a][0];
          this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][0][this.a][1];
          this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][0][this.a][2];
        } else if ( i/l < 0.5 ) {
          this.a = Math.floor(Math.random() * this.colors[this.colorSet][1].length);
          this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][1][this.a][0];
          this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][1][this.a][1];
          this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][1][this.a][2];
        } else if ( i/l < 0.75 ) {
          this.a = Math.floor(Math.random() * this.colors[this.colorSet][2].length);
          this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][2][this.a][0];
          this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][2][this.a][1];
          this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][2][this.a][2];
        } else if ( i/l < 1 ) {
          this.a = Math.floor(Math.random() * this.colors[this.colorSet][3].length);
          this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][3][this.a][0];
          this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][3][this.a][1];
          this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][3][this.a][2];
        }
      }

      for(var i = this.questionDisplayParticleStart, i3 = this.questionDisplayParticleStart*3, l = this.particleCount; i<this.questionDisplayParticleEnd; i++, i3 +=3){

        this.scaleTargetArray [ i ] = 10 + Math.random()*60;

        this.translateArray[i3 + 0] = Math.random()*8 - 4;
        this.translateArray[i3 + 1] = Math.random()*4 - 2;
        this.translateArray[i3 + 2] = Math.random()*4 - 2;
        this.opacityArray[i] = 1.0;

        switch (color) {
          case "red":
            if( Math.round(Math.random()) ) {
              this.colorsArray[i3 + 0] = this.colors[this.colorSet][0][0][0];
              this.colorsArray[i3 + 1] = this.colors[this.colorSet][0][0][1];
              this.colorsArray[i3 + 2] = this.colors[this.colorSet][0][0][2];
            } else {
              this.colorsArray[i3 + 0] = this.colors[this.colorSet][0][1][0];
              this.colorsArray[i3 + 1] = this.colors[this.colorSet][0][1][1];
              this.colorsArray[i3 + 2] = this.colors[this.colorSet][0][1][2];
            }
          break;
          case "green":
            if( Math.round(Math.random()) ) {
              this.colorsArray[i3 + 0] = this.colors[this.colorSet][1][0][0];
              this.colorsArray[i3 + 1] = this.colors[this.colorSet][1][0][1];
              this.colorsArray[i3 + 2] = this.colors[this.colorSet][1][0][2];
            } else {
              this.colorsArray[i3 + 0] = this.colors[this.colorSet][1][1][0];
              this.colorsArray[i3 + 1] = this.colors[this.colorSet][1][1][1];
              this.colorsArray[i3 + 2] = this.colors[this.colorSet][1][1][2];
            }
          break;
          case "blue":
            if( Math.round(Math.random()) ) {
              this.colorsArray[i3 + 0] = 0.243;
              this.colorsArray[i3 + 1] = 0.509;
              this.colorsArray[i3 + 2] = 0.968;
            } else {
              this.colorsArray[i3 + 0] = 0.729;
              this.colorsArray[i3 + 1] = 0.87;
              this.colorsArray[i3 + 2] = 0.988;
            }
          break;
          case "yellow":
            if( Math.round(Math.random()) ) {
              this.colorsArray[i3 + 0] = this.colors[this.colorSet][3][0][0];
              this.colorsArray[i3 + 1] = this.colors[this.colorSet][3][0][1];
              this.colorsArray[i3 + 2] = this.colors[this.colorSet][3][0][2];
            } else {
              this.colorsArray[i3 + 0] = this.colors[this.colorSet][3][1][0];
              this.colorsArray[i3 + 1] = this.colors[this.colorSet][3][1][1];
              this.colorsArray[i3 + 2] = this.colors[this.colorSet][3][1][2];
            }
          break;
        }

      }

    }
    this.geometry.getAttribute( 'opacity' ).needsUpdate = true;

    this.tweenContainer.time = 0;

    TweenMax.to(this, 1, {fadeDistance: 300});

    TweenMax.to(this.camera.position, 3, {x:0, y:0, z:1000, ease: Power2.easeOut});
    TweenMax.to(this.camera.rotation, 3, {z: 0, x: 0, y: 0});

    TweenMax.to(this.mesh.position, 3, {x: 200, y:0, z:0, ease: Power2.easeOut});
    TweenMax.to(this.mesh2.position, 3, {x: 200, y:0, z:0, ease: Power2.easeOut});
    TweenMax.killTweensOf(this.tweenContainer);
    TweenMax.to(this.tweenContainer, 1, {time:1,  ease:Power2.easeOut});

    this.geometry.getAttribute( 'translate' ).needsUpdate = true;
    this.geometry.getAttribute( 'scale' ).needsUpdate = true;

    this.material.uniforms[ 'mode' ].value = 3.0;
  }

  //window resize handler to update camera and render settings
  @autobind
  onWindowResize( event ) {
    this.camera.aspect = this.windowWidth / this.windowHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize( this.windowWidth, this.windowHeight );
  }

  //this function initialized the render loop.
  @autobind
  animate() {
    if (!this.pause) {
      requestAnimationFrame( this.animate );
    }
    this.render();
    //this.stats.update();
  }

  //Main render loop, uses a switch statement based on the current mode value
  @autobind
  render() {
    this.time = performance.now() * 0.0005;
    var color = new THREE.Color( 0xffffff );
    var op = 1;

    if (this.mesh.rotation.x > this.XLIM && this.XDIR === -1) {
      this.XDIR = 1;
    }

    if (this.mesh.rotation.x < 0 - this.XLIM && this.XDIR === 1) {
      this.XDIR = -1;
    }

    if (this.state !== SELECTORS.RESULTS2) {
      if (this.state !== SELECTORS.RESULTS && this.state !== SELECTORS.RING && this.state !== SELECTORS.RING2 && this.state !== SELECTORS.RINGLABELS) {
        this.mesh.rotation.x += (-0.0001) * this.XDIR;
      }

      this.mesh.rotation.y -= 0.00125;
    }

    if (this.state === SELECTORS.RINGLABELS ) {
      this.updateLabelPositions();
    }

    switch(this.material.uniforms[ 'mode' ].value) {
      case 1:
        for ( var i = 0, i3 = 0, l = this.particleCount; i < l; i++, i3 += 3 ) {
          if (this.scaleTargetArray[i] !== this.scaleArray[i]) {
            if (this.scaleTargetArray[i] > this.scaleArray[i]) {
              this.d = this.scaleOriginArray[i] - this.scaleTargetArray[i];
              if (this.state !== SELECTORS.RESULTS) {
                this.scalesArray[i] = this.scaleOriginArray[i] - this.d * this.tweenContainer.time;
              }
            } else {
              this.d = this.scaleOriginArray[i] - this.scaleTargetArray[i];
              if (this.state !== SELECTORS.RESULTS) {
                this.scalesArray[i] = this.scaleOriginArray[i] - this.d * this.tweenContainer.time;
              }
            }
          }
        }

        for ( var i = 0, i3 = 0, l = this.particleCount2; i < l; i++, i3 += 3 ) {
          if (this.scaleTargetArray2[i] !== this.scaleArray2[i]) {
            if (this.scaleTargetArray2[i] > this.scaleArray2[i]) {
              this.d = this.scaleOriginArray2[i] - this.scaleTargetArray2[i];
              if (this.state === SELECTORS.RESULTS) {
                this.scalesArray2[i] = this.scaleOriginArray2[i] - this.d * this.tweenContainer2.time;
              } else {
                this.scalesArray2[i] = this.scaleOriginArray2[i] - this.d * this.tweenContainer.time;
              }

            } else {
              this.d = this.scaleOriginArray2[i] - this.scaleTargetArray2[i];
              if (this.state === SELECTORS.RESULTS) {
                this.scalesArray2[i] = this.scaleOriginArray2[i] - this.d * this.tweenContainer2.time;
              } else {
                this.scalesArray2[i] = this.scaleOriginArray2[i] - this.d * this.tweenContainer.time;
              }
            }
          }
        }
      break;

      case 3: //question display alpha fades
        var targetOpacity = 1.0;
        for ( var i = 0, i3 = 0, l = this.particleCount; i < l; i++, i3 += 3 ) {
          if (this.scaleTargetArray[i] !== this.scaleArray[i]) {
            if (this.scaleTargetArray[i] > this.scaleArray[i]) {
              this.d = this.scaleOriginArray[i] - this.scaleTargetArray[i];
              this.scalesArray[i] = this.scaleOriginArray[i] - this.d * this.tweenContainer.time;
            } else {
              this.d = this.scaleOriginArray[i] - this.scaleTargetArray[i];
              this.scalesArray[i] = this.scaleOriginArray[i] - this.d * this.tweenContainer.time;
            }
          }

          if (this.opacityArray[i] > targetOpacity) {
            this.opacityArray[i] -= 0.01;
          }
          if (this.opacityArray[i] < targetOpacity) {
            this.opacityArray[i] += 0.01;
          }
        }
        this.geometry.getAttribute( 'opacity' ).needsUpdate = true;

        for ( var i = 0, i3 = 0, l = this.particleCount2; i < l; i++, i3 += 3 ) {
          if (this.scaleTargetArray2[i] !== this.scaleArray2[i]) {
            if (this.scaleTargetArray2[i] > this.scaleArray2[i]) {
              this.d = this.scaleOriginArray2[i] - this.scaleTargetArray2[i];
              this.scalesArray2[i] = this.scaleOriginArray2[i] - this.d * this.tweenContainer.time;
            } else {
              this.d = this.scaleOriginArray2[i] - this.scaleTargetArray2[i];
              this.scalesArray2[i] = this.scaleOriginArray2[i] - this.d * this.tweenContainer.time;
            }
          }
        }

        for (var i = this.questionDisplayParticleStart, i3 = (this.questionDisplayParticleStart)*3, l = this.particleCount; i<(this.questionDisplayParticleEnd + 2); i++, i3 +=3) {

          this.tempVector.x = this.translateArray[i3 + 0];
          this.tempVector.y = this.translateArray[i3 + 1];
          this.tempVector.z = this.translateArray[i3 + 2];
          this.tempVector.applyMatrix4 ( this.mesh.matrixWorld );

          if ( this.tempVector.z < this.fadeDistance) {
            op = (this.tempVector.z - (this.fadeDistance - 100)) / 100;

            op = op <= 0.05 ? 0.05 : op;

            if (this.opacityArray[i] - op > 0.05 && this.state === SELECTORS.INTRO){
              op = this.opacityArray[i] - op;
            }

            this.opacityArray[i] = op;

          } else {

            this.opacityArray[i] = 1.0;
          }
        }

        if (this.state === SELECTORS.INSTRUCTIONS) {
          //mesh2 intro particle
          this.tempVector.x = this.translateArray2[0];
          this.tempVector.y = this.translateArray2[1];
          this.tempVector.z = this.translateArray2[2];
          this.tempVector.applyMatrix4 ( this.mesh.matrixWorld );

          if ( this.tempVector.z < this.fadeDistance ) {
            op = (this.tempVector.z - (this.fadeDistance - 100)) / 100;
            op = op <= 0.05 ? 0.05 : op;
            this.opacityArray2[0] = op;
          } else {
            this.opacityArray2[0] = 1.0;
          }

          this.opacityArray2[0] = 1 - (this.tweenContainer2.time * 0.95);
          this.tempVector2 = this.extraDotStartVector.lerp(this.extraDotEndVector, this.tweenContainer.time);

          this.translateArray2[0] = this.tempVector2.x
          this.translateArray2[1] = this.tempVector2.y;
          this.translateArray2[2] = this.tempVector2.z;
        }

        if (this.state === SELECTORS.INTRO) {
          this.tempVector2.x = -2;
          this.tempVector2.y = 0;
          this.tempVector2.z = -10000;

          this.tempVector = this.mesh2.worldToLocal(this.tempVector2);

          this.translateArray2[0] = this.tempVector.x;
          this.translateArray2[1] = this.tempVector.y;
          this.translateArray2[2] = this.tempVector.z;
        }

        this.opacitys.needsUpdate = true;
        this.opacitys2.needsUpdate = true;
      break;

      case 4:  //attractTarget Clumps
          if(this.state === SELECTORS.RING){
            if (this.clumpCounter >= 300) {
              this.state = SELECTORS.RING2;
              return;
            }
            for ( var i = 0, i3 = 0, l = this.particleCount; i < l; i++, i3 += 3 ) {
              if (this.scaleTargetArray[i] !== this.scaleArray[i]) {
                if (this.scaleTargetArray[i] > this.scaleArray[i]) {
                  this.d = this.scaleOriginArray[i] - this.scaleTargetArray[i];
                  this.scalesArray[i] = this.scaleOriginArray[i] - this.d * this.tweenContainer.time;
                } else {
                  this.d = this.scaleOriginArray[i] - this.scaleTargetArray[i];
                  this.scalesArray[i] = this.scaleOriginArray[i] - this.d * this.tweenContainer.time;
                }
              }
            }

            for ( var i = 0, i3 = 0, l = this.particleCount2; i < l; i++, i3 += 3 ) {
              if (this.scaleTargetArray2[i] !== this.scaleArray2[i]) {
                if (this.scaleTargetArray2[i] > this.scaleArray2[i]) {
                  this.d = this.scaleOriginArray2[i] - this.scaleTargetArray2[i];
                  this.scalesArray2[i] = this.scaleOriginArray2[i] - this.d * this.tweenContainer.time;
                } else {
                  this.d = this.scaleOriginArray2[i] - this.scaleTargetArray2[i];
                  this.scalesArray2[i] = this.scaleOriginArray2[i] - this.d * this.tweenContainer.time;
                }
              }
            }
          }

          if (this.state === SELECTORS.QUERY1PART1 || this.state === SELECTORS.QUERY2PART1 || this.state === SELECTORS.RING) {

            this.clumpCounter++;

            if (this.clumpCounter >= this.clumpTrigger && this.state == SELECTORS.QUERY2PART1) {
              this.state = SELECTORS.QUERY2PART2;
              this.splitClumpsToColors();
              this.clearTimeouts();
            }

            for (var i=0; i<this.clumpPoints.length-1; i++) {
              this.extraDotEndVector.x = this.clumpTargetPoints[i].x;
              this.extraDotStartVector.x = this.clumpOriginPoints[i].x;
              this.extraDotEndVector.y = this.clumpTargetPoints[i].y;
              this.extraDotStartVector.y = this.clumpOriginPoints[i].y;
              this.extraDotEndVector.z = this.clumpTargetPoints[i].z;
              this.extraDotStartVector.z = this.clumpOriginPoints[i].z;

              this.tempVector2 = this.extraDotStartVector.lerp(this.extraDotEndVector, this.tweenContainer2.time);

              this.clumpPoints[i].x = this.tempVector2.x;
              this.clumpPoints[i].y = this.tempVector2.y;
              this.clumpPoints[i].z = this.tempVector2.z;
            }
          }

          for ( var i = 0, i3 = 0, l = this.particleCount; i < l; i++, i3 += 3 ) {
            if (this.state !== SELECTORS.RING) {
              if (this.scalesArray[0] !== 10) {
                this.scalesArray [ i ] = this.scalesArray[i] + (this.tweenContainer.scale - this.scalesArray[i]*this.tweenContainer.time);
              }
            }

            if (this.scalesArray[i] > 0) {

              this.tempVector.x = this.translateArray[i3 + 0];
              this.tempVector.y = this.translateArray[i3 + 1];
              this.tempVector.z = this.translateArray[i3 + 2];

              this.tempVector2 = this.clumpPoints[this.attractTargetArray [ i ]];

              this.tempVelocity.x = this.velocityArray[i3 + 0];
              this.tempVelocity.y = this.velocityArray[i3 + 1];
              this.tempVelocity.z = this.velocityArray[i3 + 2];

              this.tempAcceleration.x = this.accelerationArray[i3 + 0];
              this.tempAcceleration.y = this.accelerationArray[i3 + 1];
              this.tempAcceleration.z = this.accelerationArray[i3 + 2];

              this.forceVector = this.tempVector3.subVectors(this.tempVector, this.tempVector2);

              this.d = this.forceVector.length();
              if (this.d<0) this.d*=-1;
              this.forceVector = this.forceVector.normalize();

              this.f = (10 * this.clumpMass[this.attractTargetArray [ i ]] * this.massArray[i]) / (this.d * this.d);// * (this.time); // f = strength
              this.forceVector = this.forceVector.multiplyScalar(this.f);

              //apply force;
              this.b = this.forceVector.divideScalar( 1000000 );

              this.multp = 0.005;
              this.multn = -0.005;

              if(this.d > 0.5){
                this.multp = 0.3;
                this.multn = 0 - this.multp;
              }

              this.tempAcceleration.add(this.b);

              this.tempVector3.x = Math.random()*this.multn;
              this.tempVector3.y = Math.random()*this.multn;
              this.tempVector3.z = Math.random()*this.multn;

              this.tempVector4.x = Math.random()*this.multp;
              this.tempVector4.y = Math.random()*this.multp;
              this.tempVector4.z = Math.random()*this.multp;

              this.tempAcceleration.max(this.tempVector3);
              this.tempAcceleration.min(this.tempVector4);

              this.tempVelocity.add(this.tempAcceleration);

              this.f = 2.25 / (this.d - 0.75);

              this.tempVector3.x = 0-this.limits[this.attractTargetArray [ i ]];
              this.tempVector3.y = 0-this.limits[this.attractTargetArray [ i ]];
              this.tempVector3.z = 0-this.limits[this.attractTargetArray [ i ]];

              this.tempVector4.x = this.limits[this.attractTargetArray [ i ]];
              this.tempVector4.y = this.limits[this.attractTargetArray [ i ]];
              this.tempVector4.z = this.limits[this.attractTargetArray [ i ]];

              this.tempVelocity.max(new THREE.Vector3(0-this.limits[this.attractTargetArray [ i ]],0-this.limits[this.attractTargetArray [ i ]],0-this.limits[this.attractTargetArray [ i ]]));

              this.tempVelocity.min(new THREE.Vector3(this.limits[this.attractTargetArray [ i ]],this.limits[this.attractTargetArray [ i ]],this.limits[this.attractTargetArray [ i ]]));
              this.tempVelocity.max(this.tempVector3);
              this.tempVelocity.min(this.tempVector4);

              this.tempVector.add(this.tempVelocity);

              this.velocityArray[i3 + 0] = this.tempVelocity.x;
              this.velocityArray[i3 + 1] = this.tempVelocity.y;
              this.velocityArray[i3 + 2] = this.tempVelocity.z;

              this.accelerationArray[i3 + 0] = this.tempAcceleration.x;
              this.accelerationArray[i3 + 1] = this.tempAcceleration.y;
              this.accelerationArray[i3 + 2] = this.tempAcceleration.z;

              this.translateArray[i3 + 0] = this.tempVector.x;
              this.translateArray[i3 + 1] = this.tempVector.y;
              this.translateArray[i3 + 2] = this.tempVector.z;
            }
          }
      break;
    }

    this.translates.needsUpdate = true;
    this.translates2.needsUpdate = true;
    this.scales.needsUpdate = this.scales2.needsUpdate = true;
    this.colorsAttr.needsUpdate = this.colors2.needsUpdate = true;
    this.colorTargets.needsUpdate = true;
    this.opacitys.needsUpdate = true;
    this.composer.render();
  }

  //handler for submitQuery event, this triggers the clumping action
  @autobind
  actionQuery() {
    this.state = SELECTORS.QUERY2PART1;

    this.incIndex = Math.round(Math.random() * 4);

    this.incOrder = this.incOrders[this.incIndex].colors;

    this.incNums = [];
    for(var i=0; i<this.incOrders[this.incIndex].numof.length; i++){
      this.incNums[i] = this.incOrders[this.incIndex].numof[i];
    }

    this.e = Math.round(Math.random()*30) + 32;

    if (this.clumpPoints.length > this.e) {
      this.clumpPoints.splice(this.e, this.clumpPoints.length);
      this.clumpMass.splice(this.e, this.clumpMass.length);
      this.clumpTargetPoints.splice(this.e, this.clumpTargetPoints.length);
      this.clumpOriginPoints.splice(this.e, this.clumpOriginPoints.length);
    }

    var max = 2000/250;
    var max2 = 1000/200;
    var max3 = 1000/250;

    for (var i = 0; i < this.e; i++) {

      this.tempVector2.y = (Math.random() * max3 - (max3 * 0.5));
      this.tempVector2.z = (Math.random() * max2 - (max2 * 0.5));
      this.tempVector2.x = ((Math.random() * max2 - (max2 * 0.5)));

      this.tempVector = this.tempVector2;

      if (!this.clumpPoints[i]) {
        this.clumpPoints[i] = new THREE.Vector3(this.tempVector.x, this.tempVector.y, this.tempVector.z);
        this.clumpOriginPoints[i] = new THREE.Vector3(this.tempVector.x, this.tempVector.y, this.tempVector.z);
      } else {
        this.clumpPoints[i].x = this.tempVector.x;
        this.clumpPoints[i].y = this.tempVector.y;
        this.clumpPoints[i].z = this.tempVector.z;
        this.clumpOriginPoints[i].x = this.tempVector.x;
        this.clumpOriginPoints[i].y = this.tempVector.y;
        this.clumpOriginPoints[i].z = this.tempVector.z;
      }

      if(i === 0){
        this.tempVector2.x = 0;
        this.tempVector2.y = 0;
        this.tempVector2.z = 0;
      }

      if (!this.clumpTargetPoints[i]) {
        this.clumpTargetPoints[i] = new THREE.Vector3(this.tempVector.x, this.tempVector.y, this.tempVector.z);
      } else {
        this.clumpTargetPoints[i].x = this.tempVector.x;
        this.clumpTargetPoints[i].y = this.tempVector.y;
        this.clumpTargetPoints[i].z = this.tempVector.z;
      }

      this.clumpMass[i] = -10 - Math.random()*50;
      this.limits[i] = 0.02 + Math.random() * 0.01;
    }

    for (var i = 0, i3 = 0, l = this.particleCount; i < l; i ++, i3 += 3 ) {

      if (i/l < 0.25) {
        this.attractTargetArray[ i ] = Math.floor(i/((this.particleCount*0.25)/this.e));
      } else if (i/l < 0.5) {
        this.attractTargetArray[ i ] = Math.floor((i-this.particleCount*0.25)/((this.particleCount*0.25)/this.e));
      } else if (i/l < 0.75) {
        this.attractTargetArray[ i ] = Math.floor((i-this.particleCount*0.5)/((this.particleCount*0.25)/this.e));
      } else {
        this.attractTargetArray[ i ] = Math.floor((i-this.particleCount*0.75)/((this.particleCount*0.25)/this.e));
      }

      if ( i/l < 0.25 ) {
        this.a = Math.floor(Math.random() * this.colors[this.colorSet][0].length);
        this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][0][this.a][0];
        this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][0][this.a][1];
        this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][0][this.a][2];
      } else if ( i/l < 0.5 ) {
        this.a = Math.floor(Math.random() * this.colors[this.colorSet][1].length);
        this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][1][this.a][0];
        this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][1][this.a][1];
        this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][1][this.a][2];
      } else if ( i/l < 0.75 ) {
        this.a = Math.floor(Math.random() * this.colors[this.colorSet][2].length);
        this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][2][this.a][0];
        this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][2][this.a][1];
        this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][2][this.a][2];
      } else if ( i/l < 1 ) {
        this.a = Math.floor(Math.random() * this.colors[this.colorSet][3].length);
        this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][3][this.a][0];
        this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][3][this.a][1];
        this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][3][this.a][2];
      }
    }

    this.tweenContainer.scale = 0;
    this.tweenContainer.time = 0;
    this.tweenContainer2.time = 0;
    this.tweenContainer.colorTime = 0;

    this.clumpCounter = 0;

    TweenMax.killTweensOf(this.tweenContainer);
    TweenMax.killTweensOf(this.tweenContainer2);
    TweenMax.killTweensOf(this.mesh.position);
    TweenMax.killTweensOf(this.mesh2.position);

    TweenMax.to(this.tweenContainer, 3, {scale: 10, time: 1, colorTime: 1, onUpdate: this.updateColorTime, onComplete: this.updateColorTime, ease: Power2.easeOut});

    TweenMax.to(this.tweenContainer2, 1, {time: 1, ease: Power2.easeOut});

    TweenMax.to(this.mesh.position, 3, {x: 0, y:0, z:0, ease: Power2.easeOut});
    TweenMax.to(this.mesh2.position, 3, {x: 0, y:0, z:0, ease: Power2.easeOut});

    this.material.uniforms[ 'mode' ].value = 4.0;
  }

  //function to clump colors, this is triggered by the actionQuery
  @autobind
  clumpColors(event) {
    this.clumpPoints = [];
    this.clumpMass = [];
    this.clumpTargetPoints = [];
    this.clumpOriginPoints = [];
    var minClumps = 20;
    var maxClumps = 100;
    var blueClumps = minClumps + Math.round(Math.random()*maxClumps);
    var redClumps = minClumps + Math.round(Math.random()*maxClumps);
    var greenClumps = minClumps + Math.round(Math.random()*maxClumps);
    var yellowClumps = minClumps
    var max = 10;
    for (var i=0; i< blueClumps + redClumps + greenClumps + yellowClumps; i++) {
      this.clumpPoints[i] = new THREE.Vector3(Math.random() * max-(max*0.5), Math.random() * max-(max*0.5), Math.random() * max-(max*0.5));
      this.clumpOriginPoints[i] = new THREE.Vector3(0,0,0);
      this.clumpTargetPoints[i] = new THREE.Vector3(0,0,0);
      this.clumpMass[i] = -10 - Math.random()*200;
      this.limits[i] = 0.02 + Math.random() * 0.03;
    }
    for (var i = 0, i3 = 0, l = this.particleCount; i < l; i ++, i3 += 3 ) {
      if (i/l < 0.25) {
        this.e = 0 + Math.round(Math.random() * (redClumps-1));
      } else if(i/l < 0.5) {
        this.e = redClumps + Math.round(Math.random() * (greenClumps-1));
      } else if(i/l < 0.75) {
        this.e = redClumps + greenClumps + Math.round(Math.random() * (blueClumps-1));
      } else {
        this.e = redClumps + greenClumps + blueClumps + Math.round(Math.random() * (yellowClumps-1));
      }
      this.attractTargetArray [ i ] = this.e;
    }

    this.geometry.getAttribute( 'attracttarget' ).needsUpdate = true;
    this.material.uniforms[ 'mode' ].value = 4.0;

    this.tweenContainer.scale = 0;
    this.tweenContainer.time = 0;
    this.tweenContainer.colorTime = 0;

    TweenMax.killTweensOf(this.tweenContainer);

    TweenMax.to(this.tweenContainer, 3, {scale: 10, time: 1, colorTime: 1, onUpdate: this.updateColorTime, onComplete: this.updateColorTime, ease: Power2.easeOut});

    TweenMax.to(this.mesh.position, 3, {x: 0, y:0, z:0, ease: Power2.easeOut});
    TweenMax.to(this.mesh2.position, 3, {x: 0, y:0, z:0, ease: Power2.easeOut});
  }

  //trigger to split multi-clor clumps into seperate colored clumps
  @autobind
  splitClumpsToColors() {
    var tempClumpPoints = [];
    var max = 1;
    var len = this.clumpPoints.length;
    this.clumpOriginPoints = [];
    this.clumpPoints = this.clumpTargetPoints;
    this.clumpTargetPoints = [];

    for (var i=0; i<len; i++) {
      this.tempVector = this.clumpPoints[i].clone();

      for (var a=0; a<4; a++) {

        this.clumpOriginPoints[i*4 + a] = this.clumpPoints[i];
        this.clumpMass[i*4 + a] = -100000;
        this.limits[i*4 + a] = 0.02 + Math.random() * 0.0005;

        this.tempVector2.x = this.tempVector.x + (Math.random()*max - (max*0.5));
        this.tempVector2.y = this.tempVector.y + (Math.random()*max - (max*0.5));
        this.tempVector2.z = this.tempVector.z + (Math.random()*max - (max*0.5));
        this.clumpTargetPoints[i*4 + a] = this.tempVector2.clone();
      }
    }

    for (var i=0; i<this.clumpOriginPoints.length; i++) {
      this.clumpPoints[i] = this.clumpOriginPoints[i].clone();
    }

    var inc = 0;
    for (var i = 0, i3 = 0, l = this.particleCount; i < l; i ++, i3 += 3 ) {
      if ( i / l < 0.25 ) {  //blue
        inc = this.incOrder.indexOf(0);
      } else if (i / l < 0.5) { //red
        inc = this.incOrder.indexOf(1);
      } else if (i / l < 0.75 ) {//yellow
        inc = this.incOrder.indexOf(2);
      } else {//green
        inc = this.incOrder.indexOf(3);
      }
      this.attractTargetArray[i] = this.attractTargetArray[i]*4 + inc;
    }
  }

  //handler for queryComplete function
  @autobind
  triggerRing(event) {
    var rotationAdd = (Math.PI * 0.9) + ((this.mesh.rotation.y) % (Math.PI * 2))  - (Math.PI * 2)*0.0625;
    TweenMax.killTweensOf(this.tweenContainer);
    TweenMax.killTweensOf(this.tweenContainer2);

    this.currentColor = "";

    var percentages = this.percentages;

    var total = 0;

    percentages.sort((a, b) => b.percent - a.percent);

    var itterator = 0;
    var baseVariance = 0.03;
    var variance = 0.03;
    var tempLength = 0;
    var scale = 1;
    this.state = SELECTORS.RING;

    var per25 = this.particleCount*0.25;
    var per50 = this.particleCount*0.5;
    var per75 = this.particleCount*0.75;

    this.t = 0;
    this.t2 = 0;
    this.t3 = 0;
    this.t4 = 0;

    for (var i=0; i<percentages.length; i++) {
      if (i < this.incNums[0]) {
        this.t += percentages[i].percent;
      } else if (i < this.incNums[0] + this.incNums[1] ) {
        this.t2 += percentages[i].percent;
      } else if (i < this.incNums[0] + this.incNums[1] + this.incNums[2] ) {
        this.t3 += percentages[i].percent;
      } else if (i < this.incNums[0] + this.incNums[1] + this.incNums[2] + this.incNums[3] ){
        this.t4 += percentages[i].percent;
      }
    }

    var ts = [this.t, this.t2, this.t3, this.t4];

    for (var i=0; i<percentages.length; i++) {
      if (i < this.incNums[0]) {
        percentages[i].groupPercent = percentages[i].percent / this.t;
      } else if (i < this.incNums[0] + this.incNums[1] ) {
        percentages[i].groupPercent = percentages[i].percent / this.t2;
      } else if (i < this.incNums[0] + this.incNums[1] + this.incNums[2] ) {
        if(this.t3 === 0) {
          percentages[i].groupPercent = 0;
        } else {
          percentages[i].groupPercent = percentages[i].percent / this.t3;
        }

      } else {
        if(this.t4 === 0) {
          percentages[i].groupPercent = 0;
        }else {
          percentages[i].groupPercent = percentages[i].percent / this.t4;
        }
      }
    }

    this.percentages = percentages;

    for (var i=0; i<this.particleCount2; i++) {
      this.scalesArray2[i] = 0;
      this.scaleTargetArray2[i] = 0;
      this.scaleOriginArray2[i] = 0;
    }

    var preMult = [];
    for (var a=0; a<this.incOrder.length; a++) {
      switch (a) {
        case 0:
          preMult[a] = 0;
        break;
        case 1:
          preMult[a] = ((Math.PI*2) * ts[0]);
        break;
        case 2:
          preMult[a] = ((Math.PI*2) * ts[0]) + ((Math.PI*2) * ts[1]);
        break;
        case 3:
          preMult[a] = ((Math.PI*2) * ts[0]) + ((Math.PI*2) * ts[1]) + ((Math.PI*2) * ts[2]);
        break;
      }
    }

    var gapSize = this.gapSize;
    var groupSteps = [];
    var groupTotals = [];
    var groupSets = [];

    groupSteps[0] = 0;//this.incNums[0];
    var groupZeros = [0,0,0,0];

    for(var i=0; i<4; i++){
      groupSteps[i+1] = groupSteps[i] + this.incNums[i];
    }
    if(this.incNums[3] === 0){
      groupSteps[3] = 0;
    }

    for (var i=0; i<4; i++) {
      groupTotals[groupSteps[i]] = this.percentages[groupSteps[i]].groupPercent;
      groupSets[i] = [];
      groupSets[i].push(groupTotals[groupSteps[i]]);

      for (var a=1; a<this.incNums[i]; a++) {
        groupTotals[groupSteps[i] + a] = groupTotals[ groupSteps[i] + a -1 ] + this.percentages[groupSteps[i] + a].groupPercent;
        groupSets[i].push(groupTotals[groupSteps[i] + a]);
      }
      for(var a=0, l=this.incNums[i]; a<l; a++){
        if(this.percentages[groupSteps[i] + a].percent === 0){
          groupZeros[i] += 1;
          this.incNums[i] -= 1;
        }
      }
    }

    this.targetDotIndex = this.incOrder[0] * (this.particleCount * 0.25) + Math.floor((percentages[0].groupPercent * (this.particleCount * 0.25)) * 0.5); //this index is the particle index in the array for the results zoom in
    var hideMult = 0;
    var space = 0;
    for (var i=0, i3=0, l=this.particleCount; i < l; i++, i3 += 3) {

      variance = baseVariance;
      if (Math.random() > 0.6 && i !== this.targetDotIndex) {
        variance = baseVariance + (Math.random() * 0.1);
        this.opacityArray[i] = 0.4;
      }

      hideMult = 0

      if (i/this.particleCount < 0.25) {
        space = 0;
        for(var a=0; a<groupSets[this.incOrder.indexOf(0)].length; a++){
          if((i)/per25 >= groupSets[this.incOrder.indexOf(0)][a]){
            space = gapSize * (a+1);
            space -= (groupZeros[this.incOrder.indexOf(0)] * gapSize);
          }
        }

        itterator = preMult[this.incOrder.indexOf(0)] + space + (i/(this.particleCount*0.25)) * ((Math.PI*2) * (ts[this.incOrder.indexOf(0)]) - (gapSize * this.incNums[this.incOrder.indexOf(0)]));
        hideMult = ts[this.incOrder.indexOf(0)];
      } else if (i/this.particleCount < 0.5) {
        space = 0;
        for(var a=0; a<groupSets[this.incOrder.indexOf(1)].length; a++){
          if((i - per25)/per25 >= groupSets[this.incOrder.indexOf(1)][a]){
            space = gapSize * (a+1);
            space -= (groupZeros[this.incOrder.indexOf(1)] * gapSize);
          }
        }

        itterator = preMult[this.incOrder.indexOf(1)] + space + (i-(this.particleCount*0.25))/(this.particleCount*0.25) * ((Math.PI*2) * (ts[this.incOrder.indexOf(1)]) - (gapSize * this.incNums[this.incOrder.indexOf(1)]));
        hideMult = ts[this.incOrder.indexOf(1)];
      } else if (i/this.particleCount < 0.75) {
        space = 0;
        for(var a=0; a<groupSets[this.incOrder.indexOf(2)].length; a++){
          if((i - per50)/per25 >= groupSets[this.incOrder.indexOf(2)][a]){
            space = gapSize * (a+1);
            space -= (groupZeros[this.incOrder.indexOf(2)] * gapSize);
          }
        }

        itterator =  preMult[this.incOrder.indexOf(2)]  + space + (i-(this.particleCount*0.5))/(this.particleCount*0.25) * ((Math.PI*2) * (ts[this.incOrder.indexOf(2)]) - (gapSize * this.incNums[this.incOrder.indexOf(2)]));
        hideMult = ts[this.incOrder.indexOf(2)];
      } else if (i/this.particleCount <= 1) {
        space = 0;
        for(var a=0; a<groupSets[this.incOrder.indexOf(3)].length; a++){
          if((i - per75)/per25 >= groupSets[this.incOrder.indexOf(3)][a]){
            space = gapSize * (a+1);
            space -= (groupZeros[this.incOrder.indexOf(3)] * gapSize);
          }
        }

        itterator =  preMult[this.incOrder.indexOf(3)]  + space + (i-(this.particleCount*0.75))/(this.particleCount*0.25) * ((Math.PI*2) * (ts[this.incOrder.indexOf(3)]) - gapSize * (this.incNums[this.incOrder.indexOf(3)] ));

        hideMult = ts[this.incOrder.indexOf(3)];
      }

      tempLength = Math.random()*variance - (variance*0.5);

      this.targetArray[i3 + 0] = Math.sin(itterator) * (scale + tempLength);
      this.targetArray[i3 + 1] = (Math.random()*(variance) - (variance*0.5));
      this.targetArray[i3 + 2] = Math.cos(itterator) * (scale + tempLength);

      this.scaleOriginArray[i] = this.scaleArray[i];
      this.scaleTargetArray[i] = Math.random() * 2.5 + 0.2;

      if (i === this.targetDotIndex) {
        this.scaleTargetArray[i] = 2.7;
      }
      if (Math.random() > 3 * hideMult && i !== this.targetDotIndex) {
        this.scaleTargetArray[i] = 0;
      }
    }

    var slices = 1/this.clumpPoints.length;
    var ct = 0;

    var addits = [
      0,
      ((Math.PI * 2)*ts[0]),
      ((Math.PI * 2)*(ts[0] + ts[1])),
      ((Math.PI * 2)*(ts[0] + ts[1] + ts[2]))
    ];

    for (var i=0; i<this.clumpPoints.length; i++) {
      if (!this.clumpOriginPoints[i]) {
        this.clumpOriginPoints[i] = new THREE.Vector3(0,0,0);
      }
      if (!this.clumpTargetPoints[i]) {
        this.clumpTargetPoints[i] = new THREE.Vector3(0,0,0);
      }

      this.clumpOriginPoints[i].x = this.clumpPoints[i].x;
      this.clumpOriginPoints[i].y = this.clumpPoints[i].y;
      this.clumpOriginPoints[i].z = this.clumpPoints[i].z;

      this.limits[i] = 0.01 + Math.random() * 0.012;

      this.clumpTargetPoints[i].x = Math.sin( ((Math.PI * 2) * (i*slices)) * ts[ct] + addits[ct]);
      this.clumpTargetPoints[i].z = Math.cos( ((Math.PI * 2) * (i*slices)) * ts[ct] + addits[ct]);

      this.clumpTargetPoints[i].y = 0;

      ct++;
      if (ct > 3) {
        ct = 0;
      }
    }

    this.geometry.getAttribute( 'target' ).needsUpdate = true;
    this.tweenContainer.time = 0;
    this.tweenContainer.colorTime = 0;

    var speed = 1.5;

    $(document).trigger("ringForming");

    TweenMax.killTweensOf(this.camera.position);
    TweenMax.killTweensOf(this.camera.rotation);
    TweenMax.killTweensOf(this.mesh.position);

    TweenMax.to(this.mesh.rotation, 2, {x: 0.075, ease:Power2.easeInOut, onComplete:this.unpauseRing});

    TweenMax.to(this.tweenContainer, speed, {time: 1, colorTime:1, onUpdate: this.updateTime, ease: Power2.easeIn});

    TweenMax.to(this.camera.position, speed, {y: 100, x: 0, z:720, onUpdate: this.cameraLookAtCenter});

    TweenMax.to(this.camera.rotation, speed, {z: (Math.PI*2) * 0.05})

    this.tweenContainer2.time = 0;
    this.clumpCounter = 0;
    TweenMax.to(this.tweenContainer2, speed, {time: 1, ease:Power2.easeInOut});

    TweenMax.to(this.mesh.position, speed, {z: 100, ease:Power2.easeInOut});
    setTimeout(this.triggerRingPart2, speed * 1000 + 3000);
  }

  //triggers the ring animation second step where the physics engine is turned off and particles approach their resting state in the ring
  @autobind
  triggerRingPart2() {
    TweenMax.killTweensOf(this.tweenContainer);

    for (var i=0; i<this.particleCount; i++) {
      this.scaleOriginArray[i] = this.scaleArray[i];
    }

    var per = 0;
    var iper = 0;

    var per25 = this.particleCount*0.25;
    var per50 = this.particleCount*0.5;
    var per75 = this.particleCount*0.75;

    var groupSteps = [];
    var groupTotals = [];
    var groupSets = [];

    groupSteps[0] = 0;

    for(var i=0; i<4; i++){
      groupSteps[i+1] = groupSteps[i] + this.incNums[i];
    }
    if(this.incNums[3] === 0){
      groupSteps[3] = 0;
    }

    for (var i=0; i<4; i++) {
      groupTotals[groupSteps[i]] = this.percentages[groupSteps[i]].groupPercent;
      groupSets[i] = [];
      groupSets[i].push(groupTotals[groupSteps[i]]);

      for (var a=1; a<this.incNums[i]; a++) {
        groupTotals[groupSteps[i] + a] = groupTotals[ groupSteps[i] + a -1 ] + this.percentages[groupSteps[i] + a].groupPercent;
        groupSets[i].push(groupTotals[groupSteps[i] + a]);
      }
    }

    var sel = 0
    var ran = 0;
    ran = Math.round(Math.random() * 1);

    //This is where the colors are specified for the rings depending on the incIndex / current incOrder / incNums
    for (var i=0, i3=0, l=this.particleCount; i < l; i++, i3 += 3) {

      per = i / l;

      if ( per < 0.25 ) {  // blue particles set, they are the first 1/4 of the particles
        iper = (i - (0 * per25))/per25;
        //switch is based on which incOrders is selected.  this control what colors are used in each of the 1-10 slices of the pie
        //for instance if incIndex = 0 then the first 3 parts of the pie are blue, and in the case 0 we set the color based on the particles position compared to the groupTotal[0];
        //for instance if incIndex = 1 then in case 1: blue is in positions 8,9 and 10 of the pie graph
        //groupTotals is an array of percentages that total up to the 1 when looking through the whole array of groupTotals
        switch ( this.incIndex ) {
          case 0:
            if (iper < groupTotals[0]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][0][0][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][0][0][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][0][0][2];
            } else if (iper < groupTotals[1]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][0][1][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][0][1][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][0][1][2];
            } else if (iper < groupTotals[2]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][0][11][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][0][11][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][0][11][2];
            }
          break;
          case 1:
            if (iper < groupTotals[7]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][0][14][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][0][14][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][0][14][2];
            } else if (iper < groupTotals[8]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][0][16][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][0][16][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][0][16][2];
            } else if (iper < groupTotals[9]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][0][10][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][0][10][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][0][10][2];
            }
          break;
          case 2:
            if (iper < groupTotals[8]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][0][14][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][0][14][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][0][14][2];
            } else if (iper < groupTotals[9]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][0][10][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][0][10][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][0][10][2];
            }
          break;
          case 3:
            if (iper < groupTotals[3]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][0][1][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][0][1][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][0][1][2];
            } else if (iper < groupTotals[4]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][0][7][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][0][7][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][0][7][2];
            } else if (iper < groupTotals[5]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][0][11][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][0][11][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][0][11][2];
            }
          break;
          case 4:
            if (iper < groupTotals[3]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][0][11][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][0][11][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][0][11][2];
            } else if (iper < groupTotals[4]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][0][0][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][0][0][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][0][0][2];
            } else if (iper < groupTotals[5]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][0][1][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][0][1][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][0][1][2];
            }
          break;
        }
      } else if ( per < 0.5 ) {  // red particles set, they are the second 1/4 of the particles
        iper = (i - (1 * per25))/per25;
        switch ( this.incIndex ) {
          case 0:
            if (iper < groupTotals[6]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][1][10][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][1][10][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][1][10][2];
            } else if (iper < groupTotals[7]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][1][13][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][1][13][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][1][13][2];
            } else if (iper < groupTotals[8]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][1][5][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][1][5][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][1][5][2];
            } else if (iper < groupTotals[9]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][1][18][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][1][18][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][1][18][2];
            }
          break;
          case 1:
            if (iper < groupTotals[3]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][1][14][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][1][14][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][1][14][2];
            } else if (iper < groupTotals[4]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][1][15][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][1][15][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][1][15][2];
            } else if (iper < groupTotals[5]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][1][18][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][1][18][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][1][18][2];
            }
          break;
          case 2:
            if (iper < groupTotals[6]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][1][0][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][1][0][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][1][0][2];
            } else if (iper < groupTotals[7]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][1][13][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][1][13][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][1][13][2];
            }
          break;
          case 3:
            if (iper < groupTotals[8]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][1][5][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][1][5][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][1][5][2];
            } else if (iper < groupTotals[9]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][1][13][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][1][13][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][1][13][2];
            }
          break;
          case 4:
            if (iper < groupTotals[0]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][1][14][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][1][14][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][1][14][2];
            } else if (iper < groupTotals[1]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][1][18][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][1][18][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][1][18][2];
            } else if (iper < groupTotals[2]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][1][13][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][1][13][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][1][13][2];
            }
          break;
        }
      } else if ( per < 0.75 ) {  // yellow particles set, they are the third 1/4 of the particles
        iper = (i - (2 * per25))/per25;
        switch ( this.incIndex ) {
          case 0:
            if (iper < groupTotals[4]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][2][7][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][2][7][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][2][7][2];
            } else if (iper < groupTotals[5]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][2][15][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][2][15][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][2][15][2];
            }
          break;
          case 1:
            if (iper < groupTotals[0]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][2][12][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][2][12][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][2][12][2];
            } else if (iper < groupTotals[1]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][2][10][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][2][10][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][2][10][2];
            } else if (iper < groupTotals[2]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][2][6][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][2][6][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][2][6][2];
            }
          break;
          case 2:
            if (iper < groupTotals[3]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][2][10][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][2][10][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][2][10][2];
            } else if (iper < groupTotals[4]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][2][12][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][2][12][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][2][12][2];
            } else if (iper < groupTotals[5]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][2][6][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][2][6][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][2][6][2];
            }
          break;
          case 3:
            if (iper < groupTotals[6]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][2][7][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][2][7][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][2][7][2];
            } else if (iper < groupTotals[7]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][2][6][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][2][6][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][2][6][2];
            }
          break;
          case 4:
            if (iper < groupTotals[6]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][2][0][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][2][0][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][2][0][2];
            } else if (iper < groupTotals[7]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][2][7][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][2][7][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][2][7][2];
            } else if (iper < groupTotals[8]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][2][5][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][2][5][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][2][5][2];
            }
             else if (iper < groupTotals[9]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][2][14][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][2][14][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][2][14][2];
            }
          break;
        }
      } else if ( per < 1 ) { // green particles set, they are the last 1/4 of the particles
        iper = (i - (3 * per25))/per25;
        switch ( this.incIndex ) {
          case 0:
            if (iper < groupTotals[3]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][3][7][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][3][7][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][3][7][2];
            }
          break;
          case 1:
            if (iper < groupTotals[6]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][3][7][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][3][7][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][3][7][2];
            }
          break;
          case 2:
            if (iper < groupTotals[0]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][3][16][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][3][16][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][3][16][2];
            } else if (iper < groupTotals[1]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][3][14][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][3][14][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][3][14][2];
            } else if (iper < groupTotals[2]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][3][4][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][3][4][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][3][4][2];
            }
          break;
          case 3:
            if (iper < groupTotals[0]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][3][7][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][3][7][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][3][7][2];
            } else if (iper < groupTotals[1]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][3][8][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][3][8][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][3][8][2];
            } else if (iper < groupTotals[2]) {
              this.colorsTargetArray[ i3 + 0 ] = this.colors[this.colorSet][3][11][0];
              this.colorsTargetArray[ i3 + 1 ] = this.colors[this.colorSet][3][11][1];
              this.colorsTargetArray[ i3 + 2 ] = this.colors[this.colorSet][3][11][2];
            }
          break;

        }
      }
    }

    this.tweenContainer.time = 0;
    TweenMax.to(this.tweenContainer, 2, { time: 1, onUpdate: this.updateTimeAndColorTime, onComplete: this.updateTimeAndColorTime, ease: Power4.easeOut});
    this.material.uniforms[ 'mode' ].value = 1.0;

    setTimeout(this.triggerRingLabels, 1500);
    setTimeout(this.triggerResults, 8000);
  }

  //handler for the initialization of the ring labels in the ring mode
  @autobind
  triggerRingLabels() {
    $(document).trigger('ringLabels');
    for(var i=0; i<10; i++) {
      if (this.labels[i]) {
          this.labels[i].classList.toggle('hide', false);
      }
    }
    if (this.state !== SELECTORS.RINGLABELS) {
      this.state = SELECTORS.RINGLABELS;
      this.updateLabelPositions();

      this.labelAnimation();

    } else {
      this.state = SELECTORS.RING2;
    }
  }

  //called by the render loop to calculate the 2d screen coordinates of each of the ring labels
  @autobind
  updateLabelPositions() {
    var pos;
    var tot = 0;
    for (var i=0; i<10; i++) {

      pos = new THREE.Vector3(0,0,0);
      tot += this.percentages[i].percent * 0.5;
      pos.x = Math.sin((Math.PI*2) * tot) * 1.02;
      pos.z = Math.cos((Math.PI*2) * tot) * 1.02;

      pos.y = 0.1;

      this.labelVectorPositions[i] = pos;

      this.labelPositions[i] = this.toScreenPosition(pos);

      pos.x = Math.sin((Math.PI*2) * tot);
      pos.z = Math.cos((Math.PI*2) * tot);
      pos.y = 0;

      this.labelAnchorPositions[i] = this.toScreenPosition(pos);

      tot += this.percentages[i].percent * 0.5;
    }

    this.drawLabels();
  }

  //function to convert a Vector3 value into screen coordinates, used by the updateLabelPositions function
  @autobind
  toScreenPosition(vec) {
    var targetVec = this.mesh.localToWorld(vec.clone());
    targetVec.project( this.camera );
    targetVec.x =  (( targetVec.x ) * (this.windowWidth*0.5)) + (this.windowWidth * 0.5) ;
    targetVec.y =  (( targetVec.y * -1 ) * (this.windowHeight*0.5)) + (this.windowHeight * 0.5) ;
    return targetVec;
  }

  //draws/creates the actual labels in the html container
  @autobind
  drawLabels() {
    for (var i=0; i<this.labelPositions.length; i++) {
      var dot;
      var anchorDot;

      if (!this.labelDots[i]) {
        dot = document.createElement('div');
        dot.classList.add('dot');
        var anchor = document.createElement('div');
        var label = document.createElement('div');
        label.classList.add('label');
        anchor.classList.add('anchor');

        label.innerHTML = "<p>" + this.percentages[i].label + /*"<span>" + this.percentages[i].number.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,") + " comments</span>*/"</p>";
        dot.appendChild(anchor);
        dot.appendChild(label);

        this.labelDots[i] = dot;
        this.labels[i] = label;

        anchorDot = document.createElement('div');
        anchorDot.classList.add('anchor-dot');

        this.labelAnchors[i] = anchorDot;

        this.overlay.appendChild(anchorDot);

        this.overlay.appendChild(dot);
      } else {
        dot = this.labelDots[i];
        anchorDot = this.labelAnchors[i];
        label = this.labels[i];

        label.innerHTML = "<p>" + this.percentages[i].label + /*"<span>" + this.percentages[i].number.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,") + " comments</span>*/"</p>";
      }

      dot.style.top = `${this.labelPositions[i].y}px`;
      dot.style.left = `${this.labelPositions[i].x}px`;

      anchorDot.style.top = `${this.labelAnchorPositions[i].y}px`;
      anchorDot.style.left = `${this.labelAnchorPositions[i].x}px`;
    }
  }

  //trigger to animate the labels in sequentially
  @autobind
  labelAnimation() {
    var ctr = 0;
    for (var i=0; i<this.labelPositions.length; i++) {
      if (this.percentages[i].percent > 0) {
        TweenMax.to(this.labelDots[i], 0.5, {opacity: 1, delay: i * (0.3)});
        ctr++;
      }
    }
  }

  //called by a tween onUpdate event, used during the ring start transition
  @autobind
  cameraLookAtCenter(event) {
    this.camera.lookAt(new THREE.Vector3(0,-220 * this.tweenContainer.time,0));
  }

  //called by tween onUpdate events to update the time value and colorTime values in the tweenContainer object
  @autobind
  updateTimeAndColorTime(event) {
    this.updateTime();
    this.updateColorTime(event, false);
  }

  //called by a tween onUpdate used to update colors an dopacities during tweens for use by the shaders
  @autobind
  updateColorTime (event, opacity=true) {
    var r = 0;
    var g = 0;
    var b = 0;

    for (var i=0, i3=0, l=this.particleCount; i<l; i++, i3 += 3) {
      if (opacity) {
        if (this.opacityArray[i] < 1) {
          this.opacityArray[i] += 0.01;
          if (this.opacityArray[i] > 1) {
            this.opacityArray[i] = 1;
          }
        }
      }

      r = this.colorsTargetArray[i3 + 0] - this.colorsArray[i3 + 0];
      g = this.colorsTargetArray[i3 + 1] - this.colorsArray[i3 + 1];
      b = this.colorsTargetArray[i3 + 2] - this.colorsArray[i3 + 2];

      this.colorsArray[i3 + 0] += r * this.tweenContainer.colorTime;
      this.colorsArray[i3 + 1] += g * this.tweenContainer.colorTime;
      this.colorsArray[i3 + 2] += b * this.tweenContainer.colorTime;
    }

    this.material.uniforms[ 'colortime' ].value = this.tweenContainer.colorTime;
    this.material2.uniforms[ 'colortime' ].value = this.tweenContainer.colorTime;
  }

  //called by tween onUpdate events to update the time value in the buffer geometry for use by the shaders
  @autobind
  updateTime(event) {
    this.material.uniforms[ 'time' ].value = this.tweenContainer.time;
  }

  //called on a tween onComplete to set the translate array values to the targetArray values after they have been LERPed by the shader
  @autobind
  updateTranslates(event) {
    for (var i = 0, i3 = 0, l = this.particleCount; i < l; i ++, i3 += 3 ) {
      this.translateArray[ i3 + 0 ] = this.targetArray[ i3 + 0 ];
      this.translateArray[ i3 + 1 ] = this.targetArray[ i3 + 1 ];
      this.translateArray[ i3 + 2 ] = this.targetArray[ i3 + 2 ];
    }
    this.geometry.getAttribute( 'translate' ).needsUpdate = true;
    this.material.uniforms[ 'mode' ].value = 0.0;
  }
}
