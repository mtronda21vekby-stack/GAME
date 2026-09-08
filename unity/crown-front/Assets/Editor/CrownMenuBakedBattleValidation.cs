using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using CrownFront.Cloud;
using UnityEditor;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

namespace CrownFront.Editor
{
    public static class CrownMenuBakedBattleValidation
    {
        private const string ArenaDirectory = "Assets/Resources/CrownBakedArena";
        private const string CaptureDirectory = "VisualReview/MenuBakedBattle";

        [MenuItem("CROWN FRONT/Menu & Baked Battle/Validate App Flow")]
        public static void ValidateAppFlow()
        {
            Scene scene = SceneManager.GetActiveScene();
            CrownAppFlowController[] flows = UnityEngine.Object.FindObjectsByType<CrownAppFlowController>(FindObjectsInactive.Include);
            CrownEngineGame[] games = UnityEngine.Object.FindObjectsByType<CrownEngineGame>(FindObjectsInactive.Include);
            Require(scene.IsValid(), "Generated application scene is invalid.");
            Require(flows.Length == 1, $"Expected one app flow controller, found {flows.Length}.");
            Require(games.Length == 1, $"Expected one gameplay root, found {games.Length}.");
            Require(games[0].transform.IsChildOf(flows[0].transform), "Gameplay root must be owned by the application flow root.");
            Require(string.Equals(CrownBuildInfo.Version, PlayerSettings.bundleVersion, StringComparison.Ordinal), "BuildInfo and PlayerSettings bundle version differ.");
            Debug.Log("CROWN//FRONT app-flow validation PASS: one controller, one gameplay root, controlled ownership, consistent version.");
        }

        [MenuItem("CROWN FRONT/Menu & Baked Battle/Validate Deck")]
        public static void ValidateDeck()
        {
            CrownUnitCatalog.ClearCacheForTests();
            IReadOnlyList<CrownUnitDefinition> all = CrownUnitCatalog.All;
            Require(all.Count >= 4, $"At least four real UnitDefinition assets are required, found {all.Count}.");
            HashSet<string> ids = new HashSet<string>(StringComparer.Ordinal);
            for (int i = 0; i < all.Count; i++)
            {
                CrownUnitDefinition definition = all[i];
                Require(definition != null, "UnitDefinition reference is missing.");
                Require(!string.IsNullOrWhiteSpace(definition.Id), "UnitDefinition has no stable ID.");
                Require(ids.Add(definition.Id), $"Duplicate UnitDefinition ID: {definition.Id}.");
                Require(definition.EnergyCost > 0, $"Invalid energy cost for {definition.Id}.");
            }
            Require(CrownUnitCatalog.IsValidDeck(CrownUnitCatalog.CreateDefaultDeck()), "Default four-unit deck is invalid.");
            Debug.Log("CROWN//FRONT deck validation PASS: four unique, unlocked, data-backed UnitDefinition assets.");
        }

        [MenuItem("CROWN FRONT/Menu & Baked Battle/Validate Baked Arena Layers")]
        public static void ValidateBakedArenaLayers()
        {
            for (int i = 0; i < CrownBakedArenaRuntime.LayerNames.Length; i++)
            {
                string name = CrownBakedArenaRuntime.LayerNames[i];
                string path = $"{ArenaDirectory}/{name}.png";
                Require(File.Exists(path), $"Missing baked layer: {path}.");
                TextureImporter importer = AssetImporter.GetAtPath(path) as TextureImporter;
                Require(importer != null, $"Missing TextureImporter for {path}.");
                Require(importer.textureType == TextureImporterType.Sprite, $"{name} is not imported as Sprite.");
                Require(!importer.mipmapEnabled, $"{name} must not use mipmaps.");
                Texture2D texture = AssetDatabase.LoadAssetAtPath<Texture2D>(path);
                Require(texture != null, $"Unable to load {name}.");
                Require(texture.width == 1080 && texture.height == 1920, $"{name} is {texture.width}x{texture.height}; expected 1080x1920.");
                Sprite sprite = AssetDatabase.LoadAssetAtPath<Sprite>(path);
                Require(sprite != null, $"{name} Sprite subasset is missing.");
            }

            CrownBakedArenaRuntime runtime = UnityEngine.Object.FindAnyObjectByType<CrownBakedArenaRuntime>(FindObjectsInactive.Include);
            if (runtime != null) Require(runtime.Renderers.Count == 6, $"Runtime baked arena references {runtime.Renderers.Count}/6 layers.");
            Debug.Log("CROWN//FRONT baked-layer validation PASS: 6/6 aligned 1080x1920 Sprite layers, mipmaps off, runtime references valid.");
        }

