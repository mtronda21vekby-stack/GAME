using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Rendering;

namespace CrownFront.Cloud
{
    [DefaultExecutionOrder(1200)]
    public sealed class CrownArtRebootIteration2 : MonoBehaviour
    {
        private readonly Dictionary<string, Material> _materials = new Dictionary<string, Material>(12);
        private readonly HashSet<CrownBuilding> _buildings = new HashSet<CrownBuilding>();
        private readonly HashSet<CrownUnit> _units = new HashSet<CrownUnit>();

        private Transform _titan;
        private Mesh _plate;
        private Mesh _hardPlate;
        private Mesh _hex;
        private Mesh _wedge;
        private Mesh _blade;
        private Mesh _ring;
        private bool _applied;
        private float _nextScan;

        private void Start()
        {
            ApplyNow();
        }

        private void Update()
        {
            if (!_applied || Time.unscaledTime < _nextScan) return;
            _nextScan = Time.unscaledTime + 0.18f;
            SkinBuildings();
            SkinUnits();
        }

        public void ApplyNow()
        {
            if (_applied) return;
            GameObject titanObject = GameObject.Find("THE CROWN ENGINE // PRESENTATION ROOT");
            if (titanObject == null) return;

            _titan = titanObject.transform;
            CrownArtRebootHeroFrame legacy = GetComponent<CrownArtRebootHeroFrame>();
            if (legacy != null)
            {
                legacy.ApplyNow();
                legacy.enabled = false;
            }

            CreateMeshes();
            CreateMaterials();
            DisableLegacyArt();
            ConfigureWorldValues();
            BuildTitanFrame();
            SkinBuildings();
            SkinUnits();
            ConfigureCamera();
            _applied = true;
            Debug.Log("CROWN//FRONT Art Reboot Iteration 2 applied: revised composition, broad anatomical routes, authored reactors, weapon towers and enlarged unit silhouettes.");
        }

        private void CreateMeshes()
        {
            _plate = CrownAuthoredMeshFactory.CreateTaperedBox("I2_Plate", 0.84f, 0.88f, 0.90f);
            _hardPlate = CrownAuthoredMeshFactory.CreateTaperedBox("I2_HardPlate", 0.69f, 0.75f, 0.82f);
            _hex = CrownAuthoredMeshFactory.CreatePrism("I2_Hex", 6, 0.78f);
            _wedge = CrownAuthoredMeshFactory.CreateWedge("I2_Wedge");
            _blade = CrownAuthoredMeshFactory.CreateBlade("I2_Blade");
            _ring = CrownAuthoredMeshFactory.CreateRing("I2_Ring", 24, 0.78f, 1f, 0.14f);
        }

        private void CreateMaterials()
        {
            AddMaterial("void", new Color(0.004f, 0.007f, 0.012f), 0.35f, 0.18f);
            AddMaterial("graphite", new Color(0.055f, 0.075f, 0.105f), 0.82f, 0.44f);
            AddMaterial("mid", new Color(0.145f, 0.19f, 0.245f), 0.90f, 0.58f);
            AddMaterial("edge", new Color(0.40f, 0.50f, 0.61f), 0.92f, 0.72f);
            AddMaterial("blueArmor", new Color(0.025f, 0.18f, 0.48f), 0.74f, 0.62f, new Color(0f, 0.08f, 0.30f));
            AddMaterial("blueEnergy", new Color(0.02f, 0.76f, 1f), 0.04f, 0.94f, new Color(0f, 2.8f, 5.2f));
            AddMaterial("redArmor", new Color(0.48f, 0.035f, 0.018f), 0.75f, 0.58f, new Color(0.28f, 0.008f, 0f));
            AddMaterial("redEnergy", new Color(1f, 0.16f, 0.01f), 0.04f, 0.92f, new Color(5.4f, 0.34f, 0f));
            AddMaterial("white", new Color(0.80f, 0.91f, 1f), 0.18f, 0.90f, new Color(1.4f, 1.8f, 2.2f));
            AddMaterial("brass", new Color(0.48f, 0.29f, 0.07f), 0.93f, 0.62f);
        }

