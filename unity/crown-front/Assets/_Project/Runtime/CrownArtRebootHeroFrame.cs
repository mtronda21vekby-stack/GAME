using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Rendering;

namespace CrownFront.Cloud
{
    [DefaultExecutionOrder(1000)]
    public sealed class CrownArtRebootHeroFrame : MonoBehaviour
    {
        private readonly Dictionary<string, Material> _materials = new Dictionary<string, Material>(12);
        private readonly HashSet<int> _skinnedBuildings = new HashSet<int>();
        private readonly HashSet<int> _skinnedUnits = new HashSet<int>();

        private Mesh _plateMesh;
        private Mesh _hardPlateMesh;
        private Mesh _hexMesh;
        private Mesh _wedgeMesh;
        private Mesh _bladeMesh;
        private Mesh _ringMesh;
        private Transform _titan;
        private bool _applied;
        private float _nextActorScan;

        public int AuthoredMaterialCount => _materials.Count;

        private void Start()
        {
            ApplyNow();
        }

        private void Update()
        {
            if (!_applied || Time.unscaledTime < _nextActorScan) return;
            _nextActorScan = Time.unscaledTime + 0.2f;
            SkinBuildings();
            SkinUnits();
        }

        public void ApplyNow()
        {
            if (_applied) return;

            GameObject titanObject = GameObject.Find("THE CROWN ENGINE // PRESENTATION ROOT");
            if (titanObject == null)
            {
                Debug.LogWarning("CROWN//FRONT Art Reboot is waiting for the generated gameplay world.");
                return;
            }

            _titan = titanObject.transform;
            CreateMeshes();
            CreateMaterials();
            DisableLegacyRenderers(_titan);
            BuildMechanicalKing();
            SkinBuildings();
            SkinUnits();
            ConfigureCamera();
            _applied = true;

            Debug.Log($"CROWN//FRONT Art Reboot hero frame applied: {_materials.Count} authored shared materials, custom mesh kit, rebuilt titan anatomy, buildings and units.");
        }

        private void CreateMeshes()
        {
            _plateMesh = CrownAuthoredMeshFactory.CreateTaperedBox("Crown_Plate_82", 0.82f, 0.84f, 0.92f);
            _hardPlateMesh = CrownAuthoredMeshFactory.CreateTaperedBox("Crown_Plate_68", 0.68f, 0.72f, 0.78f);
            _hexMesh = CrownAuthoredMeshFactory.CreatePrism("Crown_Hex", 6, 0.84f);
            _wedgeMesh = CrownAuthoredMeshFactory.CreateWedge("Crown_Wedge");
            _bladeMesh = CrownAuthoredMeshFactory.CreateBlade("Crown_Blade");
            _ringMesh = CrownAuthoredMeshFactory.CreateRing("Crown_Ring", 18, 0.68f, 1f, 0.18f);
        }

        private void CreateMaterials()
        {
            AddMaterial("graphite", new Color(0.022f, 0.032f, 0.047f), 0.82f, 0.40f);
            AddMaterial("steel", new Color(0.16f, 0.20f, 0.25f), 0.92f, 0.62f);
            AddMaterial("edge", new Color(0.42f, 0.48f, 0.54f), 0.86f, 0.73f);
            AddMaterial("mechanism", new Color(0.005f, 0.009f, 0.016f), 0.68f, 0.24f);
            AddMaterial("blueArmor", new Color(0.018f, 0.11f, 0.25f), 0.72f, 0.58f, new Color(0f, 0.035f, 0.12f));
            AddMaterial("blueEnergy", new Color(0.015f, 0.68f, 1f), 0.08f, 0.88f, new Color(0f, 2.1f, 4.2f));
            AddMaterial("redArmor", new Color(0.25f, 0.018f, 0.012f), 0.76f, 0.52f, new Color(0.14f, 0.006f, 0f));
            AddMaterial("redEnergy", new Color(1f, 0.12f, 0.008f), 0.08f, 0.86f, new Color(4.4f, 0.22f, 0f));
            AddMaterial("whiteHot", new Color(0.84f, 0.94f, 1f), 0.02f, 0.96f, new Color(3.4f, 3.8f, 4.2f));
            AddMaterial("brass", new Color(0.34f, 0.20f, 0.055f), 0.94f, 0.60f);
        }

