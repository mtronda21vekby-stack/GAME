using System;
using System.IO;
using CrownFront.Cloud;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace CrownFront.Editor
{
    public static class CrownEngineCloudBuild
    {
        private const string SceneDirectory = "Assets/_Project/Generated";
        private const string ScenePath = SceneDirectory + "/CrownEngine_Prototype.unity";

        [MenuItem("CROWN FRONT/Cloud/Rebuild Crown Engine Prototype")]
        public static void RebuildPrototypeScene()
        {
            Directory.CreateDirectory(SceneDirectory);

            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            GameObject root = new GameObject("CrownEngineGame");
            root.AddComponent<CrownEngineGame>();
            root.AddComponent<CrownArtRebootHeroFrame>();
            root.AddComponent<CrownArtRebootIteration2>();
            root.AddComponent<CrownAssetArtReboot>();
            root.AddComponent<CrownAssetArtDirectionPass>();

            EditorSceneManager.MarkSceneDirty(scene);
            if (!EditorSceneManager.SaveScene(scene, ScenePath))
            {
                throw new InvalidOperationException("Failed to save generated Crown Engine scene.");
            }

            EditorBuildSettings.scenes = new[]
            {
                new EditorBuildSettingsScene(ScenePath, true)
            };

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log($"CROWN//FRONT prototype scene generated: {ScenePath}");
        }

        [MenuItem("CROWN FRONT/Cloud/Build WebGL")]
        public static void BuildWebGL()
        {
            bool quaterniusGalleryCaptured = CrownQuaterniusGalleryCapture.CaptureIfAvailable();
            RebuildPrototypeScene();
            CrownArtRebootReviewCapture.CaptureAll();
            RebuildPrototypeScene();
            ConfigurePlayer();
            CrownVisualRebirthValidation.ValidateForBuild();

            string outputPath =
                ReadArgument("-outputPath") ??
                ReadArgument("-customBuildPath") ??
                "Builds/CloudWebGL";

            outputPath = Path.GetFullPath(outputPath);
            if (Directory.Exists(outputPath)) Directory.Delete(outputPath, true);
            Directory.CreateDirectory(outputPath);

            BuildPlayerOptions options = new BuildPlayerOptions
            {
                scenes = new[] { ScenePath },
                locationPathName = outputPath,
                target = BuildTarget.WebGL,
                options = BuildOptions.None
            };

            BuildReport report = BuildPipeline.BuildPlayer(options);
            BuildSummary summary = report.summary;
            string reportPath = Path.Combine(outputPath, "CROWN_ENGINE_BUILD_REPORT.txt");
            File.WriteAllText(
                reportPath,
                $"result={summary.result}{Environment.NewLine}" +
                $"platform={summary.platform}{Environment.NewLine}" +
                $"totalSize={summary.totalSize}{Environment.NewLine}" +
                $"totalTime={summary.totalTime}{Environment.NewLine}" +
                $"warnings={summary.totalWarnings}{Environment.NewLine}" +
                $"errors={summary.totalErrors}{Environment.NewLine}" +
                $"artRebootSlice=quaternius-selection-review{Environment.NewLine}" +
                $"quaterniusGalleryCaptured={quaterniusGalleryCaptured}{Environment.NewLine}");

            if (summary.result != BuildResult.Succeeded)
            {
                throw new InvalidOperationException($"CROWN//FRONT WebGL build failed: {summary.result}; errors={summary.totalErrors}; warnings={summary.totalWarnings}");
            }

            CopyRequiredReviewFrames(outputPath);
            CopyOptionalQuaterniusGallery(outputPath, quaterniusGalleryCaptured);
            Debug.Log($"CROWN//FRONT Quaternius selection review build succeeded: {outputPath} ({summary.totalSize} bytes)");
        }

        private static void CopyRequiredReviewFrames(string outputPath)
        {
            string source = Path.GetFullPath(Path.Combine(Application.dataPath, "..", "..", "..", "VisualReview", "ArtRebootSlice1"));
            string destination = Path.Combine(outputPath, "ReviewFrames");
            if (!Directory.Exists(source)) throw new DirectoryNotFoundException($"Art Reboot review frame directory is missing: {source}");
            string[] files = Directory.GetFiles(source, "*.png", SearchOption.TopDirectoryOnly);
            if (files.Length < 5) throw new InvalidOperationException($"Expected at least five real Unity review frames, found {files.Length}.");
            Directory.CreateDirectory(destination);
            for (int i = 0; i < files.Length; i++) File.Copy(files[i], Path.Combine(destination, Path.GetFileName(files[i])), true);
        }

        private static void CopyOptionalQuaterniusGallery(string outputPath, bool captured)
        {
            if (!captured) return;
            string source = Path.GetFullPath(Path.Combine(Application.dataPath, "..", "..", "..", "VisualReview", "QuaterniusGallery"));
            if (!Directory.Exists(source)) throw new DirectoryNotFoundException($"Quaternius gallery was reported as captured but is missing: {source}");

            string destination = Path.Combine(outputPath, "ReviewFrames", "QuaterniusGallery");
            Directory.CreateDirectory(destination);
            string[] files = Directory.GetFiles(source, "*", SearchOption.TopDirectoryOnly);
            int pngCount = 0;
            for (int i = 0; i < files.Length; i++)
            {
                string extension = Path.GetExtension(files[i]);
                if (!string.Equals(extension, ".png", StringComparison.OrdinalIgnoreCase) &&
                    !string.Equals(extension, ".txt", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }
                if (string.Equals(extension, ".png", StringComparison.OrdinalIgnoreCase)) pngCount++;
                File.Copy(files[i], Path.Combine(destination, Path.GetFileName(files[i])), true);
            }
            if (pngCount < 5) throw new InvalidOperationException($"Quaternius gallery is incomplete: expected at least five pages, found {pngCount}.");
        }

        private static void ConfigurePlayer()
        {
            PlayerSettings.companyName = "BlackCrown";
            PlayerSettings.productName = "CROWN//FRONT — QUATERNIUS SELECTION REVIEW";
            PlayerSettings.bundleVersion = "0.4.0-quaternius-selection-review";
            PlayerSettings.defaultScreenWidth = 1080;
            PlayerSettings.defaultScreenHeight = 1920;
            PlayerSettings.runInBackground = false;
            PlayerSettings.resizableWindow = true;
            PlayerSettings.stripEngineCode = true;
            PlayerSettings.colorSpace = ColorSpace.Linear;
#pragma warning disable CS0618
            PlayerSettings.SetScriptingBackend(BuildTargetGroup.WebGL, ScriptingImplementation.IL2CPP);
#pragma warning restore CS0618
            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Brotli;
            PlayerSettings.WebGL.decompressionFallback = true;
            PlayerSettings.WebGL.exceptionSupport = WebGLExceptionSupport.None;
            PlayerSettings.WebGL.dataCaching = true;
            EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.WebGL, BuildTarget.WebGL);
        }

        private static string ReadArgument(string name)
        {
            string[] args = Environment.GetCommandLineArgs();
            for (int i = 0; i < args.Length - 1; i++)
            {
                if (string.Equals(args[i], name, StringComparison.OrdinalIgnoreCase)) return args[i + 1];
            }
            return null;
        }
    }
}
