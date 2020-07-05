// Darth Vader by Ayoub Khammassi
// This work is licensed under a Creative Commons Attribution-ShareAlike 4.0 International License. https://creativecommons.org/licenses/by-sa/4.0/


// comment this to control the light instead of the camera
#define control_cam
//Imperfections on the surface of the helmet
#define imperfections

//Materials initialization
const Material HELMET = Material(vec3(0.05), 0.1, 0.3, false);
const Material EYES = Material(vec3(0.1,0.0,0.0), 0.01, 0.99, false); 
const Material DETAIL = Material(vec3(1.0), 0.7, 0.8, false); 
const Material DS = Material(vec3(176.,168.,145.) / 256., 0.9, 0.1, false);

const Material SABER = Material(vec3(0.8,0.1,0.1), 0.0, 7.5, true);
const Material WHITE = Material(vec3(0.8), 0.0, 2.7, true);
const Material MOON = Material(vec3(0.8,0.1,0.1), 0.1, 7.7, true); 
 
//Vars initialized once at the start
uvec2 coord;
vec2 xyrot;
float pixelSize;

//initialized in the diffuse func and reused in the specular func
uint seeds[DIFF_SN + 1];
vec3 rands[DIFF_SN + 1];

//Camera configuration used for computing the circle of confusion for the depth of field
const float focalDist=5.0,aperature=0.04, focal=3., fieldHalfWidth=1.2;

