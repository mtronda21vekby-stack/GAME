Shader "CrownFront/EngineSurface"
{
    Properties
    {
        _Color ("Surface Color", Color) = (0.2, 0.24, 0.3, 1)
        _EmissionColor ("Energy Color", Color) = (0, 0, 0, 1)
        _Metallic ("Metallic", Range(0, 1)) = 0.5
        _Smoothness ("Smoothness", Range(0, 1)) = 0.5
    }

    SubShader
    {
        Tags { "RenderType"="Opaque" "Queue"="Geometry" }
        LOD 120

        Pass
        {
            Tags { "LightMode"="ForwardBase" }
            Cull Back
            ZWrite On

            CGPROGRAM
            #pragma target 2.0
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_fwdbase
            #pragma multi_compile_fog
            #pragma multi_compile_instancing

            #include "UnityCG.cginc"
            #include "Lighting.cginc"

            UNITY_INSTANCING_BUFFER_START(CrownProps)
                UNITY_DEFINE_INSTANCED_PROP(fixed4, _Color)
                UNITY_DEFINE_INSTANCED_PROP(fixed4, _EmissionColor)
                UNITY_DEFINE_INSTANCED_PROP(half, _Metallic)
                UNITY_DEFINE_INSTANCED_PROP(half, _Smoothness)
            UNITY_INSTANCING_BUFFER_END(CrownProps)

            struct appdata
            {
                float4 vertex : POSITION;
                float3 normal : NORMAL;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct v2f
            {
                float4 position : SV_POSITION;
                half3 worldNormal : TEXCOORD0;
                half3 viewDirection : TEXCOORD1;
                UNITY_FOG_COORDS(2)
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            v2f vert(appdata input)
            {
                v2f output;
                UNITY_SETUP_INSTANCE_ID(input);
                UNITY_TRANSFER_INSTANCE_ID(input, output);
                output.position = UnityObjectToClipPos(input.vertex);
                float3 worldPosition = mul(unity_ObjectToWorld, input.vertex).xyz;
                output.worldNormal = UnityObjectToWorldNormal(input.normal);
                output.viewDirection = _WorldSpaceCameraPos.xyz - worldPosition;
                UNITY_TRANSFER_FOG(output, output.position);
                return output;
            }

            fixed4 frag(v2f input) : SV_Target
            {
                UNITY_SETUP_INSTANCE_ID(input);
                fixed4 surface = UNITY_ACCESS_INSTANCED_PROP(CrownProps, _Color);
                fixed3 emission = UNITY_ACCESS_INSTANCED_PROP(CrownProps, _EmissionColor).rgb;
                half metallic = UNITY_ACCESS_INSTANCED_PROP(CrownProps, _Metallic);
                half smoothness = UNITY_ACCESS_INSTANCED_PROP(CrownProps, _Smoothness);

                half3 normal = normalize(input.worldNormal);
                half3 lightDirection = normalize(_WorldSpaceLightPos0.xyz);
                half diffuse = saturate(dot(normal, lightDirection));
                half stepped = floor(diffuse * 3.0h + 0.5h) / 3.0h;
                half rim = pow(1.0h - saturate(dot(normal, normalize(input.viewDirection))), lerp(3.5h, 1.8h, smoothness));
                fixed3 coldAmbient = fixed3(0.10h, 0.14h, 0.20h);
                fixed3 lit = surface.rgb * (coldAmbient + _LightColor0.rgb * (0.30h + stepped * 0.70h));
                lit += surface.rgb * rim * (0.10h + metallic * 0.16h);
                lit += emission;
                fixed4 color = fixed4(lit, 1.0h);
                UNITY_APPLY_FOG(input.fogCoord, color);
                return color;
            }
            ENDCG
        }
    }

    Fallback "Legacy Shaders/Diffuse"
}
