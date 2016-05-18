precision highp float;

uniform sampler2D map;

varying vec2 vUv;
varying vec4 vColor;
varying vec4 vColorTarget;
varying float vOpacity;
varying float vColorTime;

void main() {

	vec4 diffuseColor = texture2D( map, vUv );
	
	if ( diffuseColor.w < 0.9 ) discard;

	//vec4 tcolor = vec4(vColorTarget.r- vColor.r, vColorTarget.g - vColor.g, vColorTarget.b - vColor.b, 1.0);
	vec4 tcolor = vec4( vColor.r - vColorTarget.r,vColor.g - vColorTarget.g , vColor.b - vColorTarget.b, 1.0);
	vec4 tocolor = vec4(vColor.r + tcolor.r * vColorTime, vColor.g + tcolor.g * vColorTime, vColor.b + tcolor.b * vColorTime, 1.0);

	gl_FragColor = vec4( diffuseColor.xyz * tocolor.rgb , diffuseColor.w * vOpacity  );
	//gl_FragColor = vec4( diffuseColor.xyz * vColor.rgb , diffuseColor.w * vOpacity  );
	


}

///TODO figure out blending options so that things blend back correctly