        private void AddMaterial(string key, Color color, float metallic, float smoothness, Color? emission = null)
        {
            Shader shader = Shader.Find("CrownFront/EngineSurface") ??
                            Shader.Find("Universal Render Pipeline/Lit") ??
                            Shader.Find("Standard") ??
                            Shader.Find("Unlit/Color");
            if (shader == null) throw new InvalidOperationException("Iteration 2 requires a WebGL-compatible shader.");

            Material material = new Material(shader)
            {
                name = "ART REBOOT I2 // " + key,
                enableInstancing = true
            };
            if (material.HasProperty("_Color")) material.SetColor("_Color", color);
            if (material.HasProperty("_BaseColor")) material.SetColor("_BaseColor", color);
            if (material.HasProperty("_Metallic")) material.SetFloat("_Metallic", metallic);
            if (material.HasProperty("_Glossiness")) material.SetFloat("_Glossiness", smoothness);
            if (material.HasProperty("_Smoothness")) material.SetFloat("_Smoothness", smoothness);
            if (emission.HasValue)
            {
                material.EnableKeyword("_EMISSION");
                if (material.HasProperty("_EmissionColor")) material.SetColor("_EmissionColor", emission.Value);
            }
            _materials[key] = material;
        }

        private void DisableLegacyArt()
        {
            Renderer[] renderers = _titan.GetComponentsInChildren<Renderer>(true);
            for (int i = 0; i < renderers.Length; i++) renderers[i].enabled = false;
        }

        private void ConfigureWorldValues()
        {
            RenderSettings.fog = true;
            RenderSettings.fogColor = new Color(0.008f, 0.014f, 0.025f);
            RenderSettings.fogDensity = 0.006f;
            RenderSettings.ambientMode = AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color(0.25f, 0.32f, 0.42f);
            RenderSettings.ambientEquatorColor = new Color(0.075f, 0.10f, 0.15f);
            RenderSettings.ambientGroundColor = new Color(0.012f, 0.017f, 0.028f);

            Light[] lights = FindObjectsByType<Light>(FindObjectsInactive.Exclude);
            for (int i = 0; i < lights.Length; i++)
            {
                if (lights[i].type == LightType.Directional)
                {
                    lights[i].intensity = 1.45f;
                    lights[i].color = new Color(0.73f, 0.84f, 1f);
                    lights[i].transform.rotation = Quaternion.Euler(52f, -32f, -8f);
                }
                else
                {
                    lights[i].enabled = false;
                }
            }
        }

        private void BuildTitanFrame()
        {
            Transform root = Group("ART REBOOT I2 // MECHANICAL KING", _titan);
            BuildUnderstructure(root);
            BuildTorsoMass(root);
            BuildCombatDeck(root);
            BuildKingHead(root);
        }

        private void BuildUnderstructure(Transform parent)
        {
            Transform root = Group("Understructure", parent);
            Part("Deep Sternum", root, _plate, new Vector3(0f, -2.6f, 1.2f), new Vector3(16.8f, 3.6f, 25.5f), _materials["void"]);
            Part("Left Arm Mass", root, _hardPlate, new Vector3(-9.8f, -2.1f, 1.1f), new Vector3(5.4f, 4.3f, 23.6f), _materials["graphite"], new Vector3(4f, -4f, -5f));
            Part("Right Arm Mass", root, _hardPlate, new Vector3(9.8f, -2.1f, 1.1f), new Vector3(5.4f, 4.3f, 23.6f), _materials["graphite"], new Vector3(4f, 4f, 5f));

            for (int z = -8; z <= 10; z += 3)
            {
                Part("Spine Gear", root, _ring, new Vector3(0f, -0.55f, z), new Vector3(1.9f, 1.9f, 1.9f), _materials["mid"], new Vector3(90f, 0f, 0f));
            }
        }

        private void BuildTorsoMass(Transform parent)
        {
            Transform root = Group("Torso Armor", parent);
            Part("Central Breastplate", root, _plate, new Vector3(0f, 0.55f, 1.0f), new Vector3(15.1f, 2.3f, 23.4f), _materials["graphite"]);
            Part("Upper Chest Shield", root, _hardPlate, new Vector3(0f, 1.75f, 7.1f), new Vector3(13.7f, 1.0f, 7.1f), _materials["mid"]);
            Part("Lower Chest Shield", root, _hardPlate, new Vector3(0f, 1.72f, -6.4f), new Vector3(13.8f, 1.0f, 6.6f), _materials["mid"], new Vector3(0f, 180f, 0f));

            for (int side = -1; side <= 1; side += 2)
            {
                Part("Shoulder Fortress", root, _hardPlate, new Vector3(side * 8.7f, 1.0f, 7.4f), new Vector3(5.5f, 3.6f, 7.6f), _materials["graphite"], new Vector3(0f, side * 7f, side * 9f));
                Part("Shoulder Crown Edge", root, _blade, new Vector3(side * 9.9f, 2.55f, 7.2f), new Vector3(1.5f, 1.2f, 5.5f), _materials["edge"], new Vector3(0f, side * 4f, side * 9f));
            }
        }

