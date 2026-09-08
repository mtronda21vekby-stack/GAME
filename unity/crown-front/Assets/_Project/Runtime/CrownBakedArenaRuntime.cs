using System;
using System.Collections.Generic;
using UnityEngine;

namespace CrownFront.Cloud
{
    public sealed class CrownBakedArenaRuntime : MonoBehaviour
    {
        public const int RequiredWidth = 1080;
        public const int RequiredHeight = 1920;
        public static readonly string[] LayerNames =
        {
            "Arena_Background",
            "Arena_TitanHull",
            "Arena_CombatDeck",
            "Arena_Foreground",
            "Arena_LightOverlay",
            "Arena_MaskOverlay"
        };

        private readonly List<SpriteRenderer> _renderers = new List<SpriteRenderer>(6);

        public IReadOnlyList<SpriteRenderer> Renderers => _renderers;

        public void Build(Transform parent)
        {
            transform.SetParent(parent, false);
            transform.localPosition = Vector3.zero;
            const float worldWidth = 19.5f;
            for (int i = 0; i < LayerNames.Length; i++)
            {
                Sprite sprite = Resources.Load<Sprite>($"CrownBakedArena/{LayerNames[i]}");
                if (sprite == null) throw new InvalidOperationException($"Missing baked arena layer: {LayerNames[i]}");
                GameObject layer = new GameObject(LayerNames[i], typeof(SpriteRenderer));
                layer.transform.SetParent(transform, false);
                layer.transform.localRotation = Quaternion.Euler(90f, 0f, 0f);
                layer.transform.localPosition = new Vector3(0f, LayerHeight(i), 0.85f);
                float scale = worldWidth / sprite.bounds.size.x;
                layer.transform.localScale = new Vector3(scale, scale, 1f);
                SpriteRenderer renderer = layer.GetComponent<SpriteRenderer>();
                renderer.sprite = sprite;
                renderer.sortingOrder = i;
                renderer.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
                renderer.receiveShadows = false;
                renderer.color = Color.white;
                _renderers.Add(renderer);
            }
        }

        private static float LayerHeight(int index)
        {
            switch (index)
            {
                case 0: return -2.6f;
                case 1: return -0.65f;
                case 2: return 1.68f;
                case 3: return 1.78f;
                case 4: return 1.82f;
                default: return 1.86f;
            }
        }
    }
}
