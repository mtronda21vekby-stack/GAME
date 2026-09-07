using System;
using System.IO;
using UnityEditor;
using UnityEngine;

namespace CrownFront.Editor
{
    public static class CrownModularMeshGenerator
    {
        private const string DirectoryPath = "Assets/Resources/CrownMeshes";

        public static void GenerateAll()
        {
            Directory.CreateDirectory(DirectoryPath);
            Save("ArmorTorso", TaperedBox("ArmorTorso", 1f, 0.72f, 0.7f, 0.56f, 1f));
            Save("ArmorWedge", TaperedBox("ArmorWedge", 1f, 0.82f, 0.48f, 0.58f, 1f));
            Save("AngularHelmet", TaperedBox("AngularHelmet", 0.82f, 0.72f, 0.62f, 0.54f, 1f));
            Save("HeavyShield", TaperedBox("HeavyShield", 1f, 0.32f, 0.78f, 0.24f, 1f));
            Save("HexSocket", Prism("HexSocket", 6));
            Save("EnergyLens", Prism("EnergyLens", 6));
            Save("CrownBlade", Blade("CrownBlade"));
            Save("RailHousing", TaperedBox("RailHousing", 0.72f, 1f, 0.48f, 0.72f, 1f));
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
        }

        private static void Save(string fileName, Mesh mesh)
        {
            string path = $"{DirectoryPath}/{fileName}.asset";
            Mesh existing = AssetDatabase.LoadAssetAtPath<Mesh>(path);
            if (existing == null)
            {
                AssetDatabase.CreateAsset(mesh, path);
                return;
            }
            EditorUtility.CopySerialized(mesh, existing);
            UnityEngine.Object.DestroyImmediate(mesh);
            EditorUtility.SetDirty(existing);
        }

        private static Mesh TaperedBox(string name, float lowerX, float lowerZ, float upperX, float upperZ, float height)
        {
            float y0 = -height * 0.5f, y1 = height * 0.5f;
            Vector3[] vertices =
            {
                new Vector3(-lowerX * .5f, y0, -lowerZ * .5f), new Vector3(lowerX * .5f, y0, -lowerZ * .5f),
                new Vector3(lowerX * .5f, y0, lowerZ * .5f), new Vector3(-lowerX * .5f, y0, lowerZ * .5f),
                new Vector3(-upperX * .5f, y1, -upperZ * .5f), new Vector3(upperX * .5f, y1, -upperZ * .5f),
                new Vector3(upperX * .5f, y1, upperZ * .5f), new Vector3(-upperX * .5f, y1, upperZ * .5f)
            };
            int[] triangles =
            {
                0,2,1, 0,3,2, 4,5,6, 4,6,7,
                0,1,5, 0,5,4, 1,2,6, 1,6,5,
                2,3,7, 2,7,6, 3,0,4, 3,4,7
            };
            return Build(name, vertices, triangles);
        }

        private static Mesh Prism(string name, int sides)
        {
            Vector3[] vertices = new Vector3[sides * 2];
            for (int i = 0; i < sides; i++)
            {
                float angle = Mathf.PI * 2f * i / sides + Mathf.PI / sides;
                float x = Mathf.Cos(angle) * 0.5f, z = Mathf.Sin(angle) * 0.5f;
                vertices[i] = new Vector3(x, -0.5f, z);
                vertices[i + sides] = new Vector3(x, 0.5f, z);
            }
            int[] triangles = new int[sides * 12];
            int cursor = 0;
            for (int i = 0; i < sides; i++)
            {
                int next = (i + 1) % sides;
                triangles[cursor++] = i; triangles[cursor++] = next; triangles[cursor++] = i + sides;
                triangles[cursor++] = next; triangles[cursor++] = next + sides; triangles[cursor++] = i + sides;
                triangles[cursor++] = 0; triangles[cursor++] = i; triangles[cursor++] = next;
                triangles[cursor++] = sides; triangles[cursor++] = next + sides; triangles[cursor++] = i + sides;
            }
            return Build(name, vertices, triangles);
        }

        private static Mesh Blade(string name)
        {
            Vector3[] vertices =
            {
                new Vector3(-.42f,-.5f,-.12f), new Vector3(.42f,-.5f,-.12f), new Vector3(0f,.5f,-.12f),
                new Vector3(-.42f,-.5f,.12f), new Vector3(.42f,-.5f,.12f), new Vector3(0f,.5f,.12f)
            };
            int[] triangles =
            {
                0,1,2, 3,5,4, 0,3,4, 0,4,1,
                1,4,5, 1,5,2, 2,5,3, 2,3,0
            };
            return Build(name, vertices, triangles);
        }

        private static Mesh Build(string name, Vector3[] vertices, int[] triangles)
        {
            Mesh mesh = new Mesh { name = name };
            mesh.vertices = vertices;
            mesh.triangles = triangles;
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            mesh.UploadMeshData(false);
            return mesh;
        }
    }
}
