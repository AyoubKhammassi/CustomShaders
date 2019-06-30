#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 resolution;
uniform sampler2D background;
uniform float time;
uniform sampler2D noise;
uniform sampler2D rainbow;
void main(void) {

	//choosing the maximum of the resolution coordinates
	// to make sure that everything is not squished
	float mx = max (resolution.x, resolution.y) ;
	vec2 uv = gl_FragCoord.xy /mx;

	//used green colors
	vec3 lgreen = vec3 (0.1568627, 1.0, 0.627451);//light green
	vec3 dgreen= vec3(0.1568627,0.643137, 0.627451);// dark green

	//final fragment color
	vec3 color = vec3(0.0);
	// background color
	vec3 bg = vec3(0.0);


	//main circle
	//other circles rotate around this one
	vec2 mcc = vec2(.25, .6); // main circle center, fixed
	float mcr =.03; //main circle radius, fixed

	float stickiness =.01;
	float culling =.145; //the radius of the circle that culling the rotating circle

	//the whole animation happen in just a portion of the screen
	//therefore, any fragments that happen to be out of this portion
	//should be eliminated, alongside the parts that we want to cull
	//the centre circle culling should be done first
	//otherwise a bunch of calculations will be done for nothing


	//test if fragment Is in the main circle
	float inmc = distance(mcc, uv) -culling ;
	bool inborders = (uv.x < mcc.x + culling+.05) &&(uv.x > mcc.x - culling- .05) &&(uv.y < mcc.y +culling+.02) ;
	if(inmc >0.0 && inborders)
	{

	//bottom circle, origin of bubbles
	vec2 bottomc = vec2(.25,-.07);
	float bottomr =.1;
	float inbottomc = distance(bottomc, uv) - bottomr;
	if(inbottomc<0.0)
	color = lgreen;


	float bubblesylimit =.5;
	float inbubbles[10];
	if(uv.y < bubblesylimit)
	{
	//bubble circles going from the bottom towards the rotating circles
	const int nbubbles = 10;
	vec2 bubbles[nbubbles];
	vec2 brl = vec2(.03,.0005); //max and min of bubbles radius
	vec2 bsl = vec2(.05,.2);//max and min speed for the bubbles
	for(int j=1; j <= nbubbles ; j++)
		{
			float jndex=float(j) / float(nbubbles) ;
			float r = texture2D(noise, vec2(jndex + 3.0)).x;
			float bs = mix(bsl.x, bsl.y,r*3.0);
			float divider = 1.0 +r*10.0* mod(bs*time,0.5/jndex) ;
			float br = mix(brl.x, brl.y,r*2.0)  / divider;
			vec3 bc = mix(lgreen, dgreen, r*2.0) ;
			float xoffset = (mod(float(j), 2.0) ==0.0)? -0.005: 0.005;
				float xcoord= .25 + jndex *xoffset ;

			bubbles[j] =  vec2(xcoord ,mod(bs*time,.5 / jndex)); //bubble center

			inbubbles[j]=distance(bubbles[j], uv) - br;
			if(inbubbles[j]<0.0)
				color= bc;

			if(inbubbles[j]+inbottomc < stickiness  || inbubbles[j]+inmc < stickiness*1.5 )
				color = bc;
		}
	}


	// rotating circles with different speeds
	vec2 circles[6]; //circles centers
	float offsets[6]; //offset of each circle
	float radius[6]; //radius of each
	float speed = 1.3;
	//initializing speeds
	offsets[0] =200.0;
	offsets[1] = 45.0;
	offsets[2] = 90.0;
	offsets[3] =120.0;
	offsets[4] =180.0;
	offsets[5] = 60.0;
	//initializing radius
	radius[0] =.1245;
	radius[1] =.1255;
	radius[2] =.127;
	radius[3] =.1235;
	radius[4] =.1278;
	radius[5] =.1299;

	for(int i=0; i<6; i++)
	{
		// a variable that ping pongs from - 1 to 1 with a specific speed
		float xo= mcr*(sin(speed *time + offsets[i] ) ) ;
		float yo= mcr*(cos(speed *time + offsets[i] ) ) ;
		circles[i] = vec2(mcc.x + xo,  mcc.y +yo) ;
		float index = float(i+1) /10.0 ;



		//test if fragment Is in the  circle
		float inc = distance(circles[i], uv) -radius[i];
		vec3 bufcolor = mix(lgreen, dgreen, index) ;
		if(inc < 0.0)
			color = bufcolor;

		/*if(uv.y < bubblesylimit && uv.y > bubblesylimit - 0.1)
		{
		//sticky bubbles with rotating circles
		for(int j = 0; j<10;j++)
		{

			if(inbubbles[j]+inc < stickiness )
				color = bufcolor;
		}
		}*/
	}
	}
	gl_FragColor = vec4(color , 1.0);
}


