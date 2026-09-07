using System;
using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.SceneManagement;

namespace CrownFront.Editor
{
    public static class CrownQuaterniusGalleryCapture
    {
        private const int Width = 1600;
        private const int Height = 900;
        private const int Columns = 4;
        private const int Rows = 2;
        private const float CellWidth = 4.2f;
        private const float CellDepth = 4.6f;
        private const float TargetHeight = 2.75f;

        private static readonly string[] UnitModels =
        {
            "CrownArt/Quaternius/UltimateSpace/Mech",
            "CrownArt/Quaternius/UltimateSpace/Mech_4UvIHxnoSR",
            "CrownArt/Quaternius/UltimateSpace/Mech_D5wW2jDO42",
            "CrownArt/Quaternius/UltimateSpace/Mech_o3Ps8z8ByP",
            "CrownArt/Quaternius/UltimateSpace/Enemy_Flying",
            "CrownArt/Quaternius/UltimateSpace/Enemy_Large",
            "CrownArt/Quaternius/UltimateSpace/Enemy_Small",
            "CrownArt/Quaternius/UltimateSpace/Astronaut",
            "CrownArt/Quaternius/UltimateSpace/Astronaut_0D54W8yfrA",
            "CrownArt/Quaternius/UltimateSpace/Astronaut_OgeSH89Nmx",
            "CrownArt/Quaternius/SciFiEssentials/Enemy_EyeDrone",
            "CrownArt/Quaternius/SciFiEssentials/Enemy_QuadShell",
            "CrownArt/Quaternius/SciFiEssentials/Enemy_Trilobite",
        };

        private static readonly string[] StructureModels =
        {
            "CrownArt/Quaternius/UltimateSpace/Base_Large",
            "CrownArt/Quaternius/UltimateSpace/Building_L",
            "CrownArt/Quaternius/UltimateSpace/Connector",
            "CrownArt/Quaternius/UltimateSpace/Geodesic_Dome",
            "CrownArt/Quaternius/UltimateSpace/Metal_Support",
            "CrownArt/Quaternius/UltimateSpace/House_Long",
            "CrownArt/Quaternius/UltimateSpace/House_Open",
            "CrownArt/Quaternius/UltimateSpace/House_Pod",
            "CrownArt/Quaternius/UltimateSpace/House_Single",
            "CrownArt/Quaternius/UltimateSpace/Pickup_Crate",
            "CrownArt/Quaternius/SciFiEssentials/Prop_Chest",
            "CrownArt/Quaternius/SciFiEssentials/Prop_Crate_Large",
            "CrownArt/Quaternius/SciFiEssentials/Prop_Locker",
            "CrownArt/Quaternius/SciFiEssentials/Prop_SatelliteDish",
        };

        private static readonly string[] WeaponAndShipModels =
        {
            "CrownArt/Quaternius/SciFiEssentials/Gun_Pistol",
            "CrownArt/Quaternius/SciFiEssentials/Gun_Revolver",
            "CrownArt/Quaternius/SciFiEssentials/Gun_Rifle",
            "CrownArt/Quaternius/SciFiEssentials/Gun_Sniper",
            "CrownArt/Quaternius/UltimateSpace/Spaceship",
            "CrownArt/Quaternius/UltimateSpace/Spaceship_Jqfed124pQ",
            "CrownArt/Quaternius/UltimateSpace/Spaceship_VSxUAFhzbA",
            "CrownArt/Quaternius/UltimateSpace/Spaceship_u105mYHLHU",
            "CrownArt/Quaternius/SciFiEssentials/Prop_Mine",
            "CrownArt/Quaternius/SciFiEssentials/Prop_Ammo",
            "CrownArt/Quaternius/SciFiEssentials/Prop_HealthPack",
        };

        public static bool CaptureIfAvailable()
        {
            string missing = FindMissingResource(UnitModels) ??
                             FindMissingResource(StructureModels) ??
                             FindMissingResource(WeaponAndShipModels);
            if (!string.IsNullOrEmpty(missing))
            {
                Debug.LogWarning($"Quaternius gallery skipped because the review kit is not imported yet: Resources/{missing}");
                return false;
            }

            CaptureAll();
            return true;
        }

