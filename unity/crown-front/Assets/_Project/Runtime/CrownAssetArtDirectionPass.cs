using System;
using UnityEngine;
using UnityEngine.Rendering;

namespace CrownFront.Cloud
{
    [DefaultExecutionOrder(1800)]
    public sealed class CrownAssetArtDirectionPass : MonoBehaviour
    {
        private Material _hullDark;
        private Material _hullMid;
        private Material _hullEdge;
        private Material _blueArmor;
        private Material _redArmor;
        private Material _gold;
        private bool _applied;

        private void Start() => ApplyNow();

        public void ApplyNow()
        {
            if (_applied) return;
            CrownAssetArtReboot assetLayer = GetComponent<CrownAssetArtReboot>();
            if (assetLayer == null) return;
            assetLayer.ApplyNow();

            CreateMaterials();
            RescaleComposition();
            RepaintStaticTitan();
            RepaintBuildings();
            RepaintUnits();
            ConfigureValues();
            _applied = true;
            Debug.Log("CROWN//FRONT asset Art Direction pass applied: controlled exposure, graphite hierarchy, faction palette and revised portrait composition.");
        }

        private void CreateMaterials()
        {
            Shader shader = Shader.Find("CrownFront/EngineSurface") ??
                            Shader.Find("Universal Render Pipeline/Lit") ??
                            Shader.Find("Standard") ??
                            Shader.Find("Unlit/Color");
            if (shader == null) throw new InvalidOperationException("No shader available for asset Art Direction pass.");

            _hullDark = Create(shader, "Asset Direction // Hull Dark", new Color(0.018f, 0.026f, 0.040f), 0.82f, 0.35f, Color.black);
            _hullMid = Create(shader, "Asset Direction // Hull Mid", new Color(0.075f, 0.105f, 0.145f), 0.88f, 0.48f, Color.black);
            _hullEdge = Create(shader, "Asset Direction // Hull Edge", new Color(0.25f, 0.32f, 0.39f), 0.92f, 0.62f, Color.black);
            _blueArmor = Create(shader, "Asset Direction // Vanguard", new Color(0.02f, 0.16f, 0.40f), 0.72f, 0.56f, new Color(0f, 0.055f, 0.20f));
            _redArmor = Create(shader, "Asset Direction // Hostile", new Color(0.40f, 0.025f, 0.012f), 0.74f, 0.54f, new Color(0.20f, 0.006f, 0f));
            _gold = Create(shader, "Asset Direction // Crown Brass", new Color(0.34f, 0.20f, 0.045f), 0.94f, 0.58f, Color.black);
        }

        private static Material Create(Shader shader, string name, Color color, float metallic, float smoothness, Color emission)
        {
            Material material = new Material(shader) { name = name, enableInstancing = true };
            if (material.HasProperty("_Color")) material.SetColor("_Color", color);
            if (material.HasProperty("_BaseColor")) material.SetColor("_BaseColor", color);
            if (material.HasProperty("_Metallic")) material.SetFloat("_Metallic", metallic);
            if (material.HasProperty("_Glossiness")) material.SetFloat("_Glossiness", smoothness);
            if (material.HasProperty("_Smoothness")) material.SetFloat("_Smoothness", smoothness);
            if (emission.maxColorComponent > 0.001f)
            {
                material.EnableKeyword("_EMISSION");
                if (material.HasProperty("_EmissionColor")) material.SetColor("_EmissionColor", emission);
            }
            return material;
        }

        private static Transform FindDeep(Transform root, string name)
        {
            Transform[] transforms = root.GetComponentsInChildren<Transform>(true);
            for (int i = 0; i < transforms.Length; i++)
            {
                if (transforms[i].name == name) return transforms[i];
            }
            return null;
        }

        private void RescaleComposition()
        {
            GameObject rootObject = GameObject.Find("ASSET ART REBOOT // TITAN");
            if (rootObject == null) return;
            Transform root = rootObject.transform;

            Scale(root, "Cross Body Junction", new Vector3(3.1f, 0.72f, 1.55f));
            Scale(root, "Crown Junction", new Vector3(2.05f, 1.05f, 2.05f));
            Scale(root, "Cranium", new Vector3(3.2f, 2.8f, 2.7f));
            Scale(root, "Central Crown Prong", new Vector3(2.0f, 2.35f, 2.0f));
            Scale(root, "Left Crown Prong", new Vector3(1.15f, 1.45f, 1.15f));
            Scale(root, "Right Crown Prong", new Vector3(1.15f, 1.45f, 1.15f));
            ScaleAll(root, "Route Platform", 0.78f);
            ScaleAll(root, "Outer Armor Edge", 0.84f);

            Transform head = FindDeep(root, "Mechanical King Head");
            if (head != null) head.localPosition = new Vector3(0f, -0.2f, 0.4f);
        }

        private static void Scale(Transform root, string name, Vector3 scale)
        {
            Transform transform = FindDeep(root, name);
            if (transform != null) transform.localScale = scale;
        }

