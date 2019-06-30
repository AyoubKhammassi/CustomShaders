#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 resolution;
uniform float time;

void main(void) {
	float mx = max(resolution.x, resolution.y) ;
	vec2 uv = gl_FragCoord.xy / mx ;
	vec3 bg = vec3(0.0);
	vec3 color = bg;

	//restricting the animation only a circle in the center of the screen
	vec2 center = vec2(.25,.5)  ;
	float radius =.15;
	float incentercircle = distance(uv, center) - radius ;
	if(incentercircle <.0)
	{
		float fillingspeed =.006;
		//first wave params
		float speed =2.0;
		float amp =.012;
		float xfactor =.05;
		float yoffset = amp *sin(time*speed +uv.x/xfactor );
		if(0.37+ fillingspeed*time+yoffset > uv.y)
	 		color = vec3(1.0,0.5,0.5);

	 	//second wave params
		speed =1.5;
		amp =.016;
		yoffset =0.005+  amp *sin(3.0 + time*speed +uv.x/xfactor );
		if(0.37+ fillingspeed*time+yoffset > uv.y)
	 		color = vec3(1.0,0.6,0.6);
	}
	gl_FragColor = vec4(color , 1.0);
}