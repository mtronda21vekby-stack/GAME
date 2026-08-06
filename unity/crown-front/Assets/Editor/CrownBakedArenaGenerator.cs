using System;
using System.Collections.Generic;
using System.IO;
using CrownFront.Cloud;
using UnityEditor;
using UnityEngine;

namespace CrownFront.Editor
{
    public static class CrownBakedArenaGenerator
    {
        private const int Width = CrownBakedArenaRuntime.RequiredWidth;
        private const int Height = CrownBakedArenaRuntime.RequiredHeight;
        private const string ArenaDirectory = "Assets/Resources/CrownBakedArena";
        private const string UnitsDirectory = "Assets/Resources/CrownUnits";

        [MenuItem("CROWN FRONT/Menu & Baked Battle/Generate Baked Arena And Units")]
        public static void GenerateAll()
        {
            Directory.CreateDirectory(ArenaDirectory);
            Directory.CreateDirectory(UnitsDirectory);
            CrownModularMeshGenerator.GenerateAll();
            GenerateUnitDefinitions();
            WriteLayer("Arena_Background", DrawBackground());
            WriteLayer("Arena_TitanHull", DrawTitanHull());
            WriteLayer("Arena_CombatDeck", DrawCombatDeck());
            WriteLayer("Arena_Foreground", DrawForeground());
            WriteLayer("Arena_LightOverlay", DrawLightOverlay());
            WriteLayer("Arena_MaskOverlay", DrawMaskOverlay());
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log("CROWN//FRONT baked arena generated: six aligned 1080x1920 Sprite layers and four real UnitDefinition assets.");
        }

        private static void GenerateUnitDefinitions()
        {
            EnsureUnit("Assault", CrownUnitCatalog.AssaultId, CrownUnitKind.Assault, "ASSAULT", "STRIKE", 3, "Balanced frontline carbine infantry with dependable armor and cadence.");
            EnsureUnit("Tank", CrownUnitCatalog.TankId, CrownUnitKind.Tank, "TANK", "HEAVY", 4, "Heavy shield chassis that absorbs pressure and delivers high-impact fire.");
            EnsureUnit("Raider", CrownUnitCatalog.RaiderId, CrownUnitKind.Raider, "RAIDER", "RAPID", 2, "Fast blade unit built to close distance and punish exposed targets.");
            EnsureUnit("Ranged", CrownUnitCatalog.RangedId, CrownUnitKind.Ranged, "RANGED", "MARKSMAN", 3, "Longline rifle specialist with extended reach and a deliberate firing rhythm.");
        }

        private static void EnsureUnit(string fileName, string id, CrownUnitKind kind, string displayName, string role, int cost, string description)
        {
            string path = $"{UnitsDirectory}/{fileName}.asset";
            CrownUnitDefinition definition = AssetDatabase.LoadAssetAtPath<CrownUnitDefinition>(path);
            if (definition == null)
            {
                if (File.Exists(path)) AssetDatabase.DeleteAsset(path);
                definition = ScriptableObject.CreateInstance<CrownUnitDefinition>();
                AssetDatabase.CreateAsset(definition, path);
            }
            definition.Configure(id, kind, displayName, role, cost, description);
            EditorUtility.SetDirty(definition);
        }

        private static PixelCanvas DrawBackground()
        {
            PixelCanvas canvas = new PixelCanvas(Width, Height, new Color32(2, 7, 15, 255));
            canvas.VerticalGradient(new Color32(2, 7, 15, 255), new Color32(10, 25, 42, 255));
            System.Random random = new System.Random(4127);
            for (int i = 0; i < 48; i++)
            {
                int x = random.Next(0, Width);
                int y = random.Next(0, Height);
                int radius = random.Next(1, 4);
                byte value = (byte)random.Next(65, 135);
                canvas.Ellipse(x, y, radius, radius, new Color32(95, 167, 205, value));
            }

            for (int i = 0; i < 11; i++)
            {
                int y = 80 + i * 155;
                int x = i % 2 == 0 ? 80 : 820;
                canvas.Ellipse(x, y, 340, 105, new Color32(17, 37, 57, 72));
                canvas.Ellipse(Width - x, y + 60, 280, 90, new Color32(25, 47, 67, 46));
            }

            canvas.Polygon(new[]
            {
                P(0, 1490), P(210, 1380), P(330, 1430), P(420, 1320), P(540, 1410),
                P(660, 1320), P(750, 1430), P(870, 1380), P(1080, 1490), P(1080, 1920), P(0, 1920)
            }, new Color32(4, 10, 19, 255));
            return canvas;
        }

