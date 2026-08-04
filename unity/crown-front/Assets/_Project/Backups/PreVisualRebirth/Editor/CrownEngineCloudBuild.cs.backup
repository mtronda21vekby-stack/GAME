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
            RebuildPrototypeScene();
            ConfigurePlayer();

            string outputPath =
                ReadArgument("-outputPath") ??
                ReadArgument("-customBuildPath") ??
                "Builds/CloudWebGL";

            outputPath = Path.GetFullPath(outputPath);
            if (Directory.Exists(outputPath))
            {
                Directory.Delete(outputPath, true);
            }

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
                $"errors={summary.totalErrors}{Environment.NewLine}");

            if (summary.result != BuildResult.Succeeded)
            {
                throw new InvalidOperationException(
                    $"CROWN//FRONT WebGL build failed: {summary.result}; errors={summary.totalErrors}; warnings={summary.totalWarnings}");
            }

            Debug.Log($"CROWN//FRONT WebGL build succeeded: {outputPath} ({summary.totalSize} bytes)");
        }

        private static void ConfigurePlayer()
        {
            PlayerSettings.companyName = "BlackCrown";
            PlayerSettings.productName = "CROWN//FRONT — THE CROWN ENGINE";
            PlayerSettings.bundleVersion = "0.2.0-alpha.2";
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
                if (string.Equals(args[i], name, StringComparison.OrdinalIgnoreCase))
                {
                    return args[i + 1];
                }
            }

            return null;
        }
    }
}