        private void BuildCombatDeck(Transform parent)
        {
            Transform root = Group("Combat Deck", parent);
            BuildRoute(root, -4.4f, "SHIELD ARM", _materials["blueArmor"], -1f);
            BuildRoute(root, 0f, "CROWN SPINE", _materials["white"], 0f);
            BuildRoute(root, 4.4f, "BLADE ARM", _materials["redArmor"], 1f);

            Part("Cross Body Bridge", root, _hardPlate, new Vector3(0f, 2.35f, 0.6f), new Vector3(14.8f, 0.48f, 3.0f), _materials["mid"]);
            Part("Bridge Left Edge", root, _blade, new Vector3(-6.7f, 2.62f, 0.6f), new Vector3(1.2f, 0.32f, 2.6f), _materials["blueArmor"], new Vector3(0f, 0f, -90f));
            Part("Bridge Right Edge", root, _blade, new Vector3(6.7f, 2.62f, 0.6f), new Vector3(1.2f, 0.32f, 2.6f), _materials["redArmor"], new Vector3(0f, 0f, 90f));
            Part("Crown Junction", root, _hex, new Vector3(0f, 2.72f, 0.6f), new Vector3(3.2f, 0.28f, 3.2f), _materials["edge"]);
            Part("Junction Energy", root, _hex, new Vector3(0f, 2.91f, 0.6f), new Vector3(1.25f, 0.12f, 1.25f), _materials["white"]);
        }

        private void BuildRoute(Transform parent, float x, string name, Material accent, float side)
        {
            Transform root = Group(name, parent);
            for (int z = -8; z <= 10; z += 3)
            {
                float angle = side * ((z / 3) % 2 == 0 ? 2.5f : -2.5f);
                Part("Major Armor Segment", root, _hardPlate, new Vector3(x, 2.30f, z), new Vector3(3.65f, 0.62f, 2.62f), _materials["graphite"], new Vector3(0f, angle, 0f));
                Part("Inset Plate", root, _plate, new Vector3(x, 2.67f, z), new Vector3(2.82f, 0.22f, 1.92f), z % 2 == 0 ? _materials["mid"] : _materials["graphite"], new Vector3(0f, -angle, 0f));
                if (side != 0f)
                {
                    Part("Outer Anatomical Fin", root, _blade, new Vector3(x + side * 1.92f, 2.58f, z), new Vector3(0.55f, 0.65f, 2.35f), _materials["edge"], new Vector3(0f, side < 0f ? 0f : 180f, side * 8f));
                }
            }
            Part("Route Energy Spine", root, _hex, new Vector3(x, 2.86f, 1.0f), new Vector3(0.15f, 10.5f, 0.15f), accent, new Vector3(90f, 0f, 0f));
        }

        private void BuildKingHead(Transform parent)
        {
            Transform root = Group("Mechanical King Head", parent);
            Part("Neck Bastion", root, _hardPlate, new Vector3(0f, 2.3f, 12.8f), new Vector3(7.8f, 2.8f, 3.7f), _materials["graphite"]);
            Part("Cranium", root, _hardPlate, new Vector3(0f, 4.8f, 15.1f), new Vector3(8.2f, 5.0f, 4.8f), _materials["mid"]);
            Part("Face Mask", root, _wedge, new Vector3(0f, 4.45f, 12.85f), new Vector3(6.0f, 3.4f, 1.1f), _materials["void"], new Vector3(0f, 180f, 0f));
            Part("Left Eye", root, _blade, new Vector3(-1.45f, 5.15f, 12.25f), new Vector3(1.30f, 0.18f, 0.12f), _materials["redEnergy"]);
            Part("Right Eye", root, _blade, new Vector3(1.45f, 5.15f, 12.25f), new Vector3(1.30f, 0.18f, 0.12f), _materials["redEnergy"], new Vector3(0f, 180f, 0f));

            for (int i = -1; i <= 1; i++)
            {
                float height = i == 0 ? 4.5f : 3.6f;
                Part("Crown Prong", root, _blade, new Vector3(i * 1.8f, 7.2f + height * 0.45f, 15.0f), new Vector3(i == 0 ? 1.05f : 0.82f, height, 1.3f), i == 0 ? _materials["brass"] : _materials["edge"], new Vector3(0f, i * 4f, -i * 6f));
            }
        }