//Main SDF
float sdHelmet(vec3 p, inout Material mat)
{
    //default mat
    mat = HELMET;
    
    //symmetric
    p.x = abs(p.x);
    
    //the final distance d, and the tmp distance for details that need different materials
    float d = HD, tmp;
    
    //Translate the world to the center of the helmet
    p+= C;
    
    
    //Transition offset
    vec3 q;
    
    // Upper helmet capsule
    {
        q = opTx(p, rotX(0.1*pi));
	    q -= vec3(0.0,0.72,1.6);
    	d = onion(sdVerticalCapsule(q,0.5, 1.05),0.03);
    }
        
    //Helmet eye curves
    {
    	q = p - vec3(0.4,0.1,0.9);
		d = opSmoothUnion(onion(sdSphere(q, .5),0.01), d, 0.01);
    }
        

	//Helmet stripe
    {
        q = p - vec3(0.0,0.65,1.8);
    	d = opUnion( d, sdHCylinder( q, 1.05, 0.06) - 0.05);
    }
    
	//Emptying the inside
    {
        q = p - vec3(0.0,-0.3,1.5);
        d = opSubtraction(sdSphere(q, 1.2), d);  
    }
    

    //Helemt ellipsoid
    {
        q = p - vec3(0.0,-1.0,1.4);
		d = opSmoothUnion( d, onion(sdEllipsoid( q, vec3(1.25,2.0,1.3) ),0.01),0.1 );
        d = max( d, -q.y -0.2*q.z + 0.1 );
    }
    
            
	//Emptying the rest of the helmet eyes
    {
    	q = p - vec3(0.35,0.1,0.92);
		d = opSubtraction(sdSphere(q, .53), d);
    }

    
    //Helmet substraction
    {
        q = opTx(p, rotX(1.4*pi));
        q-= vec3(0.3,-0.0,1.6);
    	d = opSubtraction(sdCone(q, vec2(cos(pi/8.), sin(pi/8.))), d);  
    }
    
    
    
    //FACE SDF
    
    //face sphere
    {
        q = p - vec3(0.0,0.,1.2);
        d = min(d,sdSphere(q, 0.75));
    }
    
    //eye upper bounds
    {
        q = opTx(p, rotY(-1.25*pi)*rotZ(-0.05*pi));
        q-= vec3(-0.7,0.0,-0.8);
        d= opSubtraction(sdEllipsoid( q, vec3(0.45,0.3,0.9)),d);
    }
    
    //Eyes lower bounds
    {
        q = p - vec3(0.0,-0.05,1.2);
    	d = opSmoothUnion(d, sdVCylinder( q, 0.75, 0.07), 0.1);
    }

    //face stripe
    {
        q = p - vec3(0.0,0.,1.2);
    	d = opSmoothUnion( d, sdHCylinder( q, 0.77, 0.05) , 0.1) ;
    }
    
    //face stripe details
    {
        vec3 size = vec3(0.05,0.02,0.08);
        q = p - vec3(0.0,0.22,0.4);
    	d = opSubtraction( sdEllipsoid( q, size),d);

        q.y += 0.06;
    	d = opSubtraction( sdEllipsoid( q, size),d);

        q.y += 0.06;
    	d = opSubtraction( sdEllipsoid( q, size),d);
    }
    
    //prism cheeks
    {
        q = opTx(p, rotZ(pi)*rotY(-0.08*pi)*rotX(0.1*pi));      

        q -= vec3(-0.25,0.4,0.7);
    	d = opSmoothUnion( d, sdTriPrism( q, vec2(0.25,0.3)),0.13);
    }
    
    //Middle prism
    {
        
        q = opTx(p, rotX(-0.04*pi));      
        q -= vec3(0.0,-0.45,0.47);
        
        q.y*=1.2; //flattening the prism a little bit on the y axis
		q.x*=1.0/(1.4+q.z); // makintg the prism width grow proportionally to the depth z
    	d = opSmoothUnion( d, onion(sdTriPrism( q, vec2(0.37,0.5)),0.015), 0.05);
    }
    
    //Nose
    {
        q = opTx(p, rotX(0.4*pi));      
        q -= vec3(0.0,0.3,0.2);
    	d = opSmoothUnion( d, sdVCylinder( q, 0.07,0.25), 0.1);
        
    }

    //Nose subtraction
    {
        q = opTx(p, rotX(0.55*pi));      
		//q = p;
        q -= vec3(0.0,0.1,0.4);
    	d = opSubtraction( sdVCylinder( q, 0.5,0.13), d);
        
    }
    
    //Inversed prism
    {
        q = opTx(p, rotX(-1.0*pi));      

        q -= vec3(0.0,0.74,-0.65);
        q.y *= 1.9;

    	d = opSmoothUnion( d, onion(sdTriPrism( q, vec2(0.4,0.5)),0.02), 0.05);
    }
    
    //Inversed prism subtraction    
    {
        q = opTx(p, rotX(-0.8*pi));      
        q -= vec3(0.0,0.6,-0.85);
        q.y*= 1.3;
    	d = opSubtraction( sdVCylinder( q, 0.5,0.2), d);
    }
    
    
    //Jaw lines 1
    {
        q = opTx(p, rotY(0.09*pi)*rotX(-0.04*pi));      
        q -= vec3(0.3,-0.65,0.1);
    	d = opSmoothUnion( d, sdZCapsule( q,1.2,0.025), 0.005);
    }
    
    //Jaw lines 2
    {
        q = opTx(p, rotY(0.08*pi)*rotX(-0.14*pi));      
        q -= vec3(0.3,-0.71,0.1);
    	d = opSmoothUnion( d, sdZCapsule( q,1.0,0.025), 0.005);
    }
    
  //Mouth patterns
   	{
        q = opTx(p, rotX(-0.04*pi));      

       	q -= vec3(0.0,-0.45,0.45);
        q.y*=1.2;
		q.x*=1.0/(1.4+q.z);
    		
        //the prisme is just a bound for the stripes
        q*=1.1;
       	float tmp1 = sdTriPrism( q, vec2(0.37,0.5));
            
       	//first set of stripes
        q = opTx(q, rotX(0.17*pi));      
        q-=vec3(0.06,0.0,-0.2);
        float tmp2 = sdBox(q, vec3(0.025,0.4,0.01)); 
            
        //second set of stripes
        q-=vec3(0.12,0.0,0.0);
        tmp2 = opUnion(tmp2, sdBox(q, vec3(0.025,0.4,0.01)));
        tmp1 = opIntersection(tmp1, tmp2);
		d = opSmoothUnion(d, tmp1,0.05);
     }
        
    
    //Neck capped cone
    {
        q = opTx(p, rotX(-0.11*pi));      

        q -= vec3(0.0,-1.15,1.);
    	d = opSmoothUnion( d, sdCappedCone( q,0.3, 0.85,0.52), 0.3);
    }
    
    //Keeping these for last because they assign different materials
    //inner glass sphere
    {
        q = p - vec3(0.0,0.,1.2);
        tmp = min(d,sdSphere(q, 0.65));
        if(tmp < d)
        {
            d = tmp;
            mat = EYES;
        }
    }
    
#ifdef imperfections
    float h = length(textureLod(iChannel1, vec2(0.427*p.x - 0.06*p.z, 0.331*p.y + 0.045*p.z), 2.0).xyz);
    d -=0.001*h;
#endif
    
    //DETAILS
    //nose substraction
    {
        q = p - vec3(0.0,-0.25,0.2);
        tmp = sdVerticalCapsule(q,0.1, 0.065);
        if(-tmp > d)
        {
            d = -tmp;
            mat = DETAIL;
        }
    }
    
    //detail of jaw line
    {
        q = opTx(p, rotY(0.09*pi)*rotX(-0.04*pi));      

        q -= vec3(0.3,-0.65,0.05);
    	tmp = sdZCapsule( q,0.15,0.015);
        if(tmp < d)
        {
            d = tmp;
            mat = DETAIL;
        }
    }

    return d;
}