        private static string FindMissingResource(IReadOnlyList<string> resources)
        {
            for (int i = 0; i < resources.Count; i++)
            {
                if (Resources.Load<GameObject>(resources[i]) == null) return resources[i];
            }
            return null;
        }

        [MenuItem("CROWN FRONT/Art Reboot/Capture Quaternius Gallery")]
        public static void CaptureAll()
        {
            string directory = Path.GetFullPath(Path.Combine(
                Application.dataPath,
                "..",
                "..",
                "..",
                "VisualReview",
                "QuaterniusGallery"));
            if (Directory.Exists(directory)) Directory.Delete(directory, true);
            Directory.CreateDirectory(directory);

            List<string> manifest = new List<string>
            {
                "CROWN//FRONT Quaternius Unity gallery",
                "Each page uses normalized visual height and identical Unity lighting.",
                string.Empty,
            };

            CaptureCategory(directory, "units", UnitModels, manifest);
            CaptureCategory(directory, "structures", StructureModels, manifest);
            CaptureCategory(directory, "weapons_ships", WeaponAndShipModels, manifest);

            File.WriteAllLines(Path.Combine(directory, "GALLERY_ORDER.txt"), manifest);
            AssetDatabase.Refresh();
            Debug.Log($"Quaternius Unity gallery captured at {directory}");
        }

        private static void CaptureCategory(
            string directory,
            string category,
            IReadOnlyList<string> resources,
            List<string> manifest)
        {
            int pageSize = Columns * Rows;
            int pages = Mathf.CeilToInt(resources.Count / (float)pageSize);
            for (int page = 0; page < pages; page++)
            {
                Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
                SetupEnvironment(out Camera camera);

                manifest.Add($"[{category} page {page + 1}]");
                int first = page * pageSize;
                int last = Mathf.Min(resources.Count, first + pageSize);
                for (int index = first; index < last; index++)
                {
                    int local = index - first;
                    int column = local % Columns;
                    int row = local / Columns;
                    float x = (column - (Columns - 1) * 0.5f) * CellWidth;
                    float z = (row - (Rows - 1) * 0.5f) * CellDepth;
                    GameObject holder = InstantiateNormalized(resources[index], new Vector3(x, 0f, z));
                    holder.name = $"{local + 1:00} // {Path.GetFileName(resources[index])}";
                    manifest.Add($"{local + 1:00}: {resources[index]}");
                }
                manifest.Add(string.Empty);

                string fileName = $"quaternius_{category}_{page + 1:00}.png";
                Texture2D image = Render(camera, Width, Height);
                File.WriteAllBytes(Path.Combine(directory, fileName), image.EncodeToPNG());
                UnityEngine.Object.DestroyImmediate(image);
                EditorSceneManager.CloseScene(scene, true);
            }
        }

        private static void SetupEnvironment(out Camera camera)
        {
            RenderSettings.ambientMode = AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color(0.38f, 0.43f, 0.52f);
            RenderSettings.ambientEquatorColor = new Color(0.18f, 0.21f, 0.26f);
            RenderSettings.ambientGroundColor = new Color(0.07f, 0.08f, 0.11f);
            RenderSettings.fog = false;

            GameObject cameraObject = new GameObject("Gallery Camera");
            camera = cameraObject.AddComponent<Camera>();
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(0.025f, 0.032f, 0.045f);
            camera.fieldOfView = 34f;
            camera.nearClipPlane = 0.05f;
            camera.farClipPlane = 100f;
            camera.transform.position = new Vector3(0f, 9.2f, -13.8f);
            camera.transform.LookAt(new Vector3(0f, 1.15f, 0f));

            GameObject keyObject = new GameObject("Gallery Key");
            Light key = keyObject.AddComponent<Light>();
            key.type = LightType.Directional;
            key.intensity = 1.15f;
            key.color = new Color(0.82f, 0.90f, 1f);
            key.transform.rotation = Quaternion.Euler(42f, -32f, -8f);

            CreatePointLight("Gallery Fill", new Vector3(-7f, 6f, -4f), 5.5f, 20f, new Color(0.20f, 0.48f, 1f));
            CreatePointLight("Gallery Rim", new Vector3(7f, 5f, 3f), 5.2f, 18f, new Color(1f, 0.28f, 0.08f));

            GameObject floor = GameObject.CreatePrimitive(PrimitiveType.Plane);
            floor.name = "Gallery Floor";
            floor.transform.localScale = new Vector3(2.2f, 1f, 1.8f);
            Renderer renderer = floor.GetComponent<Renderer>();
            Shader shader = Shader.Find("CrownFront/EngineSurface") ??
                            Shader.Find("Standard") ??
                            Shader.Find("Universal Render Pipeline/Lit");
            if (shader != null)
            {
                Material material = new Material(shader) { name = "Gallery Floor Material" };
                Color color = new Color(0.035f, 0.045f, 0.065f);
                if (material.HasProperty("_Color")) material.SetColor("_Color", color);
                if (material.HasProperty("_BaseColor")) material.SetColor("_BaseColor", color);
                if (material.HasProperty("_Metallic")) material.SetFloat("_Metallic", 0.75f);
                if (material.HasProperty("_Glossiness")) material.SetFloat("_Glossiness", 0.38f);
                if (material.HasProperty("_Smoothness")) material.SetFloat("_Smoothness", 0.38f);
                renderer.sharedMaterial = material;
            }
        }