        private static PixelCanvas DrawTitanHull()
        {
            PixelCanvas canvas = PixelCanvas.Transparent(Width, Height);
            Color32 graphite = new Color32(20, 34, 47, 255);
            Color32 dark = new Color32(7, 15, 25, 255);
            Color32 steel = new Color32(58, 76, 90, 255);
            Color32 edge = new Color32(104, 126, 140, 220);

            canvas.Polygon(new[] { P(15, 80), P(165, 30), P(310, 170), P(290, 1510), P(100, 1710), P(0, 1640) }, dark, edge, 7);
            canvas.Polygon(new[] { P(1065, 80), P(915, 30), P(770, 170), P(790, 1510), P(980, 1710), P(1080, 1640) }, dark, edge, 7);
            canvas.Polygon(new[] { P(120, 120), P(270, 55), P(420, 210), P(375, 1710), P(210, 1840), P(70, 1730) }, graphite, steel, 9);
            canvas.Polygon(new[] { P(960, 120), P(810, 55), P(660, 210), P(705, 1710), P(870, 1840), P(1010, 1730) }, graphite, steel, 9);

            for (int i = 0; i < 7; i++)
            {
                int y = 210 + i * 215;
                canvas.Polygon(new[] { P(92, y), P(240, y - 42), P(316, y + 45), P(238, y + 132), P(78, y + 96) }, i % 2 == 0 ? steel : graphite, edge, 4);
                canvas.Polygon(new[] { P(988, y), P(840, y - 42), P(764, y + 45), P(842, y + 132), P(1002, y + 96) }, i % 2 == 0 ? steel : graphite, edge, 4);
                canvas.Line(240, y + 15, 840, y + 15, 12, new Color32(30, 47, 61, 190));
            }

            canvas.Polygon(new[] { P(360, 1590), P(450, 1515), P(630, 1515), P(720, 1590), P(685, 1810), P(540, 1890), P(395, 1810) }, graphite, edge, 8);
            canvas.Polygon(new[] { P(414, 1615), P(472, 1570), P(608, 1570), P(666, 1615), P(638, 1762), P(540, 1822), P(442, 1762) }, dark, steel, 6);
            canvas.Polygon(new[] { P(438, 1745), P(480, 1815), P(505, 1919), P(430, 1919) }, steel);
            canvas.Polygon(new[] { P(515, 1800), P(540, 1890), P(565, 1800), P(585, 1919), P(495, 1919) }, new Color32(90, 72, 36, 255));
            canvas.Polygon(new[] { P(642, 1745), P(600, 1815), P(575, 1919), P(650, 1919) }, steel);
            canvas.Line(475, 1665, 520, 1648, 9, new Color32(255, 87, 20, 230));
            canvas.Line(605, 1648, 560, 1665, 9, new Color32(255, 87, 20, 230));
            return canvas;
        }

