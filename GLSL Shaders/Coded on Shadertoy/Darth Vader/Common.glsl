//Main Raymarching loop params, max distance, hit distance, and max iterations
#define MD 300.0
#define HD 0.001
#define MI 120

//SDF Center
#define C vec3(0,-0.2,0.0)

//Light Setup
#define ambient vec3(0.1,0.0,0.0)
//for emissive materials, maximum intensity
#define MAX_I 10.0

//Diffuse setup: Number of samples per pixel
#define DIFF_SN 5

//Specular setup: Number of samples per pixel
#define SPEC_SN 1  //how many samples from each pixel


//Maximum iterations and maximum distance when raymarching bouncing light rays
#define LMI 50
#define LMD 100.0

#define pi 3.141592653589

struct Material
{
    vec3 color; //Diffuse coolor
    float roughness; //roughness controls two params for specular caclculations 
    float metal; //controls how metallic is this material/ if this is an emissive material, we use this as the internsity
    bool emissive; //emits light or not
    
};

    
//####################################################################
//##################### SDF PRIMITIVES ###############################
//####################################################################
//Source: iquilezles.org/www/articles/distfunctions/distfunctions.htm
//####################################################################
//####################################################################
float sdSphere( vec3 p, float s )
{
  return length(p)-s;
}

float sdBox( vec3 p, vec3 b )
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

float sdCylinder( vec3 p, vec3 c )
{
  return length(p.xz-c.xy)-c.z;
}

float sdTriPrism( vec3 p, vec2 h )
{
  vec3 q = abs(p);
  return max(q.z-h.y,max(q.x*0.866025+p.y*0.5,-p.y)-h.x*0.5);
}

float sdCone( vec3 p, vec2 c )
{
  // c is the sin/cos of the angle
  float q = length(p.xy);
  return dot(c,vec2(q,p.z));
}

float sdVerticalCapsule( vec3 p, float h, float r )
{
  p.y -= clamp( p.y, 0.0, h );
  return length( p ) - r;
}

//same as above, it just creates a capsules on the Z axis, to avoid using rotations
float sdZCapsule( vec3 p, float h, float r )
{
  p.z -= clamp( p.z, 0.0, h );
  return length( p ) - r;
}

float dot2(in vec2 v ) { return dot(v,v); }
float dot2(in vec3 v ) { return dot(v,v); }

float sdCappedCone( in vec3 p, in float h, in float r1, in float r2 )
{
    vec2 q = vec2( length(p.xz), p.y );
    
    vec2 k1 = vec2(r2,h);
    vec2 k2 = vec2(r2-r1,2.0*h);
    vec2 ca = vec2(q.x-min(q.x,(q.y < 0.0)?r1:r2), abs(q.y)-h);
    vec2 cb = q - k1 + k2*clamp( dot(k1-q,k2)/dot2(k2), 0.0, 1.0 );
    float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
    return s*sqrt( min(dot2(ca),dot2(cb)) );
}

float sdHCylinder( vec3 p, float h, float r )
{
  vec2 d = abs(vec2(length(p.yz),p.x)) - vec2(h,r);
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float sdVCylinder( vec3 p, float h, float r )
{
  vec2 d = abs(vec2(length(p.xz),p.y)) - vec2(h,r);
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float sdEllipsoid( vec3 p, vec3 r )
{
  float k0 = length(p/r);
  float k1 = length(p/(r*r));
  return k0*(k0-1.0)/k1;
}



//####################################################################
//##################### SDF COMBINATIONS #############################
//####################################################################
//Source: iquilezles.org/www/articles/distfunctions/distfunctions.htm
//####################################################################
//####################################################################
float opUnion( float d1, float d2 )
{
    return min(d1,d2);
}

float opSubtraction( float d1, float d2 )
{
    return max(-d1,d2);
}

float opIntersection( float d1, float d2 )
{
    return max(d1,d2);
}

float opSmoothUnion( float d1, float d2, float k )
{
    float h = max(k-abs(d1-d2),0.0);
    return min(d1, d2) - h*h*0.25/k;
}

float opSmoothSubtraction( float d1, float d2, float k )
{
    float h = max(k-abs(-d1-d2),0.0);
    return max(-d1, d2) + h*h*0.25/k;
}

float opSmoothIntersection( float d1, float d2, float k )
{
    float h = max(k-abs(d1-d2),0.0);
    return max(d1, d2) + h*h*0.25/k;
}

float onion( in float d, in float h )
{
    return abs(d)-h;
}


//####################################################################
//##################### TRANSFORMATIONS ##############################
//####################################################################
vec3 opTx( in vec3 p, in mat3 t)
{
    return ( inverse(t)*p );
}
mat3 rotX(float a)
{ return mat3(vec3(1.0,0,0),vec3(0,cos(a),sin(a)),vec3(0, -sin(a), cos(a))); }

mat3 rotY(float a)
{ return mat3(vec3(cos(a),0,-sin(a)),vec3(0,1.0,0),vec3(sin(a),0, cos(a))); }

mat3 rotZ(float a)
{ return mat3(vec3(cos(a),sin(a),0),vec3(-sin(a), cos(a), 0), vec3(0,0,1.0)); }


mat3 rot(float x, float y, float z) { return rotX(x)* rotY(y)* rotZ(z); }


//####################################################################
//##################### HASH FUNCTIONS ###############################
//####################################################################
//############ Source: www.shadertoy.com/view/llGSzw #################
//####################################################################
//####################################################################
float hash1( uint n ) 
{
    // integer hash copied from Hugo Elias
	n = (n << 13U) ^ n;
    n = n * (n * n * 15731U + 789221U) + 1376312589U;
    return float( n & uvec3(0x7fffffffU))/float(0x7fffffff);
}
vec3 hash3( uint n ) 
{
    // integer hash copied from Hugo Elias
	n = (n << 13U) ^ n;
    n = n * (n * n * 15731U + 789221U) + 1376312589U;
    uvec3 k = n * uvec3(n,n*16807U,n*48271U);
    return vec3( k & uvec3(0x7fffffffU))/float(0x7fffffff);
}


//####################################################################
//##################### HELPER FUNCTIONS #############################
//####################################################################
float bell(float a, float b, float t)
{
	t=2.*clamp((t-a)/(b-a),0.,1.)-1.;
	return pow(1.-t*t,3.0);
}

float saturate(float a){return clamp(a, 0.0,1.0);}

