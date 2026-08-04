using System;
using System.IO;
using System.Reflection;
using CrownFront.Cloud;
using UnityEditor;
using UnityEngine;

namespace CrownFront.Editor
{
    public static class CrownArtRebootReviewCapture
    {
        private const int Width = 540;
        private const int Height = 960;

        [MenuItem("CROWN FRONT/Art Reboot/Capture Slice 1 Review Frames")]
        public static void CaptureAll()
        {
            CrownEngineCloudBuild.RebuildPrototypeScene();
            CrownEngineGame game = UnityEngine.Object.FindAnyObjectByType<CrownEngineGame>();
            if (game == null) throw new InvalidOperationException("CrownEngineGame is missing from the generated scene.");

            MethodInfo awake = typeof(CrownEngineGame).GetMethod("Awake", BindingFlags.Instance | BindingFlags.NonPublic);
            MethodInfo spawn = typeof(CrownEngineGame).GetMethod("Spawn", BindingFlags.Instance | BindingFlags.NonPublic);
            if (awake == null || spawn == null) throw new InvalidOperationException("Unable to initialize the review scene through the shipping runtime.");
            awake.Invoke(game, null);

            CrownArtRebootHeroFrame art = game.GetComponent<CrownArtRebootHeroFrame>();
            if (art == null) throw new InvalidOperationException("Art Reboot presentation component is missing from the review root.");
            art.ApplyNow();

            CrownArtRebootIteration2 iteration2 = game.GetComponent<CrownArtRebootIteration2>();
            if (iteration2 == null) throw new InvalidOperationException("Art Reboot Iteration 2 component is missing from the review root.");
            iteration2.ApplyNow();

            CrownAssetArtReboot assetArt = game.GetComponent<CrownAssetArtReboot>();
            if (assetArt == null) throw new InvalidOperationException("CC0 asset Art Reboot component is missing from the review root.");
            assetArt.ApplyNow();

            Camera camera = Camera.main;
            if (camera == null) throw new InvalidOperationException("Art Reboot review camera is missing.");

            string directory = Path.GetFullPath(Path.Combine(Application.dataPath, "..", "..", "..", "VisualReview", "ArtRebootSlice1"));
            Directory.CreateDirectory(directory);

            Texture2D matchStart = Render(camera, Width, Height);
            Write(directory, "hero_match_start.png", matchStart);
            Write(directory, "hero_grayscale.png", ToGrayscale(matchStart));
            Write(directory, "hero_thumbnail.png", Resize(matchStart, 270, 480));

            AddClashUnits(game, spawn);
            assetArt.SendMessage("SkinUnits", SendMessageOptions.DontRequireReceiver);
            PositionClashUnits();
            Texture2D firstClash = Render(camera, Width, Height);
            Write(directory, "hero_first_clash.png", firstClash);

            CrownAuthoredHeroCamera camera1 = camera.GetComponent<CrownAuthoredHeroCamera>();
            if (camera1 != null) camera1.enabled = false;
            CrownIteration2Camera camera2 = camera.GetComponent<CrownIteration2Camera>();
            if (camera2 != null) camera2.enabled = false;
            CrownAssetHeroCamera camera3 = camera.GetComponent<CrownAssetHeroCamera>();
            if (camera3 != null) camera3.enabled = false;
            camera.transform.position = new Vector3(0f, 14.5f, -18.8f);
            camera.transform.LookAt(new Vector3(0f, 1.55f, -8.5f));
            camera.fieldOfView = 28f;
            Texture2D coreCloseup = Render(camera, Width, Height);
            Write(directory, "hero_core_closeup.png", coreCloseup);

            UnityEngine.Object.DestroyImmediate(matchStart);
            UnityEngine.Object.DestroyImmediate(firstClash);
            UnityEngine.Object.DestroyImmediate(coreCloseup);
            AssetDatabase.Refresh();
            Debug.Log($"CROWN//FRONT real asset Art Reboot review package captured at {directory}");
        }

        private static void AddClashUnits(CrownEngineGame game, MethodInfo spawn)
        {
            for (int lane = 0; lane < 3; lane++)
            {
                spawn.Invoke(game, new object[] { CrownTeam.Blue, CrownUnitKind.Assault, lane });
                spawn.Invoke(game, new object[] { CrownTeam.Red, CrownUnitKind.Assault, lane });
            }
            spawn.Invoke(game, new object[] { CrownTeam.Blue, CrownUnitKind.Tank, 1 });
            spawn.Invoke(game, new object[] { CrownTeam.Red, CrownUnitKind.Raider, 1 });
        }

        private static void PositionClashUnits()
        {
            CrownUnit[] units = UnityEngine.Object.FindObjectsByType<CrownUnit>(FindObjectsInactive.Exclude);
            int blueIndex = 0;
            int redIndex = 0;
            for (int i = 0; i < units.Length; i++)
            {
                CrownUnit unit = units[i];
                float x = unit.Lane == 0 ? -4.4f : unit.Lane == 2 ? 4.4f : 0f;
                if (unit.Team == CrownTeam.Blue)
                {
                    unit.transform.position = new Vector3(x, 2.35f, -1.7f - (blueIndex++ % 3) * 0.7f);
                    unit.transform.rotation = Quaternion.identity;
                }
                else
                {
                    unit.transform.position = new Vector3(x, 2.35f, 1.7f + (redIndex++ % 3) * 0.7f);
                    unit.transform.rotation = Quaternion.Euler(0f, 180f, 0f);
                }
            }
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

        private static Texture2D ToGrayscale(Texture2D source)
        {
            Texture2D result = new Texture2D(source.width, source.height, TextureFormat.RGB24, false);
            Color[] pixels = source.GetPixels();
            for (int i = 0; i < pixels.Length; i++)
            {
                float value = pixels[i].r * 0.2126f + pixels[i].g * 0.7152f + pixels[i].b * 0.0722f;
                pixels[i] = new Color(value, value, value, 1f);
            }
            result.SetPixels(pixels);
            result.Apply(false, false);
            return result;
        }

        private static Texture2D Resize(Texture2D source, int width, int height)
        {
            RenderTexture target = RenderTexture.GetTemporary(width, height, 0, RenderTextureFormat.ARGB32);
            RenderTexture previous = RenderTexture.active;
            Graphics.Blit(source, target);
            RenderTexture.active = target;
            Texture2D result = new Texture2D(width, height, TextureFormat.RGB24, false);
            result.ReadPixels(new Rect(0, 0, width, height), 0, 0);
            result.Apply(false, false);
            RenderTexture.active = previous;
            RenderTexture.ReleaseTemporary(target);
            return result;
        }

        private static void Write(string directory, string fileName, Texture2D texture)
        {
            string path = Path.Combine(directory, fileName);
            File.WriteAllBytes(path, texture.EncodeToPNG());
            Debug.Log($"Captured {path}");
        }
    }
}