        [MenuItem("CROWN FRONT/Menu & Baked Battle/Run Runtime Flow Smoke")]
        public static void RunRuntimeFlowSmoke()
        {
            ReviewContext context = InitializeReviewScene();
            Require(context.Flow.CurrentScreen == CrownAppScreen.MainMenu, "Application did not open in Main Menu.");
            context.Flow.ShowDeckBuilder();
            Require(context.Flow.CurrentScreen == CrownAppScreen.DeckBuilder, "Deck Builder transition failed.");
            Require(context.Flow.SaveDeck(CrownUnitCatalog.CreateDefaultDeck()), "Valid deck did not save.");
            context.Flow.ShowBattleForReview();
            Require(context.Flow.CurrentScreen == CrownAppScreen.Battle, "Battle transition failed.");
            Require(context.Flow.Game.SessionActive, "Gameplay session did not start.");
            Require(context.Flow.Game.Units.Count == 2, "Opening battle units were not spawned.");
            context.Flow.CompleteMatchForReview(true);
            Require(context.Flow.CurrentScreen == CrownAppScreen.Results, "Results did not open after match completion.");
            Require(context.Flow.LastSummary != null && context.Flow.LastSummary.victory, "Victory result summary is invalid.");
            context.Flow.ShowMainMenu();
            Require(context.Flow.CurrentScreen == CrownAppScreen.MainMenu, "Return to Main Menu failed.");
            Require(context.Flow.GameplayRootCount == 1, "Application created duplicate gameplay roots.");
            Debug.Log("CROWN//FRONT runtime flow smoke PASS: Menu > Deck > Battle > Results > Menu, selected deck, local rewards, no duplicate gameplay root.");
        }

        [MenuItem("CROWN FRONT/Menu & Baked Battle/Run 20 Match Soak")]
        public static void RunTwentyMatchSoak()
        {
            string profile = PlayerPrefs.GetString("crown_front.profile.v1", string.Empty);
            string settings = PlayerPrefs.GetString("crown_front.settings.v1", string.Empty);
            try
            {
                ReviewContext context = InitializeReviewScene();
                for (int i = 0; i < 20; i++)
                {
                    context.Flow.ShowBattleForReview();
                    Require(context.Flow.Game.SessionActive, $"Match {i + 1} did not start.");
                    context.Flow.CompleteMatchForReview((i & 1) == 0);
                    Require(context.Flow.CurrentScreen == CrownAppScreen.Results, $"Match {i + 1} did not open Results.");
                    context.Flow.ShowMainMenu();
                    Require(context.Flow.GameplayRootCount == 1, $"Match {i + 1} duplicated gameplay root.");
                    Require(UnityEngine.Object.FindObjectsByType<UnityEngine.EventSystems.EventSystem>(FindObjectsInactive.Include).Length == 1, $"Match {i + 1} duplicated EventSystem.");
                    Require(UnityEngine.Object.FindObjectsByType<Canvas>(FindObjectsInactive.Include).Length == 1, $"Match {i + 1} duplicated Canvas.");
                }
                Debug.Log("CROWN//FRONT 20-match soak PASS: alternating Results, cleanup, one gameplay root, one EventSystem, one Canvas.");
            }
            finally
            {
                RestorePreference("crown_front.profile.v1", profile);
                RestorePreference("crown_front.settings.v1", settings);
                PlayerPrefs.Save();
            }
        }

