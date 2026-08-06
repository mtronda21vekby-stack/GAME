using System;
using System.IO;
using System.Reflection;
using CrownFront.Cloud;
using UnityEditor;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace CrownFront.Editor
{
    public static class CrownVisualRebirthValidation
    {
        private static readonly string RuntimeRoot = Path.Combine("Assets", "_Project", "Runtime");

        [MenuItem("CROWN FRONT/Review/Validate Visual Rebirth")]
        public static void ValidateForBuild()
        {
            string[] forbidden =
            {
                "REACTOR " + "DORMANT",
                "REACTOR " + "OFFLINE",
                "ORDER // " + "DEPLOY A SQUAD",
                "DEPLOY " + "TO LANE",
                "P" + "USH",
                "H" + "OLD",
                "F" + "LANK"
            };

            foreach (string path in Directory.GetFiles(RuntimeRoot, "*.*", SearchOption.AllDirectories))
            {
                if (!path.EndsWith(".cs", StringComparison.OrdinalIgnoreCase) &&
                    !path.EndsWith(".shader", StringComparison.OrdinalIgnoreCase)) continue;

                string source = File.ReadAllText(path);
                foreach (string token in forbidden)
                {
                    if (source.IndexOf(token, StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        throw new InvalidOperationException($"Obsolete center-HUD token found in {path}.");
                    }
                }
            }

            if (Shader.Find("CrownFront/EngineSurface") == null)
            {
                throw new InvalidOperationException("CrownFront/EngineSurface shader was not imported.");
            }

            Scene scene = SceneManager.GetActiveScene();
            CrownEngineGame game = UnityEngine.Object.FindAnyObjectByType<CrownEngineGame>();
            if (!scene.IsValid() || game == null)
            {
                throw new InvalidOperationException("Generated shipping scene does not contain CrownEngineGame.");
            }

            Component[] components = scene.GetRootGameObjects()[0].GetComponentsInChildren<Component>(true);
            for (int i = 0; i < components.Length; i++)
            {
                if (components[i] == null)
                {
                    throw new InvalidOperationException("Generated shipping scene contains a missing script reference.");
                }
            }

            Debug.Log("CROWN//FRONT visual rebirth validation PASS: shader, source scan, scene root, and serialized components are valid.");
        }

        [MenuItem("CROWN FRONT/Review/Capture Gameplay Frames")]
        public static void CaptureGameplayFrames()
        {
            CrownEngineCloudBuild.RebuildPrototypeScene();
            CrownEngineGame game = UnityEngine.Object.FindAnyObjectByType<CrownEngineGame>();
            MethodInfo awake = typeof(CrownEngineGame).GetMethod("Awake", BindingFlags.Instance | BindingFlags.NonPublic);
            if (game == null || awake == null) throw new InvalidOperationException("Unable to initialize Crown Engine presentation for capture.");
            awake.Invoke(game, null);

            Camera camera = Camera.main;
            if (camera == null) throw new InvalidOperationException("Visual rebirth camera was not created.");

            const int width = 540;
            const int height = 960;
            RenderTexture target = new RenderTexture(width, height, 24, RenderTextureFormat.ARGB32);
            Texture2D image = new Texture2D(width, height, TextureFormat.RGB24, false);
            RenderTexture previous = RenderTexture.active;
            camera.targetTexture = target;
            camera.aspect = width / (float)height;
            camera.Render();
            RenderTexture.active = target;
            image.ReadPixels(new Rect(0, 0, width, height), 0, 0);
            image.Apply();

            string directory = Path.GetFullPath(Path.Combine(Application.dataPath, "..", "..", "..", "VisualReview"));
            Directory.CreateDirectory(directory);
            string output = Path.Combine(directory, "CROWN_FRONT_0.3.0-alpha.3_match-start.png");
            File.WriteAllBytes(output, image.EncodeToPNG());

            camera.targetTexture = null;
            RenderTexture.active = previous;
            UnityEngine.Object.DestroyImmediate(target);
            UnityEngine.Object.DestroyImmediate(image);
            Debug.Log($"CROWN//FRONT visual review frame captured: {output}");
        }

        [MenuItem("CROWN FRONT/Review/Run Presentation Smoke Checks")]
        public static void RunPresentationSmokeChecks()
        {
            CrownEngineCloudBuild.RebuildPrototypeScene();
            CrownEngineGame game = UnityEngine.Object.FindAnyObjectByType<CrownEngineGame>();
            MethodInfo awake = typeof(CrownEngineGame).GetMethod("Awake", BindingFlags.Instance | BindingFlags.NonPublic);
            if (game == null || awake == null) throw new InvalidOperationException("Shipping runtime root is unavailable.");
            awake.Invoke(game, null);

            CrownBuilding[] buildings = UnityEngine.Object.FindObjectsByType<CrownBuilding>(FindObjectsInactive.Include);
            CrownUnit[] units = UnityEngine.Object.FindObjectsByType<CrownUnit>(FindObjectsInactive.Include);
            CrownProjectile[] projectiles = UnityEngine.Object.FindObjectsByType<CrownProjectile>(FindObjectsInactive.Include);
            CrownImpact[] impacts = UnityEngine.Object.FindObjectsByType<CrownImpact>(FindObjectsInactive.Include);
            CrownUnitPresentation[] unitPresentation = UnityEngine.Object.FindObjectsByType<CrownUnitPresentation>(FindObjectsInactive.Include);
            CrownBuildingPresentation[] buildingPresentation = UnityEngine.Object.FindObjectsByType<CrownBuildingPresentation>(FindObjectsInactive.Include);
            Renderer[] activeRenderers = UnityEngine.Object.FindObjectsByType<Renderer>(FindObjectsInactive.Exclude);
            ParticleSystem[] particleSystems = UnityEngine.Object.FindObjectsByType<ParticleSystem>(FindObjectsInactive.Include);

            Require(buildings.Length == 8, $"Expected 8 gameplay buildings, found {buildings.Length}.");
            Require(units.Length == 2, $"Expected two opening units, found {units.Length}.");
            Require(unitPresentation.Length == units.Length, "Every gameplay unit must own a separate presentation component.");
            Require(buildingPresentation.Length == buildings.Length, "Every gameplay building must own a separate presentation component.");
            Require(projectiles.Length == 64, $"Expected 64 prewarmed projectiles, found {projectiles.Length}.");
            Require(impacts.Length == 72, $"Expected 72 prewarmed impacts, found {impacts.Length}.");
            Require(game.SharedMaterialCount == 11, $"Expected 11 shared instanced materials, found {game.SharedMaterialCount}.");
            Require(game.RealtimeLightCount == 1, $"Expected exactly one realtime light, found {game.RealtimeLightCount}.");

            Component[] components = UnityEngine.Object.FindObjectsByType<Component>(FindObjectsInactive.Include);
            for (int i = 0; i < components.Length; i++) Require(components[i] != null, "Runtime hierarchy contains a missing component.");

            Debug.Log($"CROWN//FRONT presentation smoke PASS: 8 buildings, 2 opening units, 136 pooled VFX objects, 11 shared materials, 1 realtime light, {activeRenderers.Length} active renderers at match start, {particleSystems.Length} ParticleSystems, no missing runtime components.");
        }

        private static void Require(bool condition, string message)
        {
            if (!condition) throw new InvalidOperationException(message);
        }
    }
}
