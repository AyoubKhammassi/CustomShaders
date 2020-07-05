//An abstract raymarching shader of a black hole absorbing light and terrain.
//If you want a nice experience put this music in the background 
//www.youtube.com/watch?v=q86g1aop6a8&list=RDq86g1aop6a8&start_radio=1
//and put the shader in full-screen mode.



#define rot_speed  0.03
#define PI 3.14159265359

#define hole_c vec2(0.0)
#define hole_d 0.3


//RAYMARCHING VARS
#define MAX_STEPS 200
#define MAX_DIST 70.0
#define HIT 0.001

//LIGHT PARAMS
#define light_p vec3(0,-15.0,-20.0)
#define light_c vec3(255,160,90)/vec3(255)

//CAMERA SETUP
#define fov 1.0
#define cam_speed 0.3


float light_intensity(){return 0.7*pow(sin(0.4*iTime),2.0);}

vec3 background(vec2 uv)
{
    vec3 res;
    //Distance to blackhole
    float dist =distance(uv, hole_c);
    //Normalized distance
	float test = dist / hole_d;
    float rsf = smoothstep(test,0.5,0.7);
    //Create rotation matrix
    float step = mod(iTime * rot_speed - 2.0*rsf, 2.0*PI);
    mat2 rot = mat2(vec2(cos(step),sin(step)),vec2(-sin(step),cos(step)));
    vec2 suvs = uv - hole_c;
    suvs*= rot;
    
	res = vec3(texture(iChannel1, suvs).x);
    
    if(test< 1.0 && test > 0.95) //balck hole border
    {
        res += exp(light_c * test);
    }
    else if(test < 0.95) //black hole inner
    {
        res = smoothstep(0.13*test,0.0,0.1)*light_c;
    }
    else // glow
    {
        res+=exp(1.5+light_intensity()-test)*light_c; 
    }
       
    return res;
}

float terrainSDF(vec3 p)
{
    float sdetails =0.5*(texture(iChannel0, (0.1*p.xz) + vec2(0.4)).x);
    float bdetails =6.0*(texture(iChannel0, (0.01*p.xz) + vec2(0.8)).x);
    float curve = p.x / 8.0;
    return (p.y +2.0  - pow(abs(curve),1.8) + sdetails + bdetails);
}

vec3 getNormal(vec3 p)
{
	vec3 offset = vec3(0.01,.0,.0);
	float ox = terrainSDF(p + offset.xyy) - terrainSDF(p - offset.xyy) ;
	float oy = terrainSDF(p + offset.yxy) - terrainSDF(p - offset.yxy) ;
	float oz = terrainSDF(p + offset.yyx) - terrainSDF(p - offset.yyx) ;

	return normalize(vec3(ox, oy, oz)) ;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
       	
    // Normalized pixel coordinates
    vec2 uv = (fragCoord - 0.5*iResolution.xy)/iResolution.y;
    //FINAL COLOR
    vec3 color = background(uv);
    
    //RAYMARCHING ALGORITHM
   	float td = 0.0;
    float d = 0.0;
    
    //Camera setup
    float za = iTime*cam_speed; //animated z coordinate of the camera
    vec3 p = vec3(uv, za);
    vec3 co = vec3(0.0,-0.1 ,za-fov);
    
    //use this if you want the cam to be close to terrain and avoid colliding with it
    //checking how far the camera is to the terrain
    /*d = terrainSDF(co + vec3(0,-2.0,1.0));
    if(d <= HIT)
    {
        p-=vec3(0,d,0);
        co-=vec3(0,d,0);
    }*/
    
    vec3 dir = normalize(p - co);
    
    //Raymarching loop
    for(int i = 0; i <= MAX_STEPS; i++)
    {
        d = terrainSDF(p);
        td+=d;
        p += dir*d;
        if(td >= MAX_DIST)
        {
            break;
        }

        if(d < HIT)
        {
            vec3 n = getNormal(p);
            //LIGHT
            float diffuse = 6.0*dot((normalize(p - light_p)), n) ;
            color = light_intensity()  + diffuse * light_c;
            color*= texture(iChannel1, 0.3*p.xz).xyz;
            break;
        }
    }
    //POST Processing the whole image
    color*=light_c;
    color+=vec3(0.07,0,0);
    fragColor = vec4(color, 1.0);
}