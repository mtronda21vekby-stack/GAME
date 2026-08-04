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
        private Material _whiteEnergy;
        private Material _brass;
        private Mesh _plate;
        private Mesh _blade;
        private bool _applied;

        private void Start() => ApplyNow();

        public void ApplyNow()
        {
            if (_applied) return;

            CrownQuaterniusHybridPolish hybrid = GetComponent<CrownQuaterniusHybridPolish>();
            if (hybrid == null) return;
            hybrid.ApplyNow();

            CreateMeshes();
            CreateMaterials();
            GradeKingFoundation();
            GradeQuaterniusDetails();
            GradeBuildings();
            GradeUnits();
            GradeLighting();
            GradeCamera();
            _applied = true;

            Debug.Log("CROWN//FRONT final Quaternius grade applied: neutral armored routes, compact reactor, integrated towers and tactical unit chassis.");
        }

        private void CreateMeshes()
        {
            _plate = CrownAuthoredMeshFactory.CreateTaperedBox("FinalGrade_Plate", 0.72f, 0.80f, 0.86f);
            _blade = CrownAuthoredMeshFactory.CreateBlade("FinalGrade_Blade");
        }

        private void CreateMaterials()
        {
            Shader shader = Shader.Find("CrownFront/EngineSurface") ??
                            Shader.Find("Universal Render Pipeline/Lit") ??
                            Shader.Find("Standard") ??
                            Shader.Find("Unlit/Color");
            if (shader == null) throw new InvalidOperationException("Final grade requires a WebGL-compatible shader.");

            _graphite = Create(shader, "FINAL GRADE // Graphite", new Color(0.040f, 0.058f, 0.086f), 0.86f, 0.46f, Color.black);
            _steel = Create(shader, "FINAL GRADE // Steel", new Color(0.23f, 0.30f, 0.38f), 0.92f, 0.66f, Color.black);
            _blueTrim = Create(shader, "FINAL GRADE // Vanguard Trim", new Color(0.030f, 0.095f, 0.17f), 0.82f, 0.56f, new Color(0f, 0.022f, 0.065f));
            _redTrim = Create(shader, "FINAL GRADE // Hostile Trim", new Color(0.17f, 0.050f, 0.030f), 0.82f, 0.54f, new Color(0.060f, 0.006f, 0f));
            _blueEnergy = Create(shader, "FINAL GRADE // Vanguard Energy", new Color(0.02f, 0.76f, 1f), 0.04f, 0.94f, new Color(0f, 2.0f, 4.0f));
            _redEnergy = Create(shader, "FINAL GRADE // Hostile Energy", new Color(1f, 0.13f, 0.01f), 0.04f, 0.92f, new Color(4.0f, 0.20f, 0f));
            _whiteEnergy = Create(shader, "FINAL GRADE // Crown Energy", new Color(0.88f, 0.96f, 1f), 0.03f, 0.96f, new Color(2.4f, 3.0f, 3.8f));
            _brass = Create(shader, "FINAL GRADE // Crown Brass", new Color(0.36f, 0.22f, 0.055f), 0.94f, 0.64f, Color.black);
        }

        private static Material Create(Shader shader, string name, Color color, float metallic, float smoothness, Color emission)
        {
            Material material = new Material(shader)
            {
                name = name,
                enableInstancing = true
            };
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

            ApplyToNamedParts(root, "Shield Rib", _steel);
            ApplyToNamedParts(root, "Blade Plate", _graphite);
            ApplyToNamedParts(root, "Crown Vertebra", _graphite);
            ApplyToNamedParts(root, "Sternum Mass", _graphite);
            ApplyToNamedParts(root, "Upper Breastplate", _steel);
            ApplyToNamedParts(root, "Lower Breastplate", _steel);
            ApplyToNamedParts(root, "Shoulder Citadel", _graphite);
            ApplyToNamedParts(root, "Crown Cranium", _graphite);
            ApplyToNamedParts(root, "Face Shield", _graphite);
            ApplyToNamedParts(root, "Jaw Keel", _steel);
            ApplyToNamedParts(root, "Crown Prong", _brass);
            ApplyToNamedParts(root, "Shield Conduit", _blueEnergy);
            ApplyToNamedParts(root, "Blade Conduit", _redEnergy);
            ApplyToNamedParts(root, "Spinal Energy Channel", _whiteEnergy);

            Transform[] transforms = root.GetComponentsInChildren<Transform>(true);
            for (int i = 0; i < transforms.Length; i++)
            {
                Transform current = transforms[i];
                if (!string.Equals(current.name, "Crown Prong", StringComparison.Ordinal)) continue;
                current.localScale = new Vector3(
                    current.localScale.x * 0.84f,
                    current.localScale.y * 0.64f,
                    current.localScale.z * 0.84f);
                current.localPosition += Vector3.down * 1.25f;
            }
        }

        private void GradeQuaterniusDetails()
        {
            GameObject titanObject = GameObject.Find("THE CROWN ENGINE // PRESENTATION ROOT");
            if (titanObject == null) return;
            Transform root = FindDeep(titanObject.transform, "QUATERNIUS ART REBOOT // MECHANICAL KING");
            if (root == null) return;

            Transform weakDeck = FindDeep(root, "Anatomical Combat Deck");
            if (weakDeck != null) weakDeck.gameObject.SetActive(false);

            ApplyToNamedParts(root, "Central Sternum Hull", _graphite);
            ApplyToNamedParts(root, "Lower Torso Bastion", _graphite);
            ApplyToNamedParts(root, "Cross Body Weapon Bridge", _steel);
            ApplyToNamedParts(root, "Anatomical Outer Support", _steel);
            ApplyToNamedParts(root, "Left Shoulder Fortress", _steel);
            ApplyToNamedParts(root, "Right Shoulder Fortress", _steel);
            ApplyToNamedParts(root, "Crown Cranium", _graphite);
            ApplyToNamedParts(root, "Face Mask", _graphite);
            ApplyToNamedParts(root, "Crown Rail Prong", _brass);

            Transform polish = FindDeep(titanObject.transform, "HYBRID POLISH // TITAN ACCENTS");
            if (polish == null) return;
            Transform[] transforms = polish.GetComponentsInChildren<Transform>(true);
            for (int i = 0; i < transforms.Length; i++)
            {
                Transform current = transforms[i];
                if (current.name.IndexOf("Crown Silhouette", StringComparison.OrdinalIgnoreCase) < 0) continue;
                current.localScale = new Vector3(
                    current.localScale.x * 0.80f,
                    current.localScale.y * 0.68f,
                    current.localScale.z * 0.80f);
                current.localPosition += Vector3.down * 1.20f;
            }
        }

        private void GradeBuildings()
        {
            CrownBuilding[] buildings = FindObjectsByType<CrownBuilding>(FindObjectsInactive.Include);
            for (int i = 0; i < buildings.Length; i++)
            {
                CrownBuilding building = buildings[i];
                if (building == null) continue;
                if (building.IsCore) GradeCore(building);
                else GradeTower(building);
            }
        }

        private void GradeCore(CrownBuilding building)
        {
            bool blue = building.Team == CrownTeam.Blue;
            Material energy = blue ? _blueEnergy : _redEnergy;

            Transform qCore = FindDeep(building.transform, "QUATERNIUS ART // CORE");
            if (qCore != null)
            {
                Transform baseModel = FindDeep(qCore, "Embedded Reactor Base");
                if (baseModel != null)
                {
                    baseModel.localScale = new Vector3(0.70f, 0.58f, 0.70f);
                    ApplyToRenderers(baseModel, _graphite);
                }
                SetActiveNamed(qCore, "Reactor Containment Dome", false);
                SetActiveNamed(qCore, "Reactor Stabilizers", false);
                Transform lens = FindDeep(qCore, "Living Crown Lens");
                if (lens != null)
                {
                    lens.localScale = Vector3.one * 0.18f;
                    lens.localPosition = new Vector3(0f, 1.00f, 0f);
                    ApplyToRenderers(lens, energy);
                }
            }

            Transform corePolish = FindDeep(building.transform, "HYBRID POLISH // CORE");
            if (corePolish == null) return;

            Transform outer = FindDeep(corePolish, "Outer Magnetic Ring");
            if (outer != null)
            {
                outer.localScale = Vector3.one * 0.78f;
                outer.localPosition = new Vector3(0f, 1.00f, 0f);
                ApplyToRenderers(outer, _steel);
            }
            SetActiveNamed(corePolish, "Inner Magnetic Ring", false);

            Transform focused = FindDeep(corePolish, "Focused Reactor Core");
            if (focused != null)
            {
                focused.localScale = new Vector3(0.22f, 0.68f, 0.22f);
                focused.localPosition = new Vector3(0f, 1.00f, 0f);
                ApplyToRenderers(focused, _whiteEnergy);
            }

            Transform[] parts = corePolish.GetComponentsInChildren<Transform>(true);
            for (int i = 0; i < parts.Length; i++)
            {
                Transform current = parts[i];
                Vector3 radial = new Vector3(current.localPosition.x, 0f, current.localPosition.z);
                if (radial.sqrMagnitude < 0.001f) radial = Vector3.forward;
                radial.Normalize();
                if (string.Equals(current.name, "Reactor Armor Fin", StringComparison.Ordinal))
                {
                    current.localPosition = radial * 1.16f + Vector3.up * 0.52f;
                    current.localScale = new Vector3(0.30f, 0.52f, 0.36f);
                    ApplyToRenderers(current, _graphite);
                }
                else if (string.Equals(current.name, "Reactor Fin Energy", StringComparison.Ordinal))
                {
                    current.localPosition = radial * 1.16f + Vector3.up * 0.66f;
                    current.localScale = new Vector3(0.07f, 0.26f, 0.09f);
                    ApplyToRenderers(current, energy);
                }
            }
        }

        private void GradeTower(CrownBuilding building)
        {
            bool blue = building.Team == CrownTeam.Blue;
            Material trim = blue ? _blueTrim : _redTrim;
            Material energy = blue ? _blueEnergy : _redEnergy;
            float forward = blue ? 1f : -1f;

            Transform qTower = FindDeep(building.transform, "QUATERNIUS ART // TOWER");
            if (qTower != null)
            {
                Transform socket = FindDeep(qTower, "Tower Armored Socket");
                if (socket != null)
                {
                    socket.localScale = new Vector3(0.55f, 0.50f, 0.55f);
                    ApplyToRenderers(socket, _graphite);
                }
                Transform head = FindDeep(qTower, "QuadShell Weapon Head");
                if (head != null)
                {
                    head.localScale = Vector3.one * 0.58f;
                    ApplyToRenderers(head, trim);
                }
                ApplyToNamedParts(qTower, "Left Tower Rail", _steel);
                ApplyToNamedParts(qTower, "Right Tower Rail", _steel);
                ApplyToNamedParts(qTower, "Tower Team Aperture", energy);
            }

            Transform towerPolish = FindDeep(building.transform, "HYBRID POLISH // TOWER");
            if (towerPolish != null)
            {
                SetActiveNamed(towerPolish, "Tower Armor Collar", false);
                SetActiveNamed(towerPolish, "Tower Floor Aperture", false);
                Transform spine = FindDeep(towerPolish, "Tower Energy Spine");
                if (spine != null)
                {
                    spine.localScale = new Vector3(0.08f, 0.34f, 0.08f);
                    ApplyToRenderers(spine, energy);
                }
            }

            if (FindDeep(building.transform, "FINAL GRADE // TOWER") != null) return;
            Transform finalTower = Group("FINAL GRADE // TOWER", building.transform);
            Part("Armored Deck Socket", finalTower, _plate, new Vector3(0f, 0.09f, 0f), new Vector3(1.28f, 0.12f, 1.38f), _graphite);
            Part("Faction Yaw Plate", finalTower, _plate, new Vector3(0f, 0.48f, 0f), new Vector3(0.88f, 0.16f, 0.86f), trim);
            Part("Left Rail Silhouette", finalTower, _blade, new Vector3(-0.27f, 0.78f, forward * 0.54f), new Vector3(0.12f, 0.13f, 0.82f), _steel, new Vector3(0f, blue ? 0f : 180f, 0f));
            Part("Right Rail Silhouette", finalTower, _blade, new Vector3(0.27f, 0.78f, forward * 0.54f), new Vector3(0.12f, 0.13f, 0.82f), _steel, new Vector3(0f, blue ? 0f : 180f, 0f));
            Part("Faction Aperture", finalTower, _blade, new Vector3(0f, 0.55f, forward * 0.52f), new Vector3(0.08f, 0.18f, 0.11f), energy, new Vector3(0f, blue ? 0f : 180f, 0f));
        }

        private void GradeUnits()
        {
            CrownUnit[] units = FindObjectsByType<CrownUnit>(FindObjectsInactive.Include);
            for (int i = 0; i < units.Length; i++)
            {
                CrownUnit unit = units[i];
                if (unit == null) continue;
                GradeUnit(unit);
            }
        }

        private void GradeUnit(CrownUnit unit)
        {
            bool blue = unit.Team == CrownTeam.Blue;
            Color tint = blue ? new Color(0.17f, 0.28f, 0.43f) : new Color(0.43f, 0.18f, 0.12f);
            Material trim = blue ? _blueTrim : _redTrim;
            Material energy = blue ? _blueEnergy : _redEnergy;

            Transform qRoot = FindDeep(unit.transform, "QUATERNIUS ART // UNIT");
            if (qRoot == null) return;
            TintRenderers(qRoot, tint);
            ApplyToNamedParts(qRoot, "Class Weapon", _steel);
            ApplyToNamedParts(qRoot, "Faction Energy Signature", energy);

            Transform body = FindDeep(qRoot, "Faction Combat Drone");
            if (body != null)
            {
                if (unit.Kind == CrownUnitKind.Tank)
                {
                    body.localScale = new Vector3(0.72f, 0.48f, 0.72f);
                    body.localPosition = new Vector3(0f, 0.50f, 0f);
                }
                else if (unit.Kind == CrownUnitKind.Raider)
                {
                    body.localScale = Vector3.one * 0.36f;
                    body.localPosition = new Vector3(0f, 0.72f, 0f);
                }
                else
                {
                    body.localScale = new Vector3(0.52f, 0.40f, 0.52f);
                    body.localPosition = new Vector3(0f, 0.68f, 0f);
                }
            }

            Transform hybrid = FindDeep(unit.transform, "HYBRID POLISH // UNIT");
            if (hybrid != null)
            {
                SetActiveNamed(hybrid, "Unit Ground Signature", false);
                Transform vertical = FindDeep(hybrid, "Unit Vertical Signature");
                if (vertical != null)
                {
                    vertical.localScale = new Vector3(0.07f, 0.24f, 0.06f);
                    ApplyToRenderers(vertical, energy);
                }
            }

            if (FindDeep(unit.transform, "FINAL GRADE // UNIT") != null) return;
            Transform finalUnit = Group("FINAL GRADE // UNIT", unit.transform);
            if (unit.Kind == CrownUnitKind.Tank)
            {
                Part("Heavy Armored Chassis", finalUnit, _plate, new Vector3(0f, 0.54f, 0f), new Vector3(0.90f, 0.54f, 0.82f), _graphite);
                Part("Heavy Faction Face", finalUnit, _blade, new Vector3(0f, 0.68f, 0.46f), new Vector3(0.22f, 0.18f, 0.12f), energy);
            }
            else if (unit.Kind == CrownUnitKind.Raider)
            {
                Part("Raider Blade Chassis", finalUnit, _blade, new Vector3(0f, 0.68f, 0f), new Vector3(0.38f, 0.78f, 0.30f), _graphite);
                Part("Raider Faction Face", finalUnit, _blade, new Vector3(0f, 0.82f, 0.28f), new Vector3(0.13f, 0.22f, 0.08f), energy);
            }
            else
            {
                Part("Assault Tapered Chassis", finalUnit, _plate, new Vector3(0f, 0.66f, 0f), new Vector3(0.54f, 0.88f, 0.46f), _graphite);
                Part("Assault Shoulder Trim", finalUnit, _blade, new Vector3(0f, 0.84f, 0.30f), new Vector3(0.34f, 0.18f, 0.10f), trim);
                Part("Assault Faction Face", finalUnit, _blade, new Vector3(0f, 0.92f, 0.40f), new Vector3(0.15f, 0.20f, 0.08f), energy);
            }
            Part("Dark Contact Plate", finalUnit, _plate, new Vector3(0f, 0.035f, 0f), unit.Kind == CrownUnitKind.Tank ? new Vector3(0.72f, 0.05f, 0.78f) : new Vector3(0.46f, 0.04f, 0.54f), _graphite);
        }

        private void GradeLighting()
        {
            RenderSettings.fogColor = new Color(0.011f, 0.020f, 0.036f);
            RenderSettings.fogDensity = 0.0017f;
            RenderSettings.ambientSkyColor = new Color(0.25f, 0.32f, 0.42f);
            RenderSettings.ambientEquatorColor = new Color(0.085f, 0.12f, 0.18f);
            RenderSettings.ambientGroundColor = new Color(0.018f, 0.028f, 0.048f);

            Light[] lights = FindObjectsByType<Light>(FindObjectsInactive.Exclude);
            for (int i = 0; i < lights.Length; i++)
            {
                Light light = lights[i];
                if (light.type == LightType.Directional)
                {
                    light.intensity = 1.22f;
                    light.color = new Color(0.78f, 0.87f, 1f);
                }
                else if (string.Equals(light.name, "Vanguard Rim", StringComparison.Ordinal)) light.intensity = 3.4f;
                else if (string.Equals(light.name, "Hostile Rim", StringComparison.Ordinal)) light.intensity = 3.6f;
                else if (string.Equals(light.name, "Crown Key", StringComparison.Ordinal)) light.intensity = 3.2f;
            }
        }

        private void GradeCamera()
        {
            Camera camera = Camera.main;
            if (camera == null) return;
            CrownHybridHeroCamera oldRig = camera.GetComponent<CrownHybridHeroCamera>();
            if (oldRig != null) oldRig.enabled = false;
            camera.fieldOfView = 33.5f;
            camera.backgroundColor = new Color(0.009f, 0.017f, 0.032f);

            CrownFinalGradeCamera rig = camera.GetComponent<CrownFinalGradeCamera>();
            if (rig == null) rig = camera.gameObject.AddComponent<CrownFinalGradeCamera>();
            rig.Configure(new Vector3(0f, 25.8f, -36.2f), new Vector3(0f, 2.50f, 2.0f));
        }

        private static void SetActiveNamed(Transform root, string name, bool active)
        {
            Transform[] transforms = root.GetComponentsInChildren<Transform>(true);
            for (int i = 0; i < transforms.Length; i++)
            {
                if (string.Equals(transforms[i].name, name, StringComparison.Ordinal)) transforms[i].gameObject.SetActive(active);
            }
        }

        private static Transform Group(string name, Transform parent)
        {
            GameObject group = new GameObject(name);
            group.transform.SetParent(parent, false);
            return group.transform;
        }

        private static GameObject Part(string name, Transform parent, Mesh mesh, Vector3 position, Vector3 scale, Material material, Vector3? euler = null)
        {
            GameObject part = new GameObject(name);
            part.transform.SetParent(parent, false);
            part.transform.localPosition = position;
            part.transform.localScale = scale;
            part.transform.localEulerAngles = euler ?? Vector3.zero;
            MeshFilter filter = part.AddComponent<MeshFilter>();
            filter.sharedMesh = mesh;
            MeshRenderer renderer = part.AddComponent<MeshRenderer>();
            renderer.sharedMaterial = material;
            renderer.shadowCastingMode = ShadowCastingMode.On;
            renderer.receiveShadows = true;
            return part;
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
            transform.position = position + Vector3.back;
            transform.LookAt(target);
        }

        private void LateUpdate()
        {
            float settle = 1f - Mathf.Exp(-(Time.time - _started) * 4.0f);
            Vector3 movement = new Vector3(
                Mathf.Sin(Time.time * 0.19f) * 0.024f,
                Mathf.Sin(Time.time * 0.25f) * 0.030f,
                0f);
            transform.position = Vector3.Lerp(_position + Vector3.back, _position, settle) + movement;
            transform.LookAt(_target + movement * 0.18f);
        }
    }
}
