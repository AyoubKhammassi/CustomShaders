Shader "Coded/VolumeFiller"
{
    Properties
    {
		_TexA("Texture A", 2D) = "white" {}
		_ColorA("Color A" ,Color) = (0,0,0,0)

		_TexB ("Texture B", 2D) = "white" {}
		_ColorB("Color B" ,Color) = (0,0,0,0)

		_Value("Lerping Value", Range(0.0,1.0)) = 0.5

    }
    SubShader
    {
        Tags 
		{ 
			"RenderType"="Transparent"
			"Queue" = "Transparent"
			"DisableBatching" = "true"

		}
        LOD 100
		Blend SrcAlpha OneMinusSrcAlpha
        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag

            #include "UnityCG.cginc"

            struct appdata
            {
                float4 vertex : POSITION;
                float2 uv : TEXCOORD0;
            };

            struct v2f
            {
                float2 uv : TEXCOORD0;
                UNITY_FOG_COORDS(1)
                float4 vertex : SV_POSITION;
            };

            sampler2D _TexA;
            float4 _TexA_ST;
			float4 _ColorA;

			sampler2D _TexB;
			float4 _TexB_ST;
			float4 _ColorB;

			float _Value;


            v2f vert (appdata v)
            {
                v2f o;
                o.vertex = UnityObjectToClipPos(v.vertex);
                o.uv = TRANSFORM_TEX(v.uv, _TexA);
                return o;
            }

            fixed4 frag (v2f i) : SV_Target
            {
				fixed4 col;
				
				if (i.uv.y > _Value)
				{
					col = tex2D(_TexA, i.uv);
					col *= _ColorA;
				}
				else
				{
					col = tex2D(_TexB, i.uv);
					col *= _ColorB;
				}
                return col;
            }
            ENDCG
        }
    }
}