        private void AddMaterial(string key, Color color, float metallic, float smoothness, Color? emission = null)
        {
            Shader shader = Shader.Find("CrownFront/EngineSurface") ??
                            Shader.Find("Universal Render Pipeline/Lit") ??
                            Shader.Find("Standard") ??
                            Shader.Find("Unlit/Color");
            if (shader == null) throw new InvalidOperationException("Art Reboot requires a WebGL-compatible shader.");

            Material material = new Material(shader)
            {
                name = "ART REBOOT // " + key,
                enableInstancing = true
            };

            SetColor(material, "_Color", color);
            SetColor(material, "_BaseColor", color);
            SetFloat(material, "_Metallic", metallic);
            SetFloat(material, "_Glossiness", smoothness);
            SetFloat(material, "_Smoothness", smoothness);
            if (emission.HasValue)
            {
                material.EnableKeyword("_EMISSION");
                SetColor(material, "_EmissionColor", emission.Value);
            }
            _materials[key] = material;
        }

        private static void SetColor(Material material, string property, Color value)
        {
            if (material.HasProperty(property)) material.SetColor(property, value);
        }

        private static void SetFloat(Material material, string property, float value)
        {
            if (material.HasProperty(property)) material.SetFloat(property, value);
        }

        private static void DisableLegacyRenderers(Transform root)
        {
            Renderer[] renderers = root.GetComponentsInChildren<Renderer>(true);
            for (int i = 0; i < renderers.Length; i++) renderers[i].enabled = false;
        }

        private void BuildMechanicalKing()
        {
            Transform art = Group("ART REBOOT // MECHANICAL KING", _titan);
            BuildDepthSilhouette(art);
            BuildTorso(art);
            BuildRoutes(art);
            BuildEnemyHead(art);
            BuildFriendlyChest(art);
        }

        private void BuildDepthSilhouette(Transform parent)
        {
            Transform depth = Group("Deep Machine Anatomy", parent);
            Part("Underdeck Keel", depth, _hardPlateMesh, new Vector3(0f, -3.7f, 1.8f), new Vector3(11.5f, 3.2f, 22.5f), _materials["mechanism"]);
            Part("Left Deep Arm", depth, _plateMesh, new Vector3(-11.7f, -4.3f, 0.2f), new Vector3(4.4f, 4.8f, 23f), _materials["mechanism"], new Vector3(7f, -5f, -8f));
            Part("Right Deep Arm", depth, _plateMesh, new Vector3(11.7f, -4.3f, 0.2f), new Vector3(4.4f, 4.8f, 23f), _materials["mechanism"], new Vector3(7f, 5f, 8f));

            for (int z = -8; z <= 10; z += 3)
            {
                Part("Subdeck Vertebra", depth, _hexMesh, new Vector3(0f, -2.4f, z), new Vector3(3.4f, 0.45f, 3.4f), z % 2 == 0 ? _materials["steel"] : _materials["mechanism"]);
            }

            for (int side = -1; side <= 1; side += 2)
            {
                for (int z = -7; z <= 9; z += 4)
                {
                    Part("Hydraulic Bundle", depth, _hexMesh, new Vector3(side * 8.5f, -1.65f, z), new Vector3(0.46f, 2.2f, 0.46f), _materials["edge"], new Vector3(90f, 0f, 0f));
                    Part("Deep Energy Vessel", depth, _hexMesh, new Vector3(side * 7.6f, -2.15f, z + 0.8f), new Vector3(0.22f, 1.8f, 0.22f), side < 0 ? _materials["blueEnergy"] : _materials["redEnergy"], new Vector3(90f, 0f, 0f));
                }
            }
        }

        private void BuildTorso(Transform parent)
        {
            Transform torso = Group("Titan Torso Armor", parent);
            Part("Sternum Mass", torso, _plateMesh, new Vector3(0f, 0.15f, 1.1f), new Vector3(15.4f, 2.7f, 24.8f), _materials["graphite"]);
            Part("Upper Breastplate", torso, _hardPlateMesh, new Vector3(0f, 1.65f, 7.2f), new Vector3(13.2f, 1.1f, 7.8f), _materials["steel"]);
            Part("Lower Breastplate", torso, _hardPlateMesh, new Vector3(0f, 1.62f, -6.4f), new Vector3(13.5f, 1.1f, 7.2f), _materials["steel"], new Vector3(0f, 180f, 0f));

            for (int side = -1; side <= 1; side += 2)
            {
                Part("Shoulder Citadel", torso, _hardPlateMesh, new Vector3(side * 9.5f, 0.7f, 6.4f), new Vector3(5.3f, 4.2f, 8.2f), _materials["graphite"], new Vector3(0f, side * 8f, side * 11f));
                Part("Shoulder Edge", torso, _bladeMesh, new Vector3(side * 10.6f, 2.15f, 6.2f), new Vector3(2.0f, 1.2f, 6.2f), _materials["edge"], new Vector3(0f, side * 3f, side * 8f));
            }
        }