//Death star in the background
float sdDs(vec3 p)
{
    vec3 q = p - vec3(0.0,3.0,20);
    float d = sdSphere(q, 8.0);

    q = q - vec3(5.5,5.5,-4.5);
    d = opSubtraction(sdSphere(q, 4.),d);
    return d;
}

//All lights in the scene
float sdLight(vec3 p, inout Material mat)
{
    float res,d;
    
    vec3 q = p + C;
    
    //The light saber
    q = opTx(q, rotZ(0.05*pi));
    q-= vec3(-1.0,-1.25,-0.5);
    res = sdVerticalCapsule(q, 2.5, 0.04);
    mat = SABER;

        
    //red emissive planet on the left
    {
        q = p - vec3(-100.0,0,10.0);
    	d = sdSphere(q, 50.);
    
    	if(d < res)
    	{
        	res =d;
        	mat =MOON;
    	}
    }
    
    //The emissive sphere behind the Death star
    {
    	q = p - vec3(0.0,4.5,30.0);
    	d = sdSphere(q, 11.0);
    	if(d < res)
    	{
        	res =d;
        	mat =MOON;
    	}
    }
    
    //Cylinder light that can be controlled by the user
    q = p;
    #ifndef control_cam
    q = opTx(q, rotX(xyrot.y)*rotZ(-0.5*xyrot.x));
    #endif
    q += C;
    q -= vec3(0.0,3.0,.0);

	//if(p.y < 0.0)
    {
        d = sdVCylinder(q, 2.0 ,0.1);
    
    	if(d < res)
    	{
        	res =d;
        	mat =WHITE;
    	}
    }
    
    //Repetitive emissive capsules on the right
    {
        q = p - vec3(40.0,-40.0,0.0);
        q.z = mod(p.z + 15.0, 30.0) - 15.0;
        d = sdVerticalCapsule(q, 80.0, 1.0);
    	if(d < res)
    	{
        	res =d;
        	mat =MOON;
    	}
    }

    return res;
}

//All SDFs in the scene
float scene(vec3 p, inout Material material)
{
    float res = MD;
    Material mat; //tmp material

    
    //Avoid evaluating the expensive Helmet SDF when the point is outside the Bounding sphere
    if(sdSphere((p + C - vec3(0,0,1.5)), 1.8) < HD)
    {
    	res = sdHelmet(p, material);
    }

    //All lights 
    float d = sdLight(p, mat);
    if(d < res)
    {
        res = d;
        material = mat;
    }
    
    //Death star in the background
    d = sdDs(p);
    if(d < res)
    {
        res = d;
        material = DS;
    }
    return res;
}

//Same as the scene function but without materials, used by the getNormal function
float sceneGeo(vec3 p)
{
    Material mat;
    return scene(p, mat);
}

//Estimates normals from SDFs
vec3 getNormal(vec3 p)
{
	vec3 offset = vec3(0.001,.0,.0);
	float ox = sceneGeo(p + offset.xyy) - sceneGeo(p - offset.xyy) ;
	float oy = sceneGeo(p + offset.yxy) - sceneGeo(p - offset.yxy) ;
	float oz = sceneGeo(p + offset.yyx) - sceneGeo(p - offset.yyx) ;
	
    return normalize(vec3(ox, oy, oz));
}

//###########################################################
//##################### DIFFUSE #############################
//###########################################################

//Diffuse : takes position, normal and material as input, returns diffuse color
vec3 diffuse(vec3 p,vec3 n, Material mat)
{
    vec3 col = vec3(0.0); // final diffuse contribution
    float factor = (1.0 / float(DIFF_SN));
    float d;
    Material lightMat;
    
    for(int j = 0; j <= DIFF_SN; j++)
    {
        float td = 0.0;
		seeds[j] = uint(iFrame)*coord.x + 1920U*uint(iFrame)*coord.y + (1920U*1080U)*uint(j);
		rands[j] =  (hash3( seeds[j] )  - vec3(0.5))*2.0;
        vec3 r = normalize(n + rands[j] );
        if(dot(r,n) < 0.)
            continue;
        
    	for(int i = 0; i <= LMI; i++)
    	{
        	d = sdLight(p, lightMat);
        	td+= d;
        	if(td > MD)
            {
                break;
            }
        	if(d < HD)
        	{
            	col+= factor*( mix(mat.color, lightMat.color, mat.metal) / max(1.0,td));
                break;
        	}
        	p += r*d;
    	}
    }
    return col;
}

//###########################################################
//##################### Specular ############################
//###########################################################