        private static PixelCanvas DrawCombatDeck()
        {
            PixelCanvas canvas = PixelCanvas.Transparent(Width, Height);
            Color32 deck = new Color32(33, 49, 61, 255);
            Color32 plate = new Color32(48, 67, 80, 255);
            Color32 dark = new Color32(10, 20, 31, 255);
            Color32 seam = new Color32(84, 105, 118, 230);

            canvas.Polygon(new[] { P(175, 145), P(905, 145), P(835, 1770), P(245, 1770) }, deck, seam, 10);
            canvas.Polygon(new[] { P(238, 210), P(390, 175), P(425, 1705), P(270, 1740) }, plate, dark, 7);
            canvas.Polygon(new[] { P(440, 180), P(640, 180), P(626, 1710), P(454, 1710) }, new Color32(55, 74, 86, 255), dark, 7);
            canvas.Polygon(new[] { P(690, 175), P(842, 210), P(810, 1740), P(655, 1705) }, plate, dark, 7);

            for (int lane = 0; lane < 3; lane++)
            {
                int cx = lane == 0 ? 335 : lane == 1 ? 540 : 745;
                for (int segment = 0; segment < 8; segment++)
                {
                    int y = 245 + segment * 184;
                    int half = lane == 1 ? 76 : 68;
                    int skew = (segment & 1) == 0 ? 10 : -10;
                    canvas.Polygon(new[] { P(cx - half + skew, y), P(cx + half + skew, y + 7), P(cx + half - skew, y + 132), P(cx - half - skew, y + 125) }, segment % 2 == 0 ? new Color32(61, 81, 94, 255) : new Color32(44, 63, 76, 255), seam, 3);
                }
            }

            canvas.Polygon(new[] { P(360, 860), P(430, 785), P(650, 785), P(720, 860), P(650, 970), P(430, 970) }, dark, seam, 7);
            canvas.Polygon(new[] { P(430, 842), P(540, 790), P(650, 842), P(610, 930), P(470, 930) }, new Color32(69, 84, 93, 255), new Color32(135, 156, 166, 230), 5);

            for (int i = 0; i < 6; i++)
            {
                int y = 320 + i * 245;
                canvas.Line(185, y, 265, y + 26, 16, dark);
                canvas.Line(895, y, 815, y + 26, 16, dark);
            }
            return canvas;
        }

        private static PixelCanvas DrawForeground()
        {
            PixelCanvas canvas = PixelCanvas.Transparent(Width, Height);
            Color32 armor = new Color32(24, 39, 52, 244);
            Color32 edge = new Color32(91, 113, 127, 235);
            canvas.Polygon(new[] { P(0, 0), P(330, 0), P(274, 225), P(145, 360), P(0, 300) }, armor, edge, 8);
            canvas.Polygon(new[] { P(1080, 0), P(750, 0), P(806, 225), P(935, 360), P(1080, 300) }, armor, edge, 8);
            canvas.Line(40, 55, 248, 180, 26, new Color32(10, 18, 26, 255));
            canvas.Line(1040, 55, 832, 180, 26, new Color32(10, 18, 26, 255));
            canvas.Line(28, 470, 205, 590, 13, new Color32(74, 90, 101, 210));
            canvas.Line(1052, 470, 875, 590, 13, new Color32(74, 90, 101, 210));
            return canvas;
        }

        private static PixelCanvas DrawLightOverlay()
        {
            PixelCanvas canvas = PixelCanvas.Transparent(Width, Height);
            Color32 cyan = new Color32(0, 205, 255, 155);
            Color32 blue = new Color32(0, 93, 255, 100);
            Color32 orange = new Color32(255, 73, 8, 150);
            Color32 red = new Color32(220, 12, 5, 95);
            int[] lanes = { 335, 540, 745 };
            for (int i = 0; i < lanes.Length; i++)
            {
                canvas.GlowLine(lanes[i], 250, lanes[i], 760, 5, blue);
                canvas.GlowLine(lanes[i], 1010, lanes[i], 1600, 5, red);
            }
            canvas.GlowHex(540, 255, 98, cyan);
            canvas.GlowHex(540, 1635, 98, orange);
            canvas.GlowLine(450, 870, 540, 805, 6, new Color32(215, 242, 255, 125));
            canvas.GlowLine(540, 805, 630, 870, 6, new Color32(215, 242, 255, 125));
            return canvas;
        }

        private static PixelCanvas DrawMaskOverlay()
        {
            PixelCanvas canvas = PixelCanvas.Transparent(Width, Height);
            Color32 shadow = new Color32(0, 0, 0, 72);
            canvas.Ellipse(540, 247, 125, 42, shadow);
            canvas.Ellipse(540, 1635, 125, 42, shadow);
            int[] lanes = { 335, 540, 745 };
            for (int i = 0; i < lanes.Length; i++)
            {
                canvas.Ellipse(lanes[i], 485, 72, 26, shadow);
                canvas.Ellipse(lanes[i], 1395, 72, 26, shadow);
            }
            return canvas;
        }