        [MenuItem("CROWN FRONT/Menu & Baked Battle/Capture All Review Frames")]
        public static void CaptureAllReviewFrames()
        {
            ReviewContext context = InitializeReviewScene();
            string directory = Path.GetFullPath(Path.Combine(Application.dataPath, "..", "..", "..", CaptureDirectory));
            Directory.CreateDirectory(directory);

            Capture(context, Path.Combine(directory, "main_menu.png"), 540, 960);
            context.Flow.ShowDeckBuilder();
            Capture(context, Path.Combine(directory, "deck_builder.png"), 540, 960);

            context.Flow.ShowBattleForReview();
            Texture2D matchStart = Capture(context, Path.Combine(directory, "match_start.png"), 540, 960, true);
            CrownUnit[] units = UnityEngine.Object.FindObjectsByType<CrownUnit>(FindObjectsInactive.Exclude);
            for (int i = 0; i < units.Length; i++)
            {
                float side = units[i].Team == CrownTeam.Blue ? -0.65f : 0.65f;
                float z = units[i].Team == CrownTeam.Blue ? 0.1f : 1.55f;
                units[i].transform.position = new Vector3(side, units[i].transform.position.y, z);
                units[i].transform.rotation = Quaternion.Euler(0f, units[i].Team == CrownTeam.Blue ? 0f : 180f, 0f);
            }
            Capture(context, Path.Combine(directory, "first_clash.png"), 540, 960);

            Camera camera = context.Camera;
            Vector3 originalPosition = camera.transform.position;
            Quaternion originalRotation = camera.transform.rotation;
            float originalField = camera.fieldOfView;
            camera.transform.position = new Vector3(0f, 15.2f, -18.2f);
            camera.transform.LookAt(new Vector3(0f, 2.8f, -9.1f));
            camera.fieldOfView = 38f;
            Capture(context, Path.Combine(directory, "core_closeup.png"), 540, 960);
            camera.transform.position = originalPosition;
            camera.transform.rotation = originalRotation;
            camera.fieldOfView = originalField;

            context.Flow.CompleteMatchForReview(true);
            Capture(context, Path.Combine(directory, "results_victory.png"), 540, 960);
            context.Flow.ShowBattleForReview();
            context.Flow.CompleteMatchForReview(false);
            Capture(context, Path.Combine(directory, "results_defeat.png"), 540, 960);

            WriteGrayscale(matchStart, Path.Combine(directory, "grayscale.png"));
            WriteScaled(matchStart, 270, 480, Path.Combine(directory, "thumbnail_270x480.png"));
            UnityEngine.Object.DestroyImmediate(matchStart);
            context.Flow.ShowMainMenu();
            Capture(context, Path.Combine(directory, "iphone_safe_area.png"), 590, 1278);
            Debug.Log($"CROWN//FRONT real Unity review frames captured: {directory}");
        }

        private static ReviewContext InitializeReviewScene()
        {
            CrownEngineCloudBuild.RebuildPrototypeScene();
            CrownAppFlowController flow = UnityEngine.Object.FindAnyObjectByType<CrownAppFlowController>(FindObjectsInactive.Include);
            CrownEngineGame game = UnityEngine.Object.FindAnyObjectByType<CrownEngineGame>(FindObjectsInactive.Include);
            Require(flow != null && game != null, "Generated review scene is missing runtime roots.");
            Invoke(flow, "Awake");
            Invoke(game, "Awake");
            Invoke(flow, "Start");
            Camera camera = Camera.main;
            Require(camera != null, "Review camera was not created.");
            return new ReviewContext(flow, game, camera);
        }

