using UnityEngine;

namespace CrownFront
{
    public static class CrownEngineVisuals
    {
        public static Material CreateMaterial(string name, Color color, Color emission, float metallic, float smoothness)
        {
            Shader shader = Shader.Find("Standard");
            if (shader == null)
            {
                shader = Shader.Find("Universal Render Pipeline/Lit");
            }
            if (shader == null)
            {
                shader = Shader.Find("Unlit/Color");
            }

            Material material = new Material(shader)
            {
                name = name,
                enableInstancing = true
            };

            if (material.HasProperty("_Color")) material.SetColor("_Color", color);
            if (material.HasProperty("_BaseColor")) material.SetColor("_BaseColor", color);
            if (material.HasProperty("_Metallic")) material.SetFloat("_Metallic", metallic);
            if (material.HasProperty("_Glossiness")) material.SetFloat("_Glossiness", smoothness);
            if (material.HasProperty("_Smoothness")) material.SetFloat("_Smoothness", smoothness);

            if (emission.maxColorComponent > 0.001f)
            {
                material.EnableKeyword("_EMISSION");
                if (material.HasProperty("_EmissionColor")) material.SetColor("_EmissionColor", emission);
            }

            return material;
        }

        public static GameObject Primitive(
            PrimitiveType type,
            Transform parent,
            string name,
            Vector3 localPosition,
            Vector3 localScale,
            Material material,
            bool keepCollider = false,
            Vector3? localEuler = null)
        {
            GameObject go = GameObject.CreatePrimitive(type);
            go.name = name;
            go.transform.SetParent(parent, false);
            go.transform.localPosition = localPosition;
            go.transform.localScale = localScale;
            go.transform.localEulerAngles = localEuler ?? Vector3.zero;

            Renderer renderer = go.GetComponent<Renderer>();
            if (renderer != null && material != null)
            {
                renderer.sharedMaterial = material;
            }

            if (!keepCollider)
            {
                Collider collider = go.GetComponent<Collider>();
                if (collider != null)
                {
                    Object.Destroy(collider);
                }
            }

            return go;
        }

        public static Transform CreateRing(
            Transform parent,
            string name,
            float radius,
            float height,
            int segments,
            Material material,
            float segmentWidth = 0.2f)
        {
            GameObject root = new GameObject(name);
            root.transform.SetParent(parent, false);

            int count = Mathf.Max(8, segments);
            for (int i = 0; i < count; i++)
            {
                float angle = i * Mathf.PI * 2f / count;
                Vector3 position = new Vector3(Mathf.Cos(angle) * radius, height, Mathf.Sin(angle) * radius);
                GameObject segment = Primitive(
                    PrimitiveType.Cube,
                    root.transform,
                    "RingSegment",
                    position,
                    new Vector3(segmentWidth, 0.12f, radius * 0.38f),
                    material,
                    false,
                    new Vector3(0f, -angle * Mathf.Rad2Deg, 0f));
                segment.transform.localRotation *= Quaternion.Euler(0f, 90f, 0f);
            }

            return root.transform;
        }

        public static void SetLayerRecursively(GameObject root, int layer)
        {
            root.layer = layer;
            foreach (Transform child in root.transform)
            {
                SetLayerRecursively(child.gameObject, layer);
            }
        }

        public static void FaceDirection(Transform transform, Vector3 direction, float speed)
        {
            direction.y = 0f;
            if (direction.sqrMagnitude < 0.0001f) return;
            Quaternion target = Quaternion.LookRotation(direction.normalized, Vector3.up);
            transform.rotation = Quaternion.Slerp(transform.rotation, target, Mathf.Clamp01(speed * Time.deltaTime));
        }

        public static Color WithAlpha(Color color, float alpha)
        {
            color.a = alpha;
            return color;
        }
    }
}