        private void SkinBuildings()
        {
            CrownBuilding[] found = FindObjectsByType<CrownBuilding>(FindObjectsInactive.Include);
            for (int i = 0; i < found.Length; i++)
            {
                CrownBuilding building = found[i];
                if (building == null || _buildings.Contains(building)) continue;
                HideRenderers(building.transform);
                if (building.IsCore) BuildCore(building);
                else BuildTower(building);
                _buildings.Add(building);
            }
        }

        private void BuildCore(CrownBuilding building)
        {
            bool blue = building.Team == CrownTeam.Blue;
            Material armor = blue ? _materials["blueArmor"] : _materials["redArmor"];
            Material energy = blue ? _materials["blueEnergy"] : _materials["redEnergy"];
            Transform root = Group("ART REBOOT I2 // CORE", building.transform);

            Part("Embedded Chamber", root, _hex, new Vector3(0f, -0.08f, 0f), new Vector3(3.5f, 0.55f, 3.5f), _materials["void"]);
            Part("Armor Collar", root, _ring, new Vector3(0f, 0.55f, 0f), new Vector3(1.62f, 1.62f, 1.62f), armor);
            Part("Inner Aperture", root, _ring, new Vector3(0f, 1.25f, 0f), new Vector3(1.18f, 1.18f, 1.18f), _materials["edge"], new Vector3(58f, 0f, 0f));
            Part("Reactor Lens", root, _hex, new Vector3(0f, 1.45f, 0f), new Vector3(1.28f, 1.45f, 1.28f), energy);
            Part("White Hot Core", root, _blade, new Vector3(0f, 1.55f, 0f), new Vector3(0.48f, 1.05f, 0.48f), _materials["white"]);

            Transform ringA = Part("Orbit A", root, _ring, new Vector3(0f, 1.48f, 0f), new Vector3(1.55f, 1.55f, 1.55f), armor).transform;
            Transform ringB = Part("Orbit B", root, _ring, new Vector3(0f, 1.48f, 0f), new Vector3(1.92f, 1.92f, 1.92f), _materials["edge"], new Vector3(68f, 0f, 0f)).transform;

            for (int i = 0; i < 3; i++)
            {
                float degrees = i * 120f;
                float radians = degrees * Mathf.Deg2Rad;
                Vector3 p = new Vector3(Mathf.Sin(radians) * 2.0f, 0.75f, Mathf.Cos(radians) * 2.0f);
                Part("Stabilizer", root, _wedge, p, new Vector3(0.72f, 1.52f, 1.35f), _materials["mid"], new Vector3(0f, degrees, 0f));
                Part("Stabilizer Aperture", root, _blade, p + Vector3.up * 0.12f, new Vector3(0.18f, 0.72f, 0.62f), energy, new Vector3(0f, degrees, 0f));
            }

            CrownIteration2CoreMotion motion = root.gameObject.AddComponent<CrownIteration2CoreMotion>();
            motion.Configure(building, ringA, ringB);
        }