//Specular reflection: takes position, reflected dir and material as input, returns specular reflection color
vec3 specular(vec3 p, vec3 ref, Material mat)
{
    vec3 col = vec3(0.0); // final specular contribution
    //float factor = 1.0 / float(SPEC_SN); //since we're using one sample here, the factor is 1 and I'm removing it for optimization
    float td, d;
    Material hitMat; //the material of the object the lighting coming from
    
    for(int j = 0; j <= SPEC_SN; j++)
    {
        td = 0.0;
		vec3 offset = mat.roughness * rands[j];
        vec3 r = normalize(ref + offset);
    	for(int i = 0; i <= LMI; i++)
    	{
        	d = scene((p + HD*ref), hitMat);
        	td+= d;
        	if(td > MD)
                break;
        
        	if(d < HD)
        	{
                float intensity = (hitMat.emissive) ? (1.0 + hitMat.metal) : 1.0;
              	col+=  (intensity*hitMat.color) / max(1.0, td);
                break;
        	}
        
        	p += r*d;
    	}
    }
    return col;
}


//calculates the radius of the circle of confusion for DOF, found here www.shadertoy.com/view/Md23z1
float CircleOfConfusion(float t)
{
    t*=focal;
	return max(abs(focalDist-t)-fieldHalfWidth,0.)*aperature+pixelSize*t;
}

const float  halo = 0.1;

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    //Initialization
    coord = uvec2(fragCoord); // This is used for calculating the seed for hash functions
    
    vec2 mo = (-iResolution.xy + 2.0*iMouse.xy)/iResolution.y;
    xyrot = mo * pi;  //Used in rotating the camera/light
    
    pixelSize=2./iResolution.y/focal; //Pixel size used for computing circle of confusion

    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv =  (-iResolution.xy + 2.0*fragCoord)/iResolution.y;
    
    vec3 col = vec3(0,0,0); //color calculated at each point during the raymarching
    vec4 sCol = vec4(0.0); // stores the accumulated color from the previous ierations 
	vec3 hCol = vec3(0.0); //color of the halo around emissive materials
    
    //camera setup
    const float cam_dist = 4.0;	//how far is the camera from the center of the world
    vec3 cc = vec3(0.0,0,-cam_dist);
    vec3 ro = vec3(uv,focal - cam_dist);
    vec3 ray = normalize(ro - cc);
    
#ifdef control_cam
    //Rotate and translare camera
    mat3 crot = rotX(-0.05*xyrot.y) * rotY(0.05*xyrot.x);
    ro+=0.7*vec3(mo,0.0);
    ray = opTx(ray, crot);
    ro = opTx(ro, crot);
#endif

    //raymarching loop vars init
   	float td = 0.0, d;
    vec3 p = ro;
    Material mat;
    
    //Main raymarching loop
    for(int i = 0; i <= MI; i++)
    {
        d = scene(p, mat);
        float rCoC=CircleOfConfusion(td);//calc the radius of CoC

        if(abs(d) < rCoC)
        {
            if(!mat.emissive)
            {
            	//shading
            	vec3 normal = getNormal(p);
            	vec3 diff = diffuse(p, normal, mat);
            	vec3 spec = specular(p, reflect(normalize(ray), normal), mat);
            	col = mix(diff, spec, mat.metal);
            }
            else
            {
                col = mat.color*mat.metal;
            }
            
            //Accumulate this colors with the previous results
            float alpha=(1.0-sCol.w)* bell(-rCoC,rCoC,d);
            sCol+=vec4(col.xyz*alpha,alpha);
        }
        
        //Cheap but not so realistic Glow around emissive materials
        if(mat.emissive)
        {
            float size = (mat.metal/MAX_I) * 4.0 * rCoC;
            if(d < size && d > 0.0)
            {
                float fac = (d /size);
                vec3 nCol = mix(mat.color*2.0*(1.0 - fac), hCol, fac);
             	hCol= mix(hCol ,  nCol, length(nCol));
            }
        }
        
        uint seed = uint(iFrame)*coord.x + 1920U*uint(iFrame)*coord.y + (1920U*1080U)*uint(i);
        d=max(d-0.5*rCoC,0.5*rCoC)*hash1(seed);

        p += ray*d;
        td+= d;
        if(td > MD || sCol.w > 0.9) 
        {
            break;
        }
    }

    //final color is accumulated color +  emissive materials halo color
	col = sCol.xyz + hCol;

    if(iMouse.z > 0.0)
    {
        //reset when clicking
        fragColor = vec4(col, 0.0);
    }
    else
    {
        //accumulate this sample with previous ones
        vec4 prev = texelFetch(iChannel0, ivec2(fragCoord), 0);
        fragColor = vec4(mix(prev.xyz, col, 1.0 / (prev.w + 1.0)),prev.w + 1.0);
    }
}