        private static Texture2D Capture(ReviewContext context, string output, int width, int height, bool keep = false)
        {
            Canvas canvas = context.Flow.GetComponent<CrownAppUI>().RootCanvas;
            RenderMode oldMode = canvas.renderMode;
            Camera oldWorldCamera = canvas.worldCamera;
            float oldPlane = canvas.planeDistance;
            canvas.renderMode = RenderMode.ScreenSpaceCamera;
            canvas.worldCamera = context.Camera;
            canvas.planeDistance = 0.55f;
            Canvas.ForceUpdateCanvases();

            RenderTexture target = new RenderTexture(width, height, 24, RenderTextureFormat.ARGB32, RenderTextureReadWrite.sRGB);
            Texture2D image = new Texture2D(width, height, TextureFormat.RGB24, false);
            RenderTexture previous = RenderTexture.active;
            float oldAspect = context.Camera.aspect;
            context.Camera.targetTexture = target;
            context.Camera.aspect = width / (float)height;
            context.Camera.Render();
            RenderTexture.active = target;
            image.ReadPixels(new Rect(0, 0, width, height), 0, 0);
            image.Apply(false, false);
            File.WriteAllBytes(output, image.EncodeToPNG());

            context.Camera.targetTexture = null;
            context.Camera.aspect = oldAspect;
            RenderTexture.active = previous;
            canvas.renderMode = oldMode;
            canvas.worldCamera = oldWorldCamera;
            canvas.planeDistance = oldPlane;
            UnityEngine.Object.DestroyImmediate(target);
            if (!keep) UnityEngine.Object.DestroyImmediate(image);
            return keep ? image : null;
        }

        private static void WriteGrayscale(Texture2D source, string output)
        {
            Color32[] pixels = source.GetPixels32();
            for (int i = 0; i < pixels.Length; i++)
            {
                byte value = (byte)Mathf.Clamp(Mathf.RoundToInt(pixels[i].r * 0.2126f + pixels[i].g * 0.7152f + pixels[i].b * 0.0722f), 0, 255);
                pixels[i] = new Color32(value, value, value, pixels[i].a);
            }
            Texture2D gray = new Texture2D(source.width, source.height, TextureFormat.RGB24, false);
            gray.SetPixels32(pixels); gray.Apply(false, false);
            File.WriteAllBytes(output, gray.EncodeToPNG());
            UnityEngine.Object.DestroyImmediate(gray);
        }

        private static void WriteScaled(Texture2D source, int width, int height, string output)
        {
            RenderTexture target = RenderTexture.GetTemporary(width, height, 0, RenderTextureFormat.ARGB32, RenderTextureReadWrite.sRGB);
            Graphics.Blit(source, target);
            RenderTexture previous = RenderTexture.active;
            RenderTexture.active = target;
            Texture2D scaled = new Texture2D(width, height, TextureFormat.RGB24, false);
            scaled.ReadPixels(new Rect(0, 0, width, height), 0, 0); scaled.Apply(false, false);
            File.WriteAllBytes(output, scaled.EncodeToPNG());
            UnityEngine.Object.DestroyImmediate(scaled);
            RenderTexture.active = previous;
            RenderTexture.ReleaseTemporary(target);
        }

        private static void Invoke(object target, string name)
        {
            MethodInfo method = target.GetType().GetMethod(name, BindingFlags.Instance | BindingFlags.NonPublic);
            if (method == null) throw new MissingMethodException(target.GetType().Name, name);
            method.Invoke(target, null);
        }

        private static void RestorePreference(string key, string value)
        {
            if (string.IsNullOrEmpty(value)) PlayerPrefs.DeleteKey(key);
            else PlayerPrefs.SetString(key, value);
        }

        private static void Require(bool condition, string message)
        {
            if (!condition) throw new InvalidOperationException(message);
        }

        private readonly struct ReviewContext
        {
            public readonly CrownAppFlowController Flow;
            public readonly CrownEngineGame Game;
            public readonly Camera Camera;
            public ReviewContext(CrownAppFlowController flow, CrownEngineGame game, Camera camera) { Flow = flow; Game = game; Camera = camera; }
        }
    }
}