        private void BuildRoutes(Transform parent)
        {
            Transform routes = Group("Anatomical Combat Routes", parent);

            Transform left = Group("Shield Arm Route", routes);
            for (int z = -8; z <= 10; z += 3)
            {
                Part("Shield Rib", left, _hardPlateMesh, new Vector3(-4.45f, 2.02f, z), new Vector3(3.05f, 0.5f, 2.35f), _materials["graphite"], new Vector3(0f, (z & 1) == 0 ? -3f : 3f, -2f));
                Part("Shield Rim", left, _bladeMesh, new Vector3(-6.0f, 2.22f, z), new Vector3(0.42f, 0.46f, 2.15f), _materials["edge"], new Vector3(0f, 0f, -6f));
            }
            Part("Shield Conduit", left, _hexMesh, new Vector3(-4.45f, 2.34f, 1f), new Vector3(0.12f, 10.3f, 0.12f), _materials["blueEnergy"], new Vector3(90f, 0f, 0f));

            Transform center = Group("Crown Spine Route", routes);
            for (int z = -8; z <= 10; z += 2)
            {
                Part("Crown Vertebra", center, _hexMesh, new Vector3(0f, 2.08f, z), new Vector3(2.9f, 0.43f, 2.25f), z % 4 == 0 ? _materials["steel"] : _materials["graphite"]);
            }
            Part("Spinal Energy Channel", center, _hexMesh, new Vector3(0f, 2.38f, 1f), new Vector3(0.16f, 10.6f, 0.16f), _materials["whiteHot"], new Vector3(90f, 0f, 0f));

            Transform right = Group("Blade Arm Route", routes);
            for (int z = -8; z <= 10; z += 3)
            {
                Part("Blade Plate", right, _wedgeMesh, new Vector3(4.45f, 2.05f, z), new Vector3(3.0f, 0.58f, 2.5f), _materials["graphite"], new Vector3(0f, z % 2 == 0 ? 0f : 180f, 2f));
                Part("Blade Fin", right, _bladeMesh, new Vector3(6.05f, 2.36f, z + 0.25f), new Vector3(0.50f, 0.72f, 2.1f), _materials["edge"], new Vector3(0f, 0f, 8f));
            }
            Part("Blade Conduit", right, _hexMesh, new Vector3(4.45f, 2.36f, 1f), new Vector3(0.12f, 10.3f, 0.12f), _materials["redEnergy"], new Vector3(90f, 0f, 0f));
        }

        private void BuildEnemyHead(Transform parent)
        {
            Transform head = Group("Mechanical King Head", parent);
            Part("Crown Cranium", head, _hardPlateMesh, new Vector3(0f, 6.9f, 16.3f), new Vector3(9.6f, 6.2f, 5.7f), _materials["graphite"]);
            Part("Face Shield", head, _wedgeMesh, new Vector3(0f, 6.45f, 13.55f), new Vector3(7.2f, 4.2f, 1.15f), _materials["mechanism"], new Vector3(0f, 180f, 0f));
            Part("Jaw Keel", head, _hardPlateMesh, new Vector3(0f, 4.45f, 14.6f), new Vector3(5.8f, 1.15f, 2.2f), _materials["steel"]);
            Part("Left Eye", head, _bladeMesh, new Vector3(-1.7f, 7.15f, 13.05f), new Vector3(1.35f, 0.18f, 0.16f), _materials["redEnergy"]);
            Part("Right Eye", head, _bladeMesh, new Vector3(1.7f, 7.15f, 13.05f), new Vector3(1.35f, 0.18f, 0.16f), _materials["redEnergy"], new Vector3(0f, 180f, 0f));

            for (int i = -1; i <= 1; i++)
            {
                float height = i == 0 ? 6.0f : 4.8f;
                Part("Crown Prong", head, _bladeMesh, new Vector3(i * 2.0f, 11.0f + height * 0.46f, 16.1f), new Vector3(i == 0 ? 1.15f : 0.90f, height, 1.6f), i == 0 ? _materials["brass"] : _materials["edge"], new Vector3(0f, i * 5f, -i * 7f));
            }
        }

        private void BuildFriendlyChest(Transform parent)
        {
            Transform chest = Group("Crown Engine Chest", parent);
            Part("Heart Socket", chest, _hexMesh, new Vector3(0f, 1.78f, -9.3f), new Vector3(6.6f, 0.72f, 6.6f), _materials["mechanism"]);
            for (int i = 0; i < 3; i++)
            {
                float angle = i * 120f * Mathf.Deg2Rad;
                Vector3 position = new Vector3(Mathf.Sin(angle) * 4.0f, 2.0f, -9.3f + Mathf.Cos(angle) * 3.2f);
                Part("Chest Crown Support", chest, _bladeMesh, position, new Vector3(1.15f, 0.72f, 3.2f), _materials["steel"], new Vector3(0f, i * 120f, 0f));
            }
        }