        private static void WriteLayer(string name, PixelCanvas canvas)
        {
            Texture2D texture = new Texture2D(Width, Height, TextureFormat.RGBA32, false, false) { name = name };
            texture.SetPixels32(canvas.Pixels);
            texture.Apply(false, false);
            string path = $"{ArenaDirectory}/{name}.png";
            File.WriteAllBytes(path, texture.EncodeToPNG());
            UnityEngine.Object.DestroyImmediate(texture);
            AssetDatabase.ImportAsset(path, ImportAssetOptions.ForceUpdate);
            TextureImporter importer = AssetImporter.GetAtPath(path) as TextureImporter;
            if (importer == null) throw new InvalidOperationException($"Unable to configure {path}.");
            importer.textureType = TextureImporterType.Sprite;
            importer.spriteImportMode = SpriteImportMode.Single;
            importer.spritePixelsPerUnit = 100f;
            importer.mipmapEnabled = false;
            importer.alphaSource = TextureImporterAlphaSource.FromInput;
            importer.alphaIsTransparency = name != "Arena_Background";
            importer.sRGBTexture = true;
            importer.maxTextureSize = 2048;
            importer.textureCompression = TextureImporterCompression.CompressedHQ;
            importer.crunchedCompression = true;
            importer.compressionQuality = 82;
            importer.wrapMode = TextureWrapMode.Clamp;
            importer.filterMode = FilterMode.Bilinear;
            importer.SaveAndReimport();
        }

        private static Vector2Int P(int x, int y) { return new Vector2Int(x, y); }

        private sealed class PixelCanvas
        {
            private readonly int _width;
            private readonly int _height;
            public Color32[] Pixels { get; }

            public PixelCanvas(int width, int height, Color32 fill)
            {
                _width = width;
                _height = height;
                Pixels = new Color32[width * height];
                for (int i = 0; i < Pixels.Length; i++) Pixels[i] = fill;
            }

            public static PixelCanvas Transparent(int width, int height) { return new PixelCanvas(width, height, new Color32(0, 0, 0, 0)); }

            public void VerticalGradient(Color32 bottom, Color32 top)
            {
                for (int y = 0; y < _height; y++)
                {
                    float t = y / (float)(_height - 1);
                    Color32 c = Lerp(bottom, top, t);
                    int offset = y * _width;
                    for (int x = 0; x < _width; x++) Pixels[offset + x] = c;
                }
            }

            public void Polygon(Vector2Int[] points, Color32 fill) { Polygon(points, fill, default, 0); }

            public void Polygon(Vector2Int[] points, Color32 fill, Color32 border, int borderWidth)
            {
                int minX = _width - 1, minY = _height - 1, maxX = 0, maxY = 0;
                for (int i = 0; i < points.Length; i++)
                {
                    minX = Mathf.Min(minX, points[i].x); maxX = Mathf.Max(maxX, points[i].x);
                    minY = Mathf.Min(minY, points[i].y); maxY = Mathf.Max(maxY, points[i].y);
                }
                minX = Mathf.Clamp(minX, 0, _width - 1); maxX = Mathf.Clamp(maxX, 0, _width - 1);
                minY = Mathf.Clamp(minY, 0, _height - 1); maxY = Mathf.Clamp(maxY, 0, _height - 1);
                for (int y = minY; y <= maxY; y++)
                for (int x = minX; x <= maxX; x++)
                    if (Inside(points, x + 0.5f, y + 0.5f)) Blend(x, y, fill);
                if (borderWidth > 0)
                {
                    for (int i = 0; i < points.Length; i++) Line(points[i].x, points[i].y, points[(i + 1) % points.Length].x, points[(i + 1) % points.Length].y, borderWidth, border);
                }
            }

            public void Line(int x0, int y0, int x1, int y1, int width, Color32 color)
            {
                int minX = Mathf.Clamp(Mathf.Min(x0, x1) - width, 0, _width - 1);
                int maxX = Mathf.Clamp(Mathf.Max(x0, x1) + width, 0, _width - 1);
                int minY = Mathf.Clamp(Mathf.Min(y0, y1) - width, 0, _height - 1);
                int maxY = Mathf.Clamp(Mathf.Max(y0, y1) + width, 0, _height - 1);
                Vector2 a = new Vector2(x0, y0); Vector2 b = new Vector2(x1, y1); Vector2 ab = b - a;
                float denominator = Mathf.Max(0.0001f, ab.sqrMagnitude);
                float radius = width * 0.5f;
                for (int y = minY; y <= maxY; y++)
                for (int x = minX; x <= maxX; x++)
                {
                    Vector2 p = new Vector2(x, y);
                    float t = Mathf.Clamp01(Vector2.Dot(p - a, ab) / denominator);
                    if (Vector2.Distance(p, a + ab * t) <= radius) Blend(x, y, color);
                }
            }

