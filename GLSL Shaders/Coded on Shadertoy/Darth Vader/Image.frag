void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec3 col = texelFetch(iChannel0, ivec2(fragCoord), 0).xyz;
    fragColor = vec4(col, 1.0);
}