        private void SkinBuildings()
        {
            CrownBuilding[] buildings = FindObjectsByType<CrownBuilding>(FindObjectsInactive.Include);
            for (int i = 0; i < buildings.Length; i++)
            {
                CrownBuilding building = buildings[i];
                if (building == null || _skinnedBuildings.Contains(building.GetInstanceID())) continue;
                HideRenderers(building.transform);
                if (building.IsCore) BuildCore(building);
                else BuildTower(building);
                _skinnedBuildings.Add(building.GetInstanceID());
            }
        }

        private void BuildCore(CrownBuilding building)
        {
            bool blue = building.Team == CrownTeam.Blue;
            Material armor = blue ? _materials["blueArmor"] : _materials["redArmor"];
            Material energy = blue ? _materials["blueEnergy"] : _materials["redEnergy"];
            Transform root = Group("ART REBOOT // AUTHORED CORE", building.transform);

            Part("Embedded Socket", root, _hexMesh, Vector3.zero, new Vector3(4.1f, 0.64f, 4.1f), _materials["mechanism"]);
            Part("Armor Crown", root, _hardPlateMesh, new Vector3(0f, 0.55f, 0f), new Vector3(3.2f, 0.85f, 3.2f), armor);
            Part("White Heart", root, _hexMesh, new Vector3(0f, 2.0f, 0f), new Vector3(0.72f, 1.55f, 0.72f), _materials["whiteHot"]);
            Part("Energy Heart", root, _hexMesh, new Vector3(0f, 2.0f, 0f), new Vector3(1.15f, 1.18f, 1.15f), energy);

            Transform ringA = Part("Magnetic Ring A", root, _ringMesh, new Vector3(0f, 2.0f, 0f), new Vector3(1.8f, 1.8f, 1.8f), _materials["steel"]).transform;
            Transform ringB = Part("Magnetic Ring B", root, _ringMesh, new Vector3(0f, 2.0f, 0f), new Vector3(2.2f, 2.2f, 2.2f), armor, new Vector3(66f, 0f, 0f)).transform;
            Transform ringC = Part("Magnetic Ring C", root, _ringMesh, new Vector3(0f, 2.0f, 0f), new Vector3(2.55f, 2.55f, 2.55f), _materials["edge"], new Vector3(-66f, 0f, 0f)).transform;

            for (int i = 0; i < 3; i++)
            {
                float angle = i * 120f * Mathf.Deg2Rad;
                Vector3 p = new Vector3(Mathf.Sin(angle) * 2.15f, 1.25f, Mathf.Cos(angle) * 2.15f);
                Part("Crown Stabilizer", root, _bladeMesh, p, new Vector3(0.72f, 2.65f, 1.0f), i == 0 ? armor : _materials["steel"], new Vector3(0f, i * 120f, 0f));
                Part("Stabilizer Slit", root, _bladeMesh, p + Vector3.up * 0.05f, new Vector3(0.18f, 1.45f, 1.06f), energy, new Vector3(0f, i * 120f, 0f));
            }

            CrownAuthoredCoreMotion motion = root.gameObject.AddComponent<CrownAuthoredCoreMotion>();
            motion.Configure(building, ringA, ringB, ringC);
        }

        private void BuildTower(CrownBuilding building)
        {
            bool blue = building.Team == CrownTeam.Blue;
            Material armor = blue ? _materials["blueArmor"] : _materials["redArmor"];
            Material energy = blue ? _materials["blueEnergy"] : _materials["redEnergy"];
            Transform root = Group("ART REBOOT // AUTHORED TOWER", building.transform);

            Part("Integrated Bastion", root, _hexMesh, Vector3.zero, new Vector3(2.0f, 0.58f, 2.0f), _materials["mechanism"]);
            Part("Tower Collar", root, _ringMesh, new Vector3(0f, 0.66f, 0f), new Vector3(1.35f, 1.35f, 1.35f), armor);
            Transform head = Part("Directional Weapon Head", root, _hardPlateMesh, new Vector3(0f, 1.35f, 0f), new Vector3(1.5f, 0.82f, 1.9f), _materials["graphite"]).transform;
            Transform barrel = Part("Crown Rail", head, _bladeMesh, new Vector3(0f, 0.05f, blue ? 1.35f : -1.35f), new Vector3(0.44f, 0.42f, 2.6f), _materials["edge"], new Vector3(0f, blue ? 0f : 180f, 0f)).transform;
            Part("Muzzle Energy", barrel, _hexMesh, new Vector3(0f, 0f, 0.52f), new Vector3(0.46f, 0.18f, 0.46f), energy, new Vector3(90f, 0f, 0f));
            Part("Tower Fin Left", head, _bladeMesh, new Vector3(-0.72f, 0.32f, -0.1f), new Vector3(0.35f, 0.85f, 1.25f), armor, new Vector3(0f, 0f, -14f));
            Part("Tower Fin Right", head, _bladeMesh, new Vector3(0.72f, 0.32f, -0.1f), new Vector3(0.35f, 0.85f, 1.25f), armor, new Vector3(0f, 180f, 14f));

            CrownAuthoredTowerMotion motion = root.gameObject.AddComponent<CrownAuthoredTowerMotion>();
            motion.Configure(building, head, barrel, blue ? 1f : -1f);
        }