        private static void CreatePointLight(string name, Vector3 position, float intensity, float range, Color color)
        {
            GameObject lightObject = new GameObject(name);
            lightObject.transform.position = position;
            Light light = lightObject.AddComponent<Light>();
            light.type = LightType.Point;
            light.intensity = intensity;
            light.range = range;
            light.color = color;
            light.shadows = LightShadows.None;
        }

        private static GameObject InstantiateNormalized(string resourcePath, Vector3 position)
        {
            GameObject prefab = Resources.Load<GameObject>(resourcePath);
            if (prefab == null)
            {
                throw new InvalidOperationException($"Quaternius gallery model is missing: Resources/{resourcePath}");
            }

            GameObject holder = new GameObject("Gallery Model Holder");
            holder.transform.position = position;
            GameObject model = UnityEngine.Object.Instantiate(prefab, holder.transform, false);
            model.name = Path.GetFileName(resourcePath);

            Renderer[] renderers = model.GetComponentsInChildren<Renderer>(true);
            if (renderers.Length == 0)
            {
                throw new InvalidOperationException($"Quaternius model has no renderers: {resourcePath}");
            }

            Bounds bounds = renderers[0].bounds;
            for (int i = 1; i < renderers.Length; i++) bounds.Encapsulate(renderers[i].bounds);
            float height = Mathf.Max(bounds.size.y, 0.001f);
            float scale = TargetHeight / height;
            model.transform.localScale = Vector3.one * scale;

            bounds = renderers[0].bounds;
            for (int i = 1; i < renderers.Length; i++) bounds.Encapsulate(renderers[i].bounds);
            Vector3 centerLocal = holder.transform.InverseTransformPoint(bounds.center);
            float bottomLocal = holder.transform.InverseTransformPoint(new Vector3(bounds.center.x, bounds.min.y, bounds.center.z)).y;
            model.transform.localPosition -= new Vector3(centerLocal.x, bottomLocal, centerLocal.z);

            Collider[] colliders = model.GetComponentsInChildren<Collider>(true);
            for (int i = 0; i < colliders.Length; i++) UnityEngine.Object.DestroyImmediate(colliders[i]);
            return holder;
        }

        private static Texture2D Render(Camera camera, int width, int height)
        {
            RenderTexture target = new RenderTexture(width, height, 24, RenderTextureFormat.ARGB32);
            Texture2D image = new Texture2D(width, height, TextureFormat.RGB24, false);
            RenderTexture previous = RenderTexture.active;
            RenderTexture previousTarget = camera.targetTexture;
            float previousAspect = camera.aspect;

            camera.targetTexture = target;
            camera.aspect = width / (float)height;
            camera.Render();
            RenderTexture.active = target;
            image.ReadPixels(new Rect(0, 0, width, height), 0, 0);
            image.Apply(false, false);

            camera.targetTexture = previousTarget;
            camera.aspect = previousAspect;
            RenderTexture.active = previous;
            UnityEngine.Object.DestroyImmediate(target);
            return image;
        }
    }
}
