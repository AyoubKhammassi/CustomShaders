
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 resolution;
uniform float time;
uniform sampler2D blurNoise;
uniform vec2 touch;

bool inSquare(vec2 pos, vec2 center, float x, float y)
{
	float dx =sqrt(0.5 * x*x) ;
	float dy = sqrt(.5 * y*y) ;
	vec2 p = pos - center;
	return (length(p) < (x)&& (abs(p.x) < dx)&& (abs(p.y) < dy) );

}
void main(void) {
	float mx = max(resolution.x, resolution.y);
	vec3 color = vec3(.0);
	vec2 uv = gl_FragCoord.xy / mx;
	vec2 center = resolution / mx * 0.5;
	float t = time * 10.0;
	vec3 rand = texture(blurNoise, uv).xyz;
	float wavines = (rand.x *0.1/distance(uv, center)*0.2 +.35);
	float test = sin(t-wavines*distance(uv,center) * 1000.0) ;
	if(test >.9)
		color=vec3(1.0);

	
	if(inSquare(uv, center,.3,.2))
		color = 1.0 - color;
	//else
		//color = vec3(0.0);

	gl_FragColor = vec4(color,1.0);
}