        private void SkinUnits()
        {
            CrownUnit[] units = FindObjectsByType<CrownUnit>(FindObjectsInactive.Include);
            for (int i = 0; i < units.Length; i++)
            {
                CrownUnit unit = units[i];
                if (unit == null || _skinnedUnits.Contains(unit.GetInstanceID())) continue;
                HideRenderers(unit.transform);
                BuildUnit(unit);
                _skinnedUnits.Add(unit.GetInstanceID());
            }
        }

        private void BuildUnit(CrownUnit unit)
        {
            bool blue = unit.Team == CrownTeam.Blue;
            Material armor = blue ? _materials["blueArmor"] : _materials["redArmor"];
            Material energy = blue ? _materials["blueEnergy"] : _materials["redEnergy"];
            Transform root = Group("ART REBOOT // AUTHORED UNIT", unit.transform);
            root.localPosition = Vector3.zero;
            root.localRotation = Quaternion.identity;

            float scale = unit.Kind == CrownUnitKind.Tank ? 1.35f : unit.Kind == CrownUnitKind.Raider ? 0.88f : 1f;
            Transform body = Group("Visual Body", root);
            Transform torso = Part("Slanted Torso", body, _wedgeMesh, new Vector3(0f, 0.92f, 0f), new Vector3(0.88f, 1.15f, 0.72f) * scale, _materials["graphite"]).transform;
            Part("Faction Chest Plate", torso, _hardPlateMesh, new Vector3(0f, 0.10f, 0.48f), new Vector3(0.72f, 0.65f, 0.18f) * scale, armor);
            Part("Energy Trident", torso, _bladeMesh, new Vector3(0f, 0.12f, 0.60f), new Vector3(0.12f, 0.42f, 0.10f) * scale, energy);
            Part("Helmet", body, _hardPlateMesh, new Vector3(0f, 1.72f, 0f), new Vector3(0.72f, 0.62f, 0.68f) * scale, _materials["steel"]);
            Part("Visor", body, _bladeMesh, new Vector3(0f, 1.72f, 0.43f * scale), new Vector3(0.55f, 0.14f, 0.11f) * scale, energy);

            Transform leftLeg = Part("Left Leg", body, _hardPlateMesh, new Vector3(-0.26f * scale, 0.20f, 0f), new Vector3(0.28f, 0.78f, 0.34f) * scale, _materials["steel"]).transform;
            Transform rightLeg = Part("Right Leg", body, _hardPlateMesh, new Vector3(0.26f * scale, 0.20f, 0f), new Vector3(0.28f, 0.78f, 0.34f) * scale, _materials["steel"]).transform;
            Part("Left Boot", leftLeg, _wedgeMesh, new Vector3(0f, -0.42f, 0.16f), new Vector3(0.34f, 0.24f, 0.58f), _materials["mechanism"]);
            Part("Right Boot", rightLeg, _wedgeMesh, new Vector3(0f, -0.42f, 0.16f), new Vector3(0.34f, 0.24f, 0.58f), _materials["mechanism"]);

            Transform weapon;
            if (unit.Kind == CrownUnitKind.Tank)
            {
                Part("Heavy Left Shoulder", body, _hardPlateMesh, new Vector3(-0.72f, 1.18f, 0f), new Vector3(0.72f, 0.64f, 0.78f), armor, new Vector3(0f, 0f, -12f));
                Part("Heavy Right Shoulder", body, _hardPlateMesh, new Vector3(0.72f, 1.18f, 0f), new Vector3(0.72f, 0.64f, 0.78f), armor, new Vector3(0f, 0f, 12f));
                weapon = Part("Siege Cannon", body, _hardPlateMesh, new Vector3(0f, 1.0f, 0.95f), new Vector3(0.52f, 0.48f, 2.15f), _materials["edge"]).transform;
            }
            else if (unit.Kind == CrownUnitKind.Raider)
            {
                Part("Left Booster", body, _bladeMesh, new Vector3(-0.45f, 0.88f, -0.42f), new Vector3(0.28f, 0.72f, 0.82f), energy, new Vector3(0f, 180f, -14f));
                Part("Right Booster", body, _bladeMesh, new Vector3(0.45f, 0.88f, -0.42f), new Vector3(0.28f, 0.72f, 0.82f), energy, new Vector3(0f, 180f, 14f));
                weapon = Part("Raider Blade", body, _bladeMesh, new Vector3(0.52f, 0.78f, 0.72f), new Vector3(0.18f, 0.18f, 1.65f), armor, new Vector3(0f, 16f, 0f)).transform;
                body.localRotation = Quaternion.Euler(18f, 0f, 0f);
            }
            else
            {
                Part("Left Shoulder", body, _bladeMesh, new Vector3(-0.56f, 1.18f, 0f), new Vector3(0.48f, 0.38f, 0.72f), armor, new Vector3(0f, 0f, -16f));
                Part("Right Shoulder", body, _bladeMesh, new Vector3(0.56f, 1.18f, 0f), new Vector3(0.48f, 0.38f, 0.72f), armor, new Vector3(0f, 180f, 16f));
                weapon = Part("Rifle Forward", body, _wedgeMesh, new Vector3(0.34f, 0.92f, 0.85f), new Vector3(0.28f, 0.30f, 1.72f), _materials["edge"], new Vector3(-6f, 0f, 0f)).transform;
            }

            if (!blue)
            {
                Part("Hostile Asymmetric Spine", body, _bladeMesh, new Vector3(-0.28f, 1.02f, -0.42f), new Vector3(0.22f, 0.86f, 0.46f), _materials["redArmor"], new Vector3(0f, 180f, -12f));
            }

            CrownAuthoredUnitMotion motion = root.gameObject.AddComponent<CrownAuthoredUnitMotion>();
            motion.Configure(unit, body, leftLeg, rightLeg, weapon);
        }