        private void BuildTower(CrownBuilding building)
        {
            bool blue = building.Team == CrownTeam.Blue;
            Material armor = blue ? _materials["blueArmor"] : _materials["redArmor"];
            Material energy = blue ? _materials["blueEnergy"] : _materials["redEnergy"];
            float forward = blue ? 1f : -1f;
            Transform root = Group("ART REBOOT I2 // TOWER", building.transform);

            Part("Embedded Base", root, _hex, Vector3.zero, new Vector3(1.85f, 0.50f, 1.85f), _materials["void"]);
            Part("Bastion Armor", root, _hardPlate, new Vector3(0f, 0.55f, 0f), new Vector3(1.72f, 0.72f, 1.72f), armor);
            Transform yaw = Group("Yaw Module", root);
            yaw.localPosition = new Vector3(0f, 1.25f, 0f);
            Part("Weapon Housing", yaw, _wedge, Vector3.zero, new Vector3(1.55f, 0.72f, 1.38f), _materials["mid"], new Vector3(0f, blue ? 0f : 180f, 0f));
            Transform leftBarrel = Part("Left Rail", yaw, _blade, new Vector3(-0.34f, 0.05f, forward * 1.12f), new Vector3(0.24f, 0.24f, 1.75f), _materials["edge"], new Vector3(0f, blue ? 0f : 180f, 0f)).transform;
            Transform rightBarrel = Part("Right Rail", yaw, _blade, new Vector3(0.34f, 0.05f, forward * 1.12f), new Vector3(0.24f, 0.24f, 1.75f), _materials["edge"], new Vector3(0f, blue ? 0f : 180f, 0f)).transform;
            Part("Energy Aperture", yaw, _hex, new Vector3(0f, 0.12f, forward * 0.92f), new Vector3(0.62f, 0.24f, 0.62f), energy, new Vector3(90f, 0f, 0f));
            Part("Left Armor Wing", yaw, _blade, new Vector3(-0.86f, 0.18f, -forward * 0.08f), new Vector3(0.38f, 0.58f, 1.02f), armor, new Vector3(0f, blue ? 0f : 180f, -12f));
            Part("Right Armor Wing", yaw, _blade, new Vector3(0.86f, 0.18f, -forward * 0.08f), new Vector3(0.38f, 0.58f, 1.02f), armor, new Vector3(0f, blue ? 180f : 0f, 12f));

            CrownIteration2TowerMotion motion = root.gameObject.AddComponent<CrownIteration2TowerMotion>();
            motion.Configure(building, yaw, leftBarrel, rightBarrel, forward);
        }

        private void SkinUnits()
        {
            CrownUnit[] found = FindObjectsByType<CrownUnit>(FindObjectsInactive.Include);
            for (int i = 0; i < found.Length; i++)
            {
                CrownUnit unit = found[i];
                if (unit == null || _units.Contains(unit)) continue;
                HideRenderers(unit.transform);
                BuildUnit(unit);
                _units.Add(unit);
            }
        }

