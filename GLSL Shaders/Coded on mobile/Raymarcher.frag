#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

#define MAX_STEP 200
#define MAX_DIST 20.0
#define HIT .03
#define LIGHT 5.0



uniform vec2 resolution;
uniform vec2 touch;
uniform vec3 pointers[10] ;
uniform sampler2D RMBG;
uniform sampler2D paper;
uniform sampler2D blurNoise;
uniform float time;
//vec3 lastro = vec3(0.0,0.0,0.0);


// signed distance for sphere
float sdSphere(vec3 p, vec3 center, float radius)
{
	return distance(p,center) -radius;
}

float sdCube(vec3 p, vec3 center, vec3 boundaries)
{
	return length(max(abs(p-center)-boundaries , 0.0));
}

float distanceField(vec3 p)
{
	float y = sin(time)*0.5 + 0.5 ;
	vec3 center = vec3(.0,y,10.0);

	float ground = sdCube(p, vec3(.0,-2.2,10.0),vec3(y*5.0 + 1.0,.1/(y+0.1),y*5.0 + 1.0));

	float s = sdSphere(p, center, 1.0) ;

	return min(ground, s) ;
}



vec3 getNormal(vec3 p)
{
	vec3 offset = vec3(0.001,.0,.0);
	float ox = distanceField(p + offset.xyy) - distanceField(p - offset.xyy) ;
	float oy = distanceField(p + offset.yxy) - distanceField(p - offset.yxy) ;
	float oz = distanceField(p + offset.yyx) - distanceField(p - offset.yyx) ;

	return normalize(vec3(ox, oy, oz)) ;
}
vec3 raymarch(vec3 ro, vec3 rd, vec2 mapuv)
{

	//light setting
	vec3 lo = vec3(2.0,2.0,-1.0);
	//light direction
	vec3 ld = vec3(0.0,0.0,1.0) - lo;
	//light color
	vec3 lc = vec3(.1,.1,.6);
	vec3 bg = texture2D(RMBG, mapuv).xyz;

	float t =.0;
	int s = 0;
	float d;
	while(s <= MAX_STEP)
	{
		s++;
		if(t > MAX_DIST || s == MAX_STEP)
		{

			return bg;
		}

		vec3 p= ro + t*rd;
		d = distanceField(p) ;
		if(d <= HIT)
		{
			float y = sin(time)*0.5 + 0.5 ;
			float lightDistance = length(p-lo) ;
			vec3 n = getNormal(p) ;
			//return vec3( ,0.0,0.0);
			//vec2 mpuv = (p.y > -2.0)? p.xy: p.yz;

			vec3 col = texture2D(paper, p.xy- vec2(0.0,y) ).xyz;
			return  col*lc*(LIGHT*dot(ld, - n)/lightDistance);
		}

		t+=d;
	}
}


void main(void) {

	float mx = max(resolution.x, resolution.y) ;
	vec2 aspect = resolution.xy/mx;
	vec2 mapuv = ( gl_FragCoord.xy/mx);
	vec2 uv = mapuv - vec2(.25,.5);

	vec2 cen = vec2(0.0,0.0);

	//camera
	//vec3 ro = vec3(0.0,0.0,0.0);
	//camera movement
	//vec2 cm = pointers[1].xy- pointers[0].xy;
	//lastro += vec3(cm/ resolution.xy, 0.0);
	vec3 ro = vec3(touch/resolution.x    , 0.0);

	vec3 rd = vec3(uv.x, uv.y, 1.0);

	vec3 col = raymarch(ro,rd, mapuv);


	gl_FragColor = vec4(col, 1.0);
}
