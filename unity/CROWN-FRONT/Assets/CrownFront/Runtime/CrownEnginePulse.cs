using UnityEngine;

namespace CrownFront
{
    public sealed class CrownEnginePulse : MonoBehaviour
    {
        private float duration;
        private float elapsed;
        private float targetScale;
        private Renderer pulseRenderer;
        private Material runtimeMaterial;

        public void Configure(Material sourceMaterial, float scale, float lifetime)
        {
            targetScale = Mathf.Max(0.2f, scale);
            duration = Mathf.Max(0.08f, lifetime);
            pulseRenderer = GetComponent<Renderer>();

            if (pulseRenderer != null && sourceMaterial != null)
            {
                runtimeMaterial = new Material(sourceMaterial);
                pulseRenderer.material = runtimeMaterial;
            }

            transform.localScale = Vector3.one * 0.08f;
        }

        private void Update()
        {
            elapsed += Time.deltaTime;
            float t = Mathf.Clamp01(elapsed / duration);
            transform.localScale = Vector3.one * Mathf.Lerp(0.08f, targetScale, 1f - Mathf.Pow(1f - t, 3f));

            if (runtimeMaterial != null)
            {
                Color color = runtimeMaterial.HasProperty("_Color") ? runtimeMaterial.GetColor("_Color") : Color.white;
                color.a = 1f - t;
                if (runtimeMaterial.HasProperty("_Color")) runtimeMaterial.SetColor("_Color", color);
                if (runtimeMaterial.HasProperty("_BaseColor")) runtimeMaterial.SetColor("_BaseColor", color);
            }

            if (t >= 1f)
            {
                if (runtimeMaterial != null) Destroy(runtimeMaterial);
                Destroy(gameObject);
            }
        }
    }
}