        private void BuildUnit(CrownUnit unit)
        {
            bool blue = unit.Team == CrownTeam.Blue;
            Material armor = blue ? _materials["blueArmor"] : _materials["redArmor"];
            Material energy = blue ? _materials["blueEnergy"] : _materials["redEnergy"];
            float scale = unit.Kind == CrownUnitKind.Tank ? 1.48f : unit.Kind == CrownUnitKind.Raider ? 1.04f : 1.20f;
            Transform root = Group("ART REBOOT I2 // UNIT", unit.transform);
            Transform body = Group("Body", root);

            Transform torso = Part("Torso", body, _wedge, new Vector3(0f, 1.0f, 0f), new Vector3(0.95f, 1.18f, 0.78f) * scale, _materials["graphite"]).transform;
            Part("Chest Armor", torso, _hardPlate, new Vector3(0f, 0.10f, 0.50f), new Vector3(0.76f, 0.62f, 0.17f) * scale, armor);
            Part("Chest Energy", torso, _blade, new Vector3(0f, 0.10f, 0.61f), new Vector3(0.12f, 0.35f, 0.08f) * scale, energy);
            Part("Helmet", body, _hardPlate, new Vector3(0f, 1.82f * scale, 0f), new Vector3(0.70f, 0.58f, 0.68f) * scale, _materials["mid"]);
            Part("Visor", body, _blade, new Vector3(0f, 1.82f * scale, 0.43f * scale), new Vector3(0.54f, 0.13f, 0.10f) * scale, energy);

            Transform leftLeg = Part("Left Leg", body, _hardPlate, new Vector3(-0.27f * scale, 0.24f, 0f), new Vector3(0.30f, 0.82f, 0.36f) * scale, _materials["edge"]).transform;
            Transform rightLeg = Part("Right Leg", body, _hardPlate, new Vector3(0.27f * scale, 0.24f, 0f), new Vector3(0.30f, 0.82f, 0.36f) * scale, _materials["edge"]).transform;

            Transform weapon;
            if (unit.Kind == CrownUnitKind.Tank)
            {
                Part("Left Bulwark", body, _hardPlate, new Vector3(-0.76f * scale, 1.16f * scale, 0f), new Vector3(0.62f, 0.70f, 0.78f) * scale, armor, new Vector3(0f, 0f, -10f));
                Part("Right Bulwark", body, _hardPlate, new Vector3(0.76f * scale, 1.16f * scale, 0f), new Vector3(0.62f, 0.70f, 0.78f) * scale, armor, new Vector3(0f, 0f, 10f));
                weapon = Part("Siege Weapon", body, _wedge, new Vector3(0f, 1.02f * scale, 1.05f * scale), new Vector3(0.52f, 0.50f, 2.2f) * scale, _materials["edge"]).transform;
            }
            else if (unit.Kind == CrownUnitKind.Raider)
            {
                Part("Left Booster", body, _blade, new Vector3(-0.48f * scale, 0.92f * scale, -0.36f * scale), new Vector3(0.30f, 0.82f, 0.68f) * scale, energy, new Vector3(0f, 180f, -12f));
                Part("Right Booster", body, _blade, new Vector3(0.48f * scale, 0.92f * scale, -0.36f * scale), new Vector3(0.30f, 0.82f, 0.68f) * scale, energy, new Vector3(0f, 180f, 12f));
                weapon = Part("Raider Blade", body, _blade, new Vector3(0.58f * scale, 0.82f * scale, 0.72f * scale), new Vector3(0.17f, 0.17f, 1.65f) * scale, armor, new Vector3(0f, 16f, 0f)).transform;
                body.localRotation = Quaternion.Euler(14f, 0f, 0f);
            }
            else
            {
                Part("Left Shoulder", body, _blade, new Vector3(-0.58f * scale, 1.22f * scale, 0f), new Vector3(0.46f, 0.38f, 0.70f) * scale, armor, new Vector3(0f, 0f, -14f));
                Part("Right Shoulder", body, _blade, new Vector3(0.58f * scale, 1.22f * scale, 0f), new Vector3(0.46f, 0.38f, 0.70f) * scale, armor, new Vector3(0f, 180f, 14f));
                weapon = Part("Carbine", body, _wedge, new Vector3(0.34f * scale, 0.96f * scale, 0.92f * scale), new Vector3(0.26f, 0.28f, 1.72f) * scale, _materials["edge"], new Vector3(-6f, 0f, 0f)).transform;
            }

            CrownIteration2UnitMotion motion = root.gameObject.AddComponent<CrownIteration2UnitMotion>();
            motion.Configure(unit, body, leftLeg, rightLeg, weapon);
        }

        private void ConfigureCamera()
        {
            Camera camera = Camera.main;
            if (camera == null) return;
            CrownAuthoredHeroCamera oldCamera = camera.GetComponent<CrownAuthoredHeroCamera>();
            if (oldCamera != null) oldCamera.enabled = false;
            camera.fieldOfView = 29.5f;
            CrownIteration2Camera rig = camera.GetComponent<CrownIteration2Camera>();
            if (rig == null) rig = camera.gameObject.AddComponent<CrownIteration2Camera>();
            rig.Configure(new Vector3(0f, 31.5f, -33.0f), new Vector3(0f, 2.35f, 1.2f));
        }

        private static void HideRenderers(Transform root)
        {
            Renderer[] renderers = root.GetComponentsInChildren<Renderer>(true);
            for (int i = 0; i < renderers.Length; i++) renderers[i].enabled = false;
        }

        private static Transform Group(string name, Transform parent)
        {
            GameObject go = new GameObject(name);
            go.transform.SetParent(parent, false);
            return go.transform;
        }

        private static GameObject Part(string name, Transform parent, Mesh mesh, Vector3 position, Vector3 scale, Material material, Vector3? euler = null)
        {
            GameObject go = new GameObject(name);
            go.transform.SetParent(parent, false);
            go.transform.localPosition = position;
            go.transform.localScale = scale;
            go.transform.localEulerAngles = euler ?? Vector3.zero;
            MeshFilter filter = go.AddComponent<MeshFilter>();
            filter.sharedMesh = mesh;
            MeshRenderer renderer = go.AddComponent<MeshRenderer>();
            renderer.sharedMaterial = material;
            renderer.shadowCastingMode = ShadowCastingMode.On;
            renderer.receiveShadows = true;
            return go;
        }
    }

    public sealed class CrownIteration2CoreMotion : MonoBehaviour
    {
        private CrownBuilding _building;
        private Transform _a;
        private Transform _b;