            public void GlowLine(int x0, int y0, int x1, int y1, int width, Color32 color)
            {
                Color32 outer = color; outer.a = (byte)(color.a * 0.17f);
                Color32 middle = color; middle.a = (byte)(color.a * 0.42f);
                Line(x0, y0, x1, y1, width * 5, outer);
                Line(x0, y0, x1, y1, width * 2, middle);
                Line(x0, y0, x1, y1, width, color);
            }

            public void GlowHex(int cx, int cy, int radius, Color32 color)
            {
                Vector2Int[] points = new Vector2Int[6];
                for (int i = 0; i < 6; i++)
                {
                    float angle = Mathf.Deg2Rad * (30f + i * 60f);
                    points[i] = P(cx + Mathf.RoundToInt(Mathf.Cos(angle) * radius), cy + Mathf.RoundToInt(Mathf.Sin(angle) * radius));
                }
                Color32 soft = color; soft.a = (byte)(color.a * 0.18f);
                Polygon(points, soft, soft, 28);
                for (int i = 0; i < points.Length; i++) GlowLine(points[i].x, points[i].y, points[(i + 1) % points.Length].x, points[(i + 1) % points.Length].y, 4, color);
            }

            public void Ellipse(int cx, int cy, int rx, int ry, Color32 color)
            {
                if (rx <= 0 || ry <= 0) return;
                int minX = Mathf.Clamp(cx - rx, 0, _width - 1), maxX = Mathf.Clamp(cx + rx, 0, _width - 1);
                int minY = Mathf.Clamp(cy - ry, 0, _height - 1), maxY = Mathf.Clamp(cy + ry, 0, _height - 1);
                for (int y = minY; y <= maxY; y++)
                for (int x = minX; x <= maxX; x++)
                {
                    float nx = (x - cx) / (float)rx, ny = (y - cy) / (float)ry;
                    float d = nx * nx + ny * ny;
                    if (d <= 1f)
                    {
                        Color32 c = color; c.a = (byte)(color.a * Mathf.Clamp01((1f - d) * 2.5f));
                        Blend(x, y, c);
                    }
                }
            }

            private void Blend(int x, int y, Color32 source)
            {
                if ((uint)x >= _width || (uint)y >= _height || source.a == 0) return;
                int index = y * _width + x;
                Color32 destination = Pixels[index];
                float sa = source.a / 255f;
                float da = destination.a / 255f;
                float oa = sa + da * (1f - sa);
                if (oa <= 0.0001f) { Pixels[index] = default; return; }
                byte r = (byte)Mathf.Clamp(Mathf.RoundToInt((source.r * sa + destination.r * da * (1f - sa)) / oa), 0, 255);
                byte g = (byte)Mathf.Clamp(Mathf.RoundToInt((source.g * sa + destination.g * da * (1f - sa)) / oa), 0, 255);
                byte b = (byte)Mathf.Clamp(Mathf.RoundToInt((source.b * sa + destination.b * da * (1f - sa)) / oa), 0, 255);
                Pixels[index] = new Color32(r, g, b, (byte)Mathf.Clamp(Mathf.RoundToInt(oa * 255f), 0, 255));
            }

            private static bool Inside(IReadOnlyList<Vector2Int> points, float x, float y)
            {
                bool inside = false;
                for (int i = 0, j = points.Count - 1; i < points.Count; j = i++)
                {
                    Vector2Int a = points[i], b = points[j];
                    if ((a.y > y) != (b.y > y) && x < (b.x - a.x) * (y - a.y) / (float)(b.y - a.y) + a.x) inside = !inside;
                }
                return inside;
            }

            private static Color32 Lerp(Color32 a, Color32 b, float t)
            {
                return new Color32((byte)Mathf.Lerp(a.r, b.r, t), (byte)Mathf.Lerp(a.g, b.g, t), (byte)Mathf.Lerp(a.b, b.b, t), (byte)Mathf.Lerp(a.a, b.a, t));
            }
        }
    }
}
