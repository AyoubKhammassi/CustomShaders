#define T(i) texture(iChannel0, i)
#define rotSpeed 0.2
#define blue vec3(50.0, 129.0, 168.0)/255.0
#define yellow  vec3(179.0, 101.0, 0.0)/255.0

const float thickness = 0.5;

//estimating the  normal by calculating the neghibor cells density difference from the current cell
vec3 getNormal(vec2 uv)
{
	vec2 o = vec2(1.0) / iResolution.xy;
    float d = T(uv).w;// this cell calculated density
    vec2 n2d = vec2(0.0);
    for(int i = 0; i < 9; i++)
        n2d += e[i] * (T(uv + (e[i]/iResolution.xy)).w - d);
    
    return normalize(vec3(n2d, d*thickness));
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    //Normalized UVs
    vec2 uv = fragCoord / iResolution.xy;
	
    //Final output colot
    vec4 col;

    //possible final color
    vec3 pCol = blue; //Light Blue

    //COLORING THE FLUID
    //Normals from densities
    vec3  n=getNormal(uv);
    //getting ambient light from cube map
    pCol*= texture(iChannel1, n).xyz;
	
    
    //COLORING THE SPHERE
    vec2 c = iMouse.xy /iResolution.y;
    vec2 pos = fragCoord/iResolution.y;

    float rad = sRad + 0.01;
    if(distance(pos, c) <= rad)
    {
        //Normals from sphere
        n = getSphereNormal(c,rad, pos);
        pCol = vec3(133.0, 149.0, 158.0)/255.0;
        //pCol = vec3(163.0, 146.0, 36.0)/255.0;
        
        //sphere dirt and reflection
        float offset = iTime*rotSpeed*2.0*PI;
        vec3 s = texture(iChannel1,n + vec3(sin(offset),cos(offset),0.0)).xyz;
        vec3 ref = texture(iChannel2, abs(n + vec3(c,0.0)).yxz).xyz;
        pCol*=pow(s.x,.7)*ref;
    }
    
    //SPECULAR LIGHTING
    vec3 light = normalize(vec3(2,1.0,2));
    float diff=clamp(dot(n,light),0.5,1.0);
    float spec=clamp(dot(reflect(light,n),vec3(0,0,-1)),0.0,1.0);
    spec=pow(spec,20.0)*2.5;
	col = vec4(pCol,1.0)*vec4(diff)+vec4(spec);
    
    //fragColor=vec4(n,1);//testing normals

    fragColor = col;
}