        private void ConfigureCamera()
        {
            Camera camera = Camera.main;
            if (camera == null) return;
            CrownCameraPresentation previous = camera.GetComponent<CrownCameraPresentation>();
            if (previous != null) previous.enabled = false;
            camera.fieldOfView = 32.5f;
            CrownAuthoredHeroCamera hero = camera.gameObject.GetComponent<CrownAuthoredHeroCamera>();
            if (hero == null) hero = camera.gameObject.AddComponent<CrownAuthoredHeroCamera>();
            hero.Configure(new Vector3(0f, 27.2f, -27.6f), new Vector3(0f, 2.0f, 1.6f));
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

        private static GameObject Part(string name, Transform parent, Mesh mesh, Vector3 localPosition, Vector3 localScale, Material material, Vector3? localEuler = null)
        {
            GameObject go = new GameObject(name);
            go.transform.SetParent(parent, false);
            go.transform.localPosition = localPosition;
            go.transform.localScale = localScale;
            go.transform.localEulerAngles = localEuler ?? Vector3.zero;
            MeshFilter filter = go.AddComponent<MeshFilter>();
            filter.sharedMesh = mesh;
            MeshRenderer renderer = go.AddComponent<MeshRenderer>();
            renderer.sharedMaterial = material;
            renderer.shadowCastingMode = ShadowCastingMode.On;
            renderer.receiveShadows = true;
            return go;
        }
    }

    public static class CrownAuthoredMeshFactory
    {
        public static Mesh CreateTaperedBox(string name, float topX, float topZ, float topY)
        {
            Vector3[] v =
            {
                new Vector3(-0.5f, -0.5f, -0.5f), new Vector3(0.5f, -0.5f, -0.5f),
                new Vector3(0.5f, -0.5f, 0.5f), new Vector3(-0.5f, -0.5f, 0.5f),
                new Vector3(-0.5f * topX, 0.5f * topY, -0.5f * topZ), new Vector3(0.5f * topX, 0.5f * topY, -0.5f * topZ),
                new Vector3(0.5f * topX, 0.5f * topY, 0.5f * topZ), new Vector3(-0.5f * topX, 0.5f * topY, 0.5f * topZ)
            };
            int[] t = { 0,2,1, 0,3,2, 4,5,6, 4,6,7, 0,1,5, 0,5,4, 1,2,6, 1,6,5, 2,3,7, 2,7,6, 3,0,4, 3,4,7 };
            return Build(name, v, t);
        }

