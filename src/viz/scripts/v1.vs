precision highp float;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

attribute vec3 position;
attribute vec3 target;
attribute vec2 uv;
attribute vec3 normal;

attribute vec3 translate;
attribute vec3 velocity;
attribute float scale;
attribute float opacity;
attribute vec3 color;
attribute vec3 colortarget;

uniform float mode;
uniform float time;
uniform float colortime;

varying vec2 vUv;
varying vec4 vColor;
varying vec4 vColorTarget;
varying float vOpacity;
varying float vColorTime;


vec4 calcMode1(vec3 origin, vec3 target, float percent) {
	vec4 rtPosition = mix(vec4(origin, 1.0), vec4( target, 1.0), percent);
	return rtPosition;
}

void main() {
	vec4 mvPosition;

	if (mode == 1.0){ //lerp to target

		mvPosition = modelViewMatrix * calcMode1 (translate, target, time);
	} else {
		mvPosition = modelViewMatrix * vec4( translate, 1.0 );
	}

	mvPosition.xyz += position * scale;

	vUv = uv;
	vColor = vec4 (color, opacity);
	vColorTarget = vec4(colortarget, opacity);
	vOpacity = opacity;
	vColorTime = colortime;

	gl_Position = projectionMatrix * mvPosition;

}