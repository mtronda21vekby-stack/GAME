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

            if (Shader.Find("CrownFront/RuntimeUI") == null)
            {
                throw new InvalidOperationException("CrownFront/RuntimeUI shader was not imported.");
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

            Debug.Log("CROWN//FRONT visual rebirth validation PASS: surface/UI shaders, source scan, scene root, and serialized components are valid.");
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
            string output = Path.Combine(directory, "CROWN_FRONT_0.4.0-menu-baked-review-match-start.png");
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
            CrownMenuBakedBattleValidation.RunRuntimeFlowSmoke();
        }

        private static void Require(bool condition, string message)
        {
            if (!condition) throw new InvalidOperationException(message);
        }
    }
}