        public static Mesh CreatePrism(string name, int sides, float topScale)
        {
            List<Vector3> vertices = new List<Vector3>(sides * 2 + 2);
            List<int> triangles = new List<int>(sides * 12);
            for (int i = 0; i < sides; i++)
            {
                float a = i * Mathf.PI * 2f / sides;
                vertices.Add(new Vector3(Mathf.Cos(a) * 0.5f, -0.5f, Mathf.Sin(a) * 0.5f));
            }
            for (int i = 0; i < sides; i++)
            {
                float a = i * Mathf.PI * 2f / sides;
                vertices.Add(new Vector3(Mathf.Cos(a) * 0.5f * topScale, 0.5f, Mathf.Sin(a) * 0.5f * topScale));
            }
            int bottom = vertices.Count; vertices.Add(new Vector3(0f, -0.5f, 0f));
            int top = vertices.Count; vertices.Add(new Vector3(0f, 0.5f, 0f));
            for (int i = 0; i < sides; i++)
            {
                int next = (i + 1) % sides;
                triangles.Add(bottom); triangles.Add(next); triangles.Add(i);
                triangles.Add(top); triangles.Add(sides + i); triangles.Add(sides + next);
                triangles.Add(i); triangles.Add(next); triangles.Add(sides + next);
                triangles.Add(i); triangles.Add(sides + next); triangles.Add(sides + i);
            }
            return Build(name, vertices.ToArray(), triangles.ToArray());
        }

        public static Mesh CreateWedge(string name)
        {
            Vector3[] v =
            {
                new Vector3(-0.5f,-0.5f,-0.5f), new Vector3(0.5f,-0.5f,-0.5f), new Vector3(0.5f,-0.5f,0.5f), new Vector3(-0.5f,-0.5f,0.5f),
                new Vector3(-0.34f,0.5f,-0.40f), new Vector3(0.34f,0.5f,-0.40f), new Vector3(0.18f,0.18f,0.5f), new Vector3(-0.18f,0.18f,0.5f)
            };
            int[] t = { 0,2,1, 0,3,2, 4,5,6, 4,6,7, 0,1,5, 0,5,4, 1,2,6, 1,6,5, 2,3,7, 2,7,6, 3,0,4, 3,4,7 };
            return Build(name, v, t);
        }

        public static Mesh CreateBlade(string name)
        {
            Vector3[] v =
            {
                new Vector3(-0.5f,-0.5f,-0.45f), new Vector3(0.5f,-0.5f,-0.45f), new Vector3(0.25f,-0.5f,0.5f), new Vector3(-0.25f,-0.5f,0.5f),
                new Vector3(-0.22f,0.5f,-0.28f), new Vector3(0.22f,0.5f,-0.28f), new Vector3(0f,0.5f,0.58f)
            };
            int[] t = { 0,2,1, 0,3,2, 4,5,6, 0,1,5, 0,5,4, 1,2,6, 1,6,5, 2,3,6, 3,0,4, 3,4,6 };
            return Build(name, v, t);
        }

        public static Mesh CreateRing(string name, int segments, float innerRadius, float outerRadius, float height)
        {
            List<Vector3> vertices = new List<Vector3>(segments * 4);
            List<int> triangles = new List<int>(segments * 24);
            float half = height * 0.5f;
            for (int i = 0; i < segments; i++)
            {
                float a = i * Mathf.PI * 2f / segments;
                float c = Mathf.Cos(a); float s = Mathf.Sin(a);
                vertices.Add(new Vector3(c * innerRadius, -half, s * innerRadius));
                vertices.Add(new Vector3(c * outerRadius, -half, s * outerRadius));
                vertices.Add(new Vector3(c * outerRadius, half, s * outerRadius));
                vertices.Add(new Vector3(c * innerRadius, half, s * innerRadius));
            }
            for (int i = 0; i < segments; i++)
            {
                int n = (i + 1) % segments;
                int a = i * 4; int b = n * 4;
                AddQuad(triangles, a, b, b + 1, a + 1);
                AddQuad(triangles, a + 1, b + 1, b + 2, a + 2);
                AddQuad(triangles, a + 2, b + 2, b + 3, a + 3);
                AddQuad(triangles, a + 3, b + 3, b, a);
            }
            return Build(name, vertices.ToArray(), triangles.ToArray());
        }

        private static void AddQuad(List<int> triangles, int a, int b, int c, int d)
        {
            triangles.Add(a); triangles.Add(b); triangles.Add(c);
            triangles.Add(a); triangles.Add(c); triangles.Add(d);
        }

        private static Mesh Build(string name, Vector3[] vertices, int[] triangles)
        {
            Mesh mesh = new Mesh { name = name };
            mesh.vertices = vertices;
            mesh.triangles = triangles;
            mesh.RecalculateNormals();
            mesh.RecalculateTangents();
            mesh.RecalculateBounds();
            return mesh;
        }
    }