        private static void ScaleAll(Transform root, string name, float factor)
        {
            Transform[] transforms = root.GetComponentsInChildren<Transform>(true);
            for (int i = 0; i < transforms.Length; i++)
            {
                if (transforms[i].name == name) transforms[i].localScale *= factor;
            }
        }

        private void RepaintStaticTitan()
        {
            GameObject rootObject = GameObject.Find("ASSET ART REBOOT // TITAN");
            if (rootObject == null) return;
            Renderer[] renderers = rootObject.GetComponentsInChildren<Renderer>(true);
            for (int i = 0; i < renderers.Length; i++)
            {
                Renderer renderer = renderers[i];
                string path = BuildPath(renderer.transform, rootObject.transform);
                if (IsEnergy(path)) continue;

                Material material = _hullDark;
                if (path.Contains("Crown") || path.Contains("Junction")) material = _gold;
                else if (path.Contains("Route") || path.Contains("Platform") || path.Contains("Wall")) material = _hullMid;
                else if (path.Contains("Pipe") || path.Contains("Machinery") || path.Contains("Robot")) material = _hullEdge;
                Apply(renderer, material, _hullDark, _hullMid);
            }
        }

        private void RepaintBuildings()
        {
            CrownBuilding[] buildings = FindObjectsByType<CrownBuilding>(FindObjectsInactive.Include);
            for (int i = 0; i < buildings.Length; i++)
            {
                CrownBuilding building = buildings[i];
                Transform root = FindDeep(building.transform, building.IsCore ? "ASSET ART // CORE" : "ASSET ART // TOWER");
                if (root == null) continue;
                Material team = building.Team == CrownTeam.Blue ? _blueArmor : _redArmor;
                Renderer[] renderers = root.GetComponentsInChildren<Renderer>(true);
                for (int r = 0; r < renderers.Length; r++)
                {
                    string name = renderers[r].transform.name;
                    if (IsEnergy(name)) continue;
                    Apply(renderers[r], r % 3 == 0 ? team : _hullMid, _hullDark, _hullEdge);
                }
            }
        }

        private void RepaintUnits()
        {
            CrownUnit[] units = FindObjectsByType<CrownUnit>(FindObjectsInactive.Include);
            for (int i = 0; i < units.Length; i++)
            {
                CrownUnit unit = units[i];
                Transform root = FindDeep(unit.transform, "ASSET ART // UNIT");
                if (root == null) continue;
                Material team = unit.Team == CrownTeam.Blue ? _blueArmor : _redArmor;
                Renderer[] renderers = root.GetComponentsInChildren<Renderer>(true);
                for (int r = 0; r < renderers.Length; r++)
                {
                    string name = renderers[r].transform.name;
                    if (IsEnergy(name)) continue;
                    Material primary = name.Contains("Weapon") ? _hullEdge : (r % 3 == 0 ? team : _hullMid);
                    Apply(renderers[r], primary, _hullDark, team);
                }
            }
        }

        private static void Apply(Renderer renderer, Material primary, Material secondary, Material tertiary)
        {
            int count = Mathf.Max(1, renderer.sharedMaterials.Length);
            Material[] materials = new Material[count];
            for (int i = 0; i < count; i++) materials[i] = i % 3 == 0 ? primary : i % 3 == 1 ? secondary : tertiary;
            renderer.sharedMaterials = materials;
            renderer.enabled = true;
            renderer.shadowCastingMode = ShadowCastingMode.On;
            renderer.receiveShadows = true;
        }

        private static bool IsEnergy(string value)
        {
            return value.Contains("Energy") || value.Contains("Eye") || value.Contains("Lens") || value.Contains("Visor") || value.Contains("Aperture") || value.Contains("White Center");
        }

        private static string BuildPath(Transform transform, Transform stop)
        {
            string path = transform.name;
            Transform current = transform.parent;
            while (current != null && current != stop)
            {
                path = current.name + "/" + path;
                current = current.parent;
            }
            return path;
        }

        private void ConfigureValues()
        {
            RenderSettings.fogColor = new Color(0.005f, 0.010f, 0.020f);
            RenderSettings.fogDensity = 0.0045f;
            RenderSettings.ambientSkyColor = new Color(0.12f, 0.17f, 0.24f);
            RenderSettings.ambientEquatorColor = new Color(0.035f, 0.052f, 0.08f);
            RenderSettings.ambientGroundColor = new Color(0.007f, 0.010f, 0.017f);

            Light[] lights = FindObjectsByType<Light>(FindObjectsInactive.Exclude);
            for (int i = 0; i < lights.Length; i++)
            {
                if (lights[i].type == LightType.Directional)
                {
                    lights[i].enabled = true;
                    lights[i].intensity = 0.82f;
                    lights[i].color = new Color(0.72f, 0.82f, 1f);
                    lights[i].transform.rotation = Quaternion.Euler(50f, -34f, -8f);
                }
                else lights[i].enabled = false;
            }
        }
    }
}
