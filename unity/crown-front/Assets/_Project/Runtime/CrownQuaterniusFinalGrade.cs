using System;
using UnityEngine;
using UnityEngine.Rendering;

namespace CrownFront.Cloud
{
    [DefaultExecutionOrder(3000)]
    public sealed class CrownQuaterniusFinalGrade : MonoBehaviour
    {
        private Material _graphite;
        private Material _steel;
        private Material _blueTrim;
        private Material _redTrim;
        private Material _blueEnergy;
        private Material _redEnergy;
        private Material _brass;
        private bool _applied;

        private void Start() => ApplyNow();

        public void ApplyNow()
        {
            if (_applied) return;
            CrownQuaterniusHybridPolish hybrid = GetComponent<CrownQuaterniusHybridPolish>();
            if (hybrid == null) return;
            hybrid.ApplyNow();

            CreateMaterials();
            GradeKingFoundation();
            GradeQuaterniusDetails();
            GradeBuildings();
            GradeUnits();
            GradeLighting();
            GradeCamera();
            _applied = true;

            Debug.Log("CROWN//FRONT final Quaternius grade applied: graphite-dominant armor, restrained faction trim, compact crown, reduced reactor rings and wider hero framing.");
        }

        private void CreateMaterials()
        {
            Shader shader = Shader.Find("CrownFront/EngineSurface") ??
                            Shader.Find("Universal Render Pipeline/Lit") ??
                            Shader.Find("Standard") ??
                            Shader.Find("Unlit/Color");
            if (shader == null) throw new InvalidOperationException("Final grade requires a WebGL-compatible shader.");

            _graphite = Create(shader, "FINAL GRADE // Graphite", new Color(0.045f, 0.065f, 0.095f), 0.86f, 0.46f, Color.black);
            _steel = Create(shader, "FINAL GRADE // Steel", new Color(0.24f, 0.31f, 0.39f), 0.92f, 0.66f, Color.black);
            _blueTrim = Create(shader, "FINAL GRADE // Vanguard Trim", new Color(0.018f, 0.105f, 0.25f), 0.76f, 0.58f, new Color(0f, 0.045f, 0.16f));
            _redTrim = Create(shader, "FINAL GRADE // Hostile Trim", new Color(0.24f, 0.024f, 0.012f), 0.78f, 0.56f, new Color(0.12f, 0.004f, 0f));
            _blueEnergy = Create(shader, "FINAL GRADE // Vanguard Energy", new Color(0.02f, 0.76f, 1f), 0.04f, 0.94f, new Color(0f, 2.2f, 4.3f));
            _redEnergy = Create(shader, "FINAL GRADE // Hostile Energy", new Color(1f, 0.13f, 0.01f), 0.04f, 0.92f, new Color(4.2f, 0.22f, 0f));
            _brass = Create(shader, "FINAL GRADE // Crown Brass", new Color(0.36f, 0.22f, 0.055f), 0.94f, 0.64f, Color.black);
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

        private void GradeKingFoundation()
        {
            GameObject titanObject = GameObject.Find("THE CROWN ENGINE // PRESENTATION ROOT");
            if (titanObject == null) return;
            Transform root = FindDeep(titanObject.transform, "ART REBOOT // MECHANICAL KING");
            if (root == null) return;

            ApplyToNamedParts(root, "Shield Rib", _blueTrim);
            ApplyToNamedParts(root, "Blade Plate", _redTrim);
            ApplyToNamedParts(root, "Crown Vertebra", _graphite);
            ApplyToNamedParts(root, "Sternum Mass", _graphite);
            ApplyToNamedParts(root, "Upper Breastplate", _steel);
            ApplyToNamedParts(root, "Lower Breastplate", _steel);
            ApplyToNamedParts(root, "Shoulder Citadel", _graphite);
            ApplyToNamedParts(root, "Crown Cranium", _graphite);
            ApplyToNamedParts(root, "Face Shield", _graphite);
            ApplyToNamedParts(root, "Jaw Keel", _steel);
            ApplyToNamedParts(root, "Crown Prong", _brass);

            Transform[] transforms = root.GetComponentsInChildren<Transform>(true);
            for (int i = 0; i < transforms.Length; i++)
            {
                Transform current = transforms[i];
                if (!string.Equals(current.name, "Crown Prong", StringComparison.Ordinal)) continue;
                current.localScale = new Vector3(current.localScale.x * 0.86f, current.localScale.y * 0.66f, current.localScale.z * 0.86f);
                current.localPosition += Vector3.down * 1.25f;
            }
        }

        private void GradeQuaterniusDetails()
        {
            GameObject titanObject = GameObject.Find("THE CROWN ENGINE // PRESENTATION ROOT");
            if (titanObject == null) return;
            Transform root = FindDeep(titanObject.transform, "QUATERNIUS ART REBOOT // MECHANICAL KING");
            if (root == null) return;

            ApplyToNamedParts(root, "Central Sternum Hull", _graphite);
            ApplyToNamedParts(root, "Lower Torso Bastion", _graphite);
            ApplyToNamedParts(root, "Cross Body Weapon Bridge", _steel);
            ApplyToNamedParts(root, "Route Segment", _graphite);
            ApplyToNamedParts(root, "Anatomical Outer Support", _steel);
            ApplyToNamedParts(root, "Left Shoulder Fortress", _blueTrim);
            ApplyToNamedParts(root, "Right Shoulder Fortress", _redTrim);
            ApplyToNamedParts(root, "Crown Cranium", _graphite);
            ApplyToNamedParts(root, "Face Mask", _graphite);
            ApplyToNamedParts(root, "Crown Rail Prong", _brass);

            Transform polish = FindDeep(titanObject.transform, "HYBRID POLISH // TITAN ACCENTS");
            if (polish != null)
            {
                Transform[] transforms = polish.GetComponentsInChildren<Transform>(true);
                for (int i = 0; i < transforms.Length; i++)
                {
                    Transform current = transforms[i];
                    if (current.name.IndexOf("Crown Silhouette", StringComparison.OrdinalIgnoreCase) < 0) continue;
                    current.localScale = new Vector3(current.localScale.x * 0.82f, current.localScale.y * 0.72f, current.localScale.z * 0.82f);
                    current.localPosition += Vector3.down * 1.15f;
                }
            }
        }

        private void GradeBuildings()
        {
            CrownBuilding[] buildings = FindObjectsByType<CrownBuilding>(FindObjectsInactive.Include);
            for (int i = 0; i < buildings.Length; i++)
            {
                CrownBuilding building = buildings[i];
                if (building == null) continue;
                bool blue = building.Team == CrownTeam.Blue;
                Material trim = blue ? _blueTrim : _redTrim;
                Material energy = blue ? _blueEnergy : _redEnergy;

                Transform qCore = FindDeep(building.transform, "QUATERNIUS ART // CORE");
                if (qCore != null)
                {
                    ApplyToNamedParts(qCore, "Embedded Reactor Base", _graphite);
                    ApplyToNamedParts(qCore, "Reactor Containment Dome", trim);
                    Transform lens = FindDeep(qCore, "Living Crown Lens");
                    if (lens != null) lens.localScale = Vector3.one * 0.36f;
                }

                Transform corePolish = FindDeep(building.transform, "HYBRID POLISH // CORE");
                if (corePolish != null)
                {
                    Transform outer = FindDeep(corePolish, "Outer Magnetic Ring");
                    if (outer != null)
                    {
                        outer.localScale = Vector3.one * 1.42f;
                        ApplyToRenderers(outer, trim);
                    }
                    Transform inner = FindDeep(corePolish, "Inner Magnetic Ring");
                    if (inner != null)
                    {
                        inner.localScale = Vector3.one * 1.05f;
                        ApplyToRenderers(inner, _steel);
                    }
                    ApplyToNamedParts(corePolish, "Reactor Fin Energy", energy);
                }

                Transform qTower = FindDeep(building.transform, "QUATERNIUS ART // TOWER");
                if (qTower != null)
                {
                    ApplyToNamedParts(qTower, "Tower Armored Socket", _graphite);
                    ApplyToNamedParts(qTower, "QuadShell Weapon Head", trim);
                    ApplyToNamedParts(qTower, "Left Tower Rail", _steel);
                    ApplyToNamedParts(qTower, "Right Tower Rail", _steel);
                    ApplyToNamedParts(qTower, "Tower Team Aperture", energy);
                }

                Transform towerPolish = FindDeep(building.transform, "HYBRID POLISH // TOWER");
                if (towerPolish != null)
                {
                    ApplyToNamedParts(towerPolish, "Tower Armor Collar", trim);
                    ApplyToNamedParts(towerPolish, "Tower Floor Aperture", _steel);
                    ApplyToNamedParts(towerPolish, "Tower Energy Spine", energy);
                }
            }
        }

        private void GradeUnits()
        {
            CrownUnit[] units = FindObjectsByType<CrownUnit>(FindObjectsInactive.Include);
            for (int i = 0; i < units.Length; i++)
            {
                CrownUnit unit = units[i];
                if (unit == null) continue;
                bool blue = unit.Team == CrownTeam.Blue;
                Color tint = blue ? new Color(0.32f, 0.50f, 0.82f) : new Color(0.80f, 0.30f, 0.19f);
                Material energy = blue ? _blueEnergy : _redEnergy;

                Transform root = FindDeep(unit.transform, "QUATERNIUS ART // UNIT");
                if (root != null)
                {
                    TintRenderers(root, tint);
                    ApplyToNamedParts(root, "Class Weapon", _steel);
                    ApplyToNamedParts(root, "Faction Energy Signature", energy);
                }

                Transform polish = FindDeep(unit.transform, "HYBRID POLISH // UNIT");
                if (polish != null)
                {
                    ApplyToNamedParts(polish, "Unit Ground Signature", energy);
                    ApplyToNamedParts(polish, "Unit Vertical Signature", energy);
                }
            }
        }

        private void GradeLighting()
        {
            RenderSettings.fogColor = new Color(0.011f, 0.020f, 0.036f);
            RenderSettings.fogDensity = 0.0018f;
            RenderSettings.ambientSkyColor = new Color(0.25f, 0.32f, 0.42f);
            RenderSettings.ambientEquatorColor = new Color(0.085f, 0.12f, 0.18f);
            RenderSettings.ambientGroundColor = new Color(0.018f, 0.028f, 0.048f);

            Light[] lights = FindObjectsByType<Light>(FindObjectsInactive.Exclude);
            for (int i = 0; i < lights.Length; i++)
            {
                Light light = lights[i];
                if (light.type == LightType.Directional)
                {
                    light.intensity = 1.16f;
                    light.color = new Color(0.77f, 0.86f, 1f);
                }
                else if (string.Equals(light.name, "Vanguard Rim", StringComparison.Ordinal))
                {
                    light.intensity = 4.0f;
                }
                else if (string.Equals(light.name, "Hostile Rim", StringComparison.Ordinal))
                {
                    light.intensity = 4.2f;
                }
                else if (string.Equals(light.name, "Crown Key", StringComparison.Ordinal))
                {
                    light.intensity = 3.6f;
                }
            }
        }

        private void GradeCamera()
        {
            Camera camera = Camera.main;
            if (camera == null) return;
            CrownHybridHeroCamera oldRig = camera.GetComponent<CrownHybridHeroCamera>();
            if (oldRig != null) oldRig.enabled = false;
            camera.fieldOfView = 35.5f;
            camera.backgroundColor = new Color(0.009f, 0.017f, 0.032f);

            CrownFinalGradeCamera rig = camera.GetComponent<CrownFinalGradeCamera>();
            if (rig == null) rig = camera.gameObject.AddComponent<CrownFinalGradeCamera>();
            rig.Configure(new Vector3(0f, 27.0f, -39.0f), new Vector3(0f, 2.45f, 2.0f));
        }

        private static void ApplyToNamedParts(Transform root, string name, Material material)
        {
            Transform[] transforms = root.GetComponentsInChildren<Transform>(true);
            for (int i = 0; i < transforms.Length; i++)
            {
                if (!string.Equals(transforms[i].name, name, StringComparison.Ordinal)) continue;
                ApplyToRenderers(transforms[i], material);
            }
        }

        private static void ApplyToRenderers(Transform root, Material material)
        {
            Renderer[] renderers = root.GetComponentsInChildren<Renderer>(true);
            for (int i = 0; i < renderers.Length; i++)
            {
                int count = Mathf.Max(1, renderers[i].sharedMaterials.Length);
                Material[] materials = new Material[count];
                for (int index = 0; index < count; index++) materials[index] = material;
                renderers[i].sharedMaterials = materials;
                renderers[i].enabled = true;
                renderers[i].shadowCastingMode = ShadowCastingMode.On;
                renderers[i].receiveShadows = true;
            }
        }

        private static void TintRenderers(Transform root, Color tint)
        {
            Renderer[] renderers = root.GetComponentsInChildren<Renderer>(true);
            MaterialPropertyBlock block = new MaterialPropertyBlock();
            for (int i = 0; i < renderers.Length; i++)
            {
                renderers[i].GetPropertyBlock(block);
                block.SetColor("_Color", tint);
                block.SetColor("_BaseColor", tint);
                renderers[i].SetPropertyBlock(block);
                block.Clear();
            }
        }

        private static Transform FindDeep(Transform root, string name)
        {
            Transform[] transforms = root.GetComponentsInChildren<Transform>(true);
            for (int i = 0; i < transforms.Length; i++)
            {
                if (string.Equals(transforms[i].name, name, StringComparison.Ordinal)) return transforms[i];
            }
            return null;
        }
    }

    public sealed class CrownFinalGradeCamera : MonoBehaviour
    {
        private Vector3 _position;
        private Vector3 _target;
        private float _started;

        public void Configure(Vector3 position, Vector3 target)
        {
            _position = position;
            _target = target;
            _started = Time.time;
            transform.position = position + Vector3.back * 1.0f;
            transform.LookAt(target);
        }

        private void LateUpdate()
        {
            float settle = 1f - Mathf.Exp(-(Time.time - _started) * 4.0f);
            Vector3 movement = new Vector3(Mathf.Sin(Time.time * 0.19f) * 0.024f, Mathf.Sin(Time.time * 0.25f) * 0.030f, 0f);
            transform.position = Vector3.Lerp(_position + Vector3.back, _position, settle) + movement;
            transform.LookAt(_target + movement * 0.18f);
        }
    }
}