    public sealed class CrownAuthoredUnitMotion : MonoBehaviour
    {
        private CrownUnit _unit;
        private Transform _body;
        private Transform _leftLeg;
        private Transform _rightLeg;
        private Transform _weapon;
        private Vector3 _lastPosition;
        private Vector3 _weaponBase;
        private float _seed;

        public void Configure(CrownUnit unit, Transform body, Transform leftLeg, Transform rightLeg, Transform weapon)
        {
            _unit = unit; _body = body; _leftLeg = leftLeg; _rightLeg = rightLeg; _weapon = weapon;
            _lastPosition = unit.transform.position;
            _weaponBase = weapon.localPosition;
            _seed = unit.GetInstanceID() * 0.017f;
        }

        private void LateUpdate()
        {
            if (_unit == null) return;
            float speed = (_unit.transform.position - _lastPosition).magnitude / Mathf.Max(Time.deltaTime, 0.0001f);
            _lastPosition = _unit.transform.position;
            float gait = Time.time * Mathf.Lerp(4f, 10f, Mathf.Clamp01(speed / 4f)) + _seed;
            float amount = Mathf.Clamp01(speed * 0.32f) * 24f;
            _leftLeg.localRotation = Quaternion.Euler(Mathf.Sin(gait) * amount, 0f, 0f);
            _rightLeg.localRotation = Quaternion.Euler(-Mathf.Sin(gait) * amount, 0f, 0f);
            _body.localPosition = new Vector3(0f, Mathf.Sin(gait * 2f) * (0.025f + speed * 0.006f), 0f);
            _body.localRotation = Quaternion.Euler(speed > 0.1f ? 7f : Mathf.Sin(Time.time * 2f + _seed) * 1.2f, 0f, 0f);
            _weapon.localPosition = Vector3.Lerp(_weapon.localPosition, _weaponBase, Time.deltaTime * 14f);
            if (_unit.IsDead) transform.localRotation = Quaternion.Slerp(transform.localRotation, Quaternion.Euler(72f, 0f, 18f), Time.deltaTime * 6f);
        }
    }

    public sealed class CrownAuthoredTowerMotion : MonoBehaviour
    {
        private CrownBuilding _building;
        private Transform _head;
        private Transform _barrel;
        private Vector3 _barrelBase;
        private float _direction;

        public void Configure(CrownBuilding building, Transform head, Transform barrel, float direction)
        {
            _building = building; _head = head; _barrel = barrel; _barrelBase = barrel.localPosition; _direction = direction;
        }

        private void LateUpdate()
        {
            if (_building == null || _building.IsDead) return;
            _head.localRotation = Quaternion.Euler(0f, Mathf.Sin(Time.time * 0.72f + _building.Lane) * 18f * _direction, 0f);
            _barrel.localPosition = _barrelBase + Vector3.back * (Mathf.Max(0f, Mathf.Sin(Time.time * 5.25f + _building.Lane * 1.9f)) * 0.06f);
        }
    }

    public sealed class CrownAuthoredCoreMotion : MonoBehaviour
    {
        private CrownBuilding _building;
        private Transform _a;
        private Transform _b;
        private Transform _c;

        public void Configure(CrownBuilding building, Transform a, Transform b, Transform c)
        {
            _building = building; _a = a; _b = b; _c = c;
        }

        private void LateUpdate()
        {
            if (_building == null) return;
            float critical = Mathf.InverseLerp(3200f, 0f, _building.Health);
            _a.Rotate(Vector3.up, (28f + critical * 45f) * Time.deltaTime, Space.Self);
            _b.Rotate(Vector3.right, (-22f - critical * 35f) * Time.deltaTime, Space.Self);
            _c.Rotate(Vector3.forward, (18f + critical * 30f) * Time.deltaTime, Space.Self);
            transform.localScale = Vector3.one * (1f + Mathf.Sin(Time.time * (2.2f + critical * 3f)) * (0.018f + critical * 0.035f));
        }
    }

    public sealed class CrownAuthoredHeroCamera : MonoBehaviour
    {
        private Vector3 _basePosition;
        private Vector3 _target;
        private float _started;

        public void Configure(Vector3 position, Vector3 target)
        {
            _basePosition = position;
            _target = target;
            _started = Time.time;
            transform.position = position + Vector3.back * 1.3f;
            transform.LookAt(target);
        }

        private void LateUpdate()
        {
            float settle = 1f - Mathf.Exp(-(Time.time - _started) * 4.2f);
            Vector3 breathing = new Vector3(Mathf.Sin(Time.time * 0.24f) * 0.035f, Mathf.Sin(Time.time * 0.31f) * 0.045f, 0f);
            transform.position = Vector3.Lerp(_basePosition + Vector3.back * 1.3f, _basePosition, settle) + breathing;
            transform.LookAt(_target + breathing * 0.25f);
        }
    }
}
