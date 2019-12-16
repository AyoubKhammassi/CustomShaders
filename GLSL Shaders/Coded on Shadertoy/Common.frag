//If used on shadertoy, this code should be placed in the common section
//else, this should be included in Buffer A and Image, or copied in both.

//COMMON DEFINES
#define sRad 0.1

//THIS ARRAY OF DIRECTIONS FOR NON SPECULAR BOUNDARY CONDITIONS
const vec2[9] e = vec2[](vec2(-1.0,-1.0), vec2(-1.0,0.0),vec2(-1.0,1.0),vec2(0.0,-1.0),vec2(0.0,0.0),vec2(0.0,1.0),vec2(1.0,-1.0),vec2(1.0,0.0),vec2(1.0,1.0));

//THE PROBABILITY FOR EACH DIRECTION
const float[9] w = float[](1.0/36.0, 1.0/9.0 , 1.0/36.0 , 1.0/9.0 , 4.0/9.0, 1.0/9.0 , 1.0/36.0, 1.0/9.0 , 1.0/36.0);

const float c_precision = 512.0;
const float c_precisionp1 = c_precision + 1.0;
const float PI = 3.141592653589793238462643383279;

float pack(vec3 color)
{
	color = clamp(color, 0.0, 1.0);
	return floor(color.r * c_precision + 0.5)
		+ floor(color.b * c_precision + 0.5) * c_precisionp1
		+ floor(color.g * c_precision + 0.5) * c_precisionp1 * c_precisionp1;
}

vec3 unpack(float value) {
	vec3 color;
	color.r = mod(value, c_precisionp1) / c_precision;
	color.b = mod(floor(value / c_precisionp1), c_precisionp1) / c_precision;
	color.g = floor(value / (c_precisionp1 * c_precisionp1)) / c_precision;
	return color;
}

vec3 getSphereNormal(vec2 c,float r, vec2 p)
{
    //distance from sphere center to point p on plane
    float d = distance(c,p);
    
    //the z component of the point p projected from the plane on the sphere
    float z = sqrt(r*r - d*d);
    
    return normalize(vec3(p,z) - vec3(c,0.0));
}

void inverseDensities(float[9] den, out float[9] id)
{
	for(int i = 0; i < 9; i++)
        id[i] = den[8-i];
}