        public void Configure(CrownBuilding building, Transform a, Transform b)
        {
            _building = building;
            _a = a;
            _b = b;
        }

        private void LateUpdate()
        {
            if (_building == null) return;
            float damage = Mathf.InverseLerp(3200f, 0f, _building.Health);
            _a.Rotate(Vector3.up, (24f + damage * 42f) * Time.deltaTime, Space.Self);
            _b.Rotate(Vector3.right, (-18f - damage * 34f) * Time.deltaTime, Space.Self);
            transform.localScale = Vector3.one * (1f + Mathf.Sin(Time.time * (2.0f + damage * 2.8f)) * (0.012f + damage * 0.03f));
        }
    }

    public sealed class CrownIteration2TowerMotion : MonoBehaviour
    {
        private CrownBuilding _building;
        private Transform _yaw;
        private Transform _left;
        private Transform _right;
        private Vector3 _leftBase;
        private Vector3 _rightBase;
        private float _forward;

        public void Configure(CrownBuilding building, Transform yaw, Transform left, Transform right, float forward)
        {
            _building = building;
            _yaw = yaw;
            _left = left;
            _right = right;
            _leftBase = left.localPosition;
            _rightBase = right.localPosition;
            _forward = forward;
        }

        private void LateUpdate()
        {
            if (_building == null || _building.IsDead) return;
            _yaw.localRotation = Quaternion.Euler(0f, Mathf.Sin(Time.time * 0.7f + _building.Lane) * 14f, 0f);
            float recoil = Mathf.Max(0f, Mathf.Sin(Time.time * 5.0f + _building.Lane * 1.7f)) * 0.055f;
            Vector3 offset = Vector3.back * (_forward * recoil);
            _left.localPosition = _leftBase + offset;
            _right.localPosition = _rightBase + offset;
        }
    }

    public sealed class CrownIteration2UnitMotion : MonoBehaviour
    {
        private CrownUnit _unit;
        private Transform _body;
        private Transform _leftLeg;
        private Transform _rightLeg;
        private Transform _weapon;
        private Vector3 _last;
        private Vector3 _weaponBase;
        private float _seed;

        public void Configure(CrownUnit unit, Transform body, Transform leftLeg, Transform rightLeg, Transform weapon)
        {
            _unit = unit;
            _body = body;
            _leftLeg = leftLeg;
            _rightLeg = rightLeg;
            _weapon = weapon;
            _last = unit.transform.position;
            _weaponBase = weapon.localPosition;
            _seed = ((int)unit.Team * 13 + (int)unit.Kind * 7 + unit.Lane) * 0.41f;
        }

        private void LateUpdate()
        {
            if (_unit == null) return;
            float speed = (_unit.transform.position - _last).magnitude / Mathf.Max(Time.deltaTime, 0.0001f);
            _last = _unit.transform.position;
            float phase = Time.time * Mathf.Lerp(4.2f, 9.2f, Mathf.Clamp01(speed / 4f)) + _seed;
            float swing = Mathf.Clamp01(speed * 0.34f) * 22f;
            _leftLeg.localRotation = Quaternion.Euler(Mathf.Sin(phase) * swing, 0f, 0f);
            _rightLeg.localRotation = Quaternion.Euler(-Mathf.Sin(phase) * swing, 0f, 0f);
            _body.localPosition = new Vector3(0f, Mathf.Sin(phase * 2f) * (0.018f + speed * 0.006f), 0f);
            _weapon.localPosition = Vector3.Lerp(_weapon.localPosition, _weaponBase, Time.deltaTime * 15f);
        }
    }

    public sealed class CrownIteration2Camera : MonoBehaviour
    {
        private Vector3 _position;
        private Vector3 _target;
        private float _start;

        public void Configure(Vector3 position, Vector3 target)
        {
            _position = position;
            _target = target;
            _start = Time.time;
            transform.position = position + Vector3.back * 1.0f;
            transform.LookAt(target);
        }

        private void LateUpdate()
        {
            float settle = 1f - Mathf.Exp(-(Time.time - _start) * 4f);
            Vector3 breath = new Vector3(Mathf.Sin(Time.time * 0.22f) * 0.025f, Mathf.Sin(Time.time * 0.29f) * 0.03f, 0f);
            transform.position = Vector3.Lerp(_position + Vector3.back, _position, settle) + breath;
            transform.LookAt(_target + breath * 0.2f);
        }
    }
}
