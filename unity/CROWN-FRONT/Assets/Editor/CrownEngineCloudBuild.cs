using System;
using System.IO;
using CrownFront;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace CrownFront.Editor
{
    public static class CrownEngineCloudBuild
    {
        private const string GeneratedScenePath = "Assets/CrownFront/Generated/CrownEngine_Cloud.unity";

        [MenuItem("CROWN FRONT/Cloud/Create Prototype Scene")]
        public static void CreatePrototypeScene()
        {
            CreateAndSaveScene();
            Debug.Log("CROWN//FRONT prototype scene generated at " + GeneratedScenePath);
        }

        [MenuItem("CROWN FRONT/Cloud/Build WebGL")]
        public static void Build()
        {
            string projectRoot = Directory.GetParent(Application.dataPath)?.FullName ?? Directory.GetCurrentDirectory();
            string outputArgument = GetCommandLineValue("-outputPath");
            string outputPath = string.IsNullOrWhiteSpace(outputArgument)
                ? Path.GetFullPath(Path.Combine(projectRoot, "../../build/CrownEngineWebGL"))
                : Path.GetFullPath(Path.IsPathRooted(outputArgument) ? outputArgument : Path.Combine(projectRoot, outputArgument));

            if (Directory.Exists(outputPath))
            {
                Directory.Delete(outputPath, true);
            }
            Directory.CreateDirectory(outputPath);

            CreateAndSaveScene();
            ConfigurePlayerSettings();

            BuildPlayerOptions options = new BuildPlayerOptions
            {
                scenes = new[] { GeneratedScenePath },
                locationPathName = outputPath,
                target = BuildTarget.WebGL,
                targetGroup = BuildTargetGroup.WebGL,
                options = BuildOptions.None
            };

            BuildReport report = BuildPipeline.BuildPlayer(options);
            BuildSummary summary = report.summary;
            Debug.Log($"CROWN//FRONT WebGL build result={summary.result} size={summary.totalSize} output={outputPath}");

            if (summary.result != BuildResult.Succeeded)
            {
                throw new InvalidOperationException("CROWN//FRONT WebGL build failed: " + summary.result);
            }
        }

        private static void CreateAndSaveScene()
        {
            string sceneDirectory = Path.GetDirectoryName(Path.Combine(Directory.GetParent(Application.dataPath)?.FullName ?? string.Empty, GeneratedScenePath));
            if (!string.IsNullOrEmpty(sceneDirectory))
            {
                Directory.CreateDirectory(sceneDirectory);
            }

            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            GameObject bootstrap = new GameObject("CROWN//FRONT — THE CROWN ENGINE");
            bootstrap.AddComponent<CrownEngineBootstrap>();

            EditorSceneManager.MarkSceneDirty(scene);
            if (!EditorSceneManager.SaveScene(scene, GeneratedScenePath))
            {
                throw new IOException("Unable to save generated scene at " + GeneratedScenePath);
            }

            EditorBuildSettings.scenes = new[]
            {
                new EditorBuildSettingsScene(GeneratedScenePath, true)
            };

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
        }

        private static void ConfigurePlayerSettings()
        {
            PlayerSettings.companyName = "BlackCrown";
            PlayerSettings.productName = "CROWN//FRONT — THE CROWN ENGINE";
            PlayerSettings.bundleVersion = "0.2.0-prototype.1";
            PlayerSettings.defaultScreenWidth = 1080;
            PlayerSettings.defaultScreenHeight = 1920;
            PlayerSettings.runInBackground = false;
            PlayerSettings.colorSpace = ColorSpace.Gamma;
            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Brotli;
            PlayerSettings.WebGL.decompressionFallback = true;
            PlayerSettings.WebGL.initialMemorySize = 256;
            PlayerSettings.WebGL.maximumMemorySize = 1024;
            PlayerSettings.WebGL.memoryGrowthMode = WebGLMemoryGrowthMode.Geometric;
        }

        private static string GetCommandLineValue(string key)
        {
            string[] args = Environment.GetCommandLineArgs();
            for (int i = 0; i < args.Length - 1; i++)
            {
                if (string.Equals(args[i], key, StringComparison.OrdinalIgnoreCase))
                {
                    return args[i + 1];
                }
            }

            return string.Empty;
        }
    }
}
