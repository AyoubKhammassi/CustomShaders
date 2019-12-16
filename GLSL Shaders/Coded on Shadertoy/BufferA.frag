//cells are initialized with this value
const float initDen = 10000.0;
const float ifv = 0.4; //inflow condition velocity: the x component of the imposed velocity U


//const vec2[9] e = vec2[](vec2(-1.0,-1.0), vec2(-1.0,0.0),vec2(-1.0,1.0),vec2(0.0,-1.0),vec2(0.0,0.0),vec2(0.0,1.0),vec2(1.0,-1.0),vec2(1.0,0.0),vec2(1.0,1.0));


vec3 bc = vec3 (0.0,.0,1.);

int invInd(int i) { return (8-i);}

//Get the boundaries (non fluid cells)
bool isBoundary(vec2 pos)
{
    pos /= iResolution.y;
    bool res = false;
    vec2 c = iMouse.xy /iResolution.y;//vec2(1.1, 0.5);
    c = vec2(c.x, c.y);
    float r = sRad;
    
    //Circle 
    if(distance(pos, c) <= r)
        return true;
    //top and bottom
    if((pos.y <= 0.001) || (pos.y >= .999))
        return true;
}

//fills the densities array with densities from neighbor cells
//estimates each cell's color : NOT USED IN FINAL OUTPUT
void getValues(in vec2 pos, out float[9] d, out float rho, out vec2 u, out vec3 col)
{
    vec2 dx = vec2(1.0) / iResolution.xy;
	float p;
    vec4 frag;
    col = vec3(0.0);
    rho = 0.0;
    u = vec2(0.0);
    
    
    //color estimation variables
    //float mxDen = 0.0; //maximum density to specify which color to take
    //float colNorm = 0.0; //color normalizer
    
    
    //inflow condition variables
    float[3] rhos; //density of each row

    vec2 t = pos * iResolution.xy;
    for(int i = 0; i < 9; i++)
    {
        vec2 np = pos + dx*e[i]; //normalized position of neighbor cell, with origin in the left bottom corner
        vec2 pp = np * iResolution.xy; //position of the neghbor cell in pixels, used for boundary detection
        int id = invInd(i);
        frag = texture(iChannel0, np);

		p = frag[id/3];
      	d[i] = unpack(p)[id%3]; //old density
        
        //OUTFLOW CONDITION
        if(pos.x >= iResolution.x && i >= 6)
        {
            d[i] = d[id]; //copy the values from the previous row
        }
        
        //INFLOW CONDITION
        rhos[i/3] += d[i];
        
        // summing the velocity u by adding the density mutplied by the direction it came from
        u += d[i] * e[id];
        
        //estimating the cell color
        /*if(!isBoundary(pp))
        {
            col  += d[i] * unpack(frag.w);
            colNorm += d[i];
        }*/
           
    }
    
    //INFLOW CONDITION UNCOMMENT FOR USING INFLOW
    if(pos.x <= 0.001)// first vertical line of cells doesn't have access to left densities 0,1 and 2, so we estimate them by imposing an inflow velocity
        rho = (rhos[1] + 2.0*rhos[2]) / (1.0 - ifv); 
    else
	    rho = rhos[0] + rhos[1] + rhos[2];
    
    
    u /= rho; //normalizing the velocity
    
	//col /=colNorm; //Normlizing the col
}

//Set all the values in a vec4
void setValues(in float[9] d,in float rho,in vec3 col, out vec4 p)
{
    p.x = pack(vec3(d[0],d[1],d[2])); //left row of densities
    p.y = pack(vec3(d[3],d[4],d[5])); // middle row
    p.z = pack(vec3(d[6],d[7],d[8])); // right row
    //p.w = pack(col);//For testing
    p.w = rho;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    //Normalized UVs
    vec2 uv = fragCoord / iResolution.xy;
	
    //populations are initialized or not
    bool init = (iFrame != 0);
	
    //Final output, xyz contains the 9 number densities packed and w contains the RGB conponents of the color/the density RHO
    vec4 o = vec4(0.0);
    
    if(!init) //INITIALIZATION
    {

        if(!isBoundary(fragCoord))
        {
            //Initializing the center of each cell with initDen
			o.y = pack(vec3(.0,initDen,.0));
        }
    }
    else
    {
        	float[9] den; //neighbor densities

        	float rho; //microscopic density
        	vec2 u; //microscopiv velocity (non thermal)
        	vec3 col;
        	getValues(uv, den, rho, u, col);
			
        	if(!isBoundary(fragCoord))
            {
            	float usqr = (3.0 / 2.0)  * (u.x*u.x + u.y*u.y);
	        	float eu;
    	    	float[9] eq; //equilibrium density
        		for(int i = 0; i < 9; i++)
        		{
            		eu = 3.0*dot(e[i],u);
            		eq[i] = rho*w[i]*(1.0 + eu + 0.5*eu*eu - usqr);
            
            		//streaming
            		den[i] =den[i] + (eq[i] - den[i]);
 		        }
           	}
            else
            {
                //If this is a boundary, no need to calulate anything, just store the desnities from neighbor fluid cells
                col = bc;
                rho = 0.0;
            }
       	
        //pack densities and rho (col for testing) in the final fragment output
         setValues(den, rho,col, o);
     
    }
    fragColor = o;
}