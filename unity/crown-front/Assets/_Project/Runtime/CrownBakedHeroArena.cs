using System;
using System.Collections.Generic;
using UnityEngine;

namespace CrownFront.Cloud
{
    [DefaultExecutionOrder(900)]
    public sealed class CrownBakedHeroArena : MonoBehaviour
    {
        private const string ResourceRoot = "CrownBakedArena/";

        private static readonly LayerDefinition[] Layers =
        {
            new LayerDefinition("Arena_Background", 0, BlendMode.Opaque),
            new LayerDefinition("Arena_TitanHull", 10, BlendMode.Opaque),
            new LayerDefinition("Arena_CombatDeck", 20, BlendMode.Opaque),
            new LayerDefinition("Arena_Foreground", 40, BlendMode.Alpha),
            new LayerDefinition("Arena_LightOverlay", 50, BlendMode.Additive),
            new LayerDefinition("Arena_MaskOverlay", 60, BlendMode.Alpha)
        };

        private readonly List<GameObject> _spawnedLayers = new List<GameObject>(Layers.Length);
        private bool _applied;

        public bool IsReady { get; private set; }
        public IReadOnlyList<string> MissingResources => _missingResources;

        private readonly List<string> _missingResources = new List<string>();

        private void Start()
        {
            ApplyNow();
        }

        public void ApplyNow()
        {
            if (_applied) return;
            _applied = true;

            _missingResources.Clear();
            Dictionary<string, Sprite> sprites = new Dictionary<string, Sprite>(Layers.Length);
            for (int i = 0; i < Layers.Length; i++)
            {
                LayerDefinition definition = Layers[i];
                Sprite sprite = Resources.Load<Sprite>(ResourceRoot + definition.ResourceName);
                if (sprite == null)
                {
                    _missingResources.Add(definition.ResourceName);
                    continue;
                }
                sprites[definition.ResourceName] = sprite;
            }

            if (_missingResources.Count > 0)
            {
                IsReady = false;
                Debug.LogWarning(
                    "CROWN//FRONT baked hero arena is not ready. Missing Resources: " +
                    string.Join(", ", _missingResources));
                enabled = false;
                return;
            }

            Transform root = new GameObject("BAKED HERO ARENA // PRESENTATION ROOT").transform;
            root.SetParent(transform, false);

            for (int i = 0; i < Layers.Length; i++)
            {
                LayerDefinition definition = Layers[i];
                GameObject layerObject = new GameObject(definition.ResourceName);
                layerObject.transform.SetParent(root, false);
                layerObject.transform.localPosition = new Vector3(0f, 0f, definition.SortingOrder * 0.001f);

                SpriteRenderer renderer = layerObject.AddComponent<SpriteRenderer>();
                renderer.sprite = sprites[definition.ResourceName];
                renderer.sortingOrder = definition.SortingOrder;
                renderer.sharedMaterial = ResolveMaterial(definition.BlendMode);
                renderer.drawMode = SpriteDrawMode.Simple;

                _spawnedLayers.Add(layerObject);
            }

            ConfigureCamera();
            IsReady = true;
            Debug.Log("CROWN//FRONT baked 2.5D hero arena presentation loaded successfully.");
        }

        private static Material ResolveMaterial(BlendMode mode)
        {
            Shader shader;
            switch (mode)
            {
                case BlendMode.Additive:
                    shader = Shader.Find("Sprites/Default");
                    break;
                case BlendMode.Alpha:
                    shader = Shader.Find("Sprites/Default");
                    break;
                default:
                    shader = Shader.Find("Sprites/Default");
                    break;
            }

            if (shader == null)
            {
                throw new InvalidOperationException("Sprites/Default shader is required for baked arena presentation.");
            }

            Material material = new Material(shader)
            {
                name = "CROWN BAKED ARENA // " + mode,
                enableInstancing = true
            };
            return material;
        }

        private static void ConfigureCamera()
        {
            Camera camera = Camera.main;
            if (camera == null) return;

            camera.orthographic = true;
            camera.orthographicSize = 9.6f;
            camera.transform.position = new Vector3(0f, 0f, -10f);
            camera.transform.rotation = Quaternion.identity;
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(0.003f, 0.006f, 0.012f, 1f);
        }

        private enum BlendMode
        {
            Opaque,
            Alpha,
            Additive
        }

        private readonly struct LayerDefinition
        {
            public LayerDefinition(string resourceName, int sortingOrder, BlendMode blendMode)
            {
                ResourceName = resourceName;
                SortingOrder = sortingOrder;
                BlendMode = blendMode;
            }

            public string ResourceName { get; }
            public int SortingOrder { get; }
            public BlendMode BlendMode { get; }
        }
    }
}
