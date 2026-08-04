using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Rendering;

namespace CrownFront.Cloud
{
    [DefaultExecutionOrder(2300)]
    public sealed class CrownQuaterniusArtReboot : MonoBehaviour
    {
        private readonly Dictionary<string, GameObject> _prefabs = new Dictionary<string, GameObject>(32);
        private readonly HashSet<CrownBuilding> _skinnedBuildings = new HashSet<CrownBuilding>();
        private readonly HashSet<CrownUnit> _skinnedUnits = new HashSet<CrownUnit>();

        private Transform _titan;
        private Material _hullDark;
        private Material _hullMid;
        private Material _hullEdge;
        private Material _blueArmor;
        private Material _redArmor;
        private Material _blueEnergy;
        private Material _redEnergy;
        private Material _whiteEnergy;
        private Material _brass;
        private bool _applied;
        private float _nextScan;

        private static readonly string[] RequiredResources =
        {
            "CrownArt/Quaternius/SciFiEssentials/Enemy_EyeDrone",
            "CrownArt/Quaternius/SciFiEssentials/Enemy_QuadShell",
            "CrownArt/Quaternius/SciFiEssentials/Enemy_Trilobite",
            "CrownArt/Quaternius/SciFiEssentials/Gun_Pistol",
            "CrownArt/Quaternius/SciFiEssentials/Gun_Rifle",
            "CrownArt/Quaternius/SciFiEssentials/Gun_Sniper",
            "CrownArt/Quaternius/SciFiEssentials/Prop_Crate_Large",
            "CrownArt/Quaternius/SciFiEssentials/Prop_Locker",
            "CrownArt/Quaternius/SciFiEssentials/Prop_Mine",
            "CrownArt/Quaternius/SciFiEssentials/Prop_SatelliteDish",
            "CrownArt/Quaternius/UltimateSpace/Base_Large",
            "CrownArt/Quaternius/UltimateSpace/Building_L",
            "CrownArt/Quaternius/UltimateSpace/Connector",
            "CrownArt/Quaternius/UltimateSpace/Geodesic_Dome",
            "CrownArt/Quaternius/UltimateSpace/House_Long",
            "CrownArt/Quaternius/UltimateSpace/House_Pod",
            "CrownArt/Quaternius/UltimateSpace/Metal_Support",
            "CrownArt/Quaternius/UltimateSpace/Pickup_Crate",
            "CrownArt/Quaternius/UltimateSpace/Spaceship",
            "CrownArt/Quaternius/UltimateSpace/Spaceship_Jqfed124pQ",
            "CrownArt/Quaternius/UltimateSpace/Spaceship_VSxUAFhzbA",
            "CrownArt/Quaternius/UltimateSpace/Spaceship_u105mYHLHU",
        };

        private void Start() => ApplyNow();

        private void Update()
        {
            if (!_applied || Time.unscaledTime < _nextScan) return;
            _nextScan = Time.unscaledTime + 0.16f;
            SkinBuildings();
            SkinUnits();
        }

        public void ApplyNow()
        {
            if (_applied) return;
            GameObject titanObject = GameObject.Find("THE CROWN ENGINE // PRESENTATION ROOT");
            if (titanObject == null) return;

            _titan = titanObject.transform;
            LoadResources();
            CreateMaterials();
            DisableOlderPresentation();
            ConfigureLighting();
            BuildTitan();
            SkinBuildings();
            SkinUnits();
            ConfigureCamera();
            _applied = true;
            Debug.Log("CROWN//FRONT Quaternius Art Reboot applied: selected CC0 drones, guns, ships, structures and reactor forms now drive the visible game presentation.");
        }

        private void LoadResources()
        {
            for (int i = 0; i < RequiredResources.Length; i++)
            {
                string path = RequiredResources[i];
                GameObject prefab = Resources.Load<GameObject>(path);
                if (prefab == null)
                {
                    throw new InvalidOperationException($"Required Quaternius Art Reboot resource is missing: Resources/{path}");
                }
                _prefabs[path] = prefab;
            }
        }

        private void CreateMaterials()
        {
            Shader shader = Shader.Find("CrownFront/EngineSurface") ??
                            Shader.Find("Universal Render Pipeline/Lit") ??
                            Shader.Find("Standard") ??
                            Shader.Find("Unlit/Color");
            if (shader == null) throw new InvalidOperationException("No WebGL-compatible shader is available for the Quaternius Art Reboot.");

            _hullDark = CreateMaterial(shader, "Q // Hull Dark", new Color(0.018f, 0.027f, 0.043f), 0.78f, 0.34f, Color.black);
            _hullMid = CreateMaterial(shader, "Q // Hull Mid", new Color(0.075f, 0.105f, 0.145f), 0.86f, 0.50f, Color.black);
            _hullEdge = CreateMaterial(shader, "Q // Hull Edge", new Color(0.28f, 0.35f, 0.43f), 0.91f, 0.66f, Color.black);
            _blueArmor = CreateMaterial(shader, "Q // Vanguard Armor", new Color(0.025f, 0.19f, 0.50f), 0.72f, 0.62f, new Color(0f, 0.075f, 0.28f));
            _redArmor = CreateMaterial(shader, "Q // Hostile Armor", new Color(0.50f, 0.030f, 0.014f), 0.74f, 0.58f, new Color(0.30f, 0.008f, 0f));
            _blueEnergy = CreateMaterial(shader, "Q // Vanguard Energy", new Color(0.02f, 0.74f, 1f), 0.06f, 0.92f, new Color(0f, 2.4f, 4.8f));
            _redEnergy = CreateMaterial(shader, "Q // Hostile Energy", new Color(1f, 0.12f, 0.01f), 0.06f, 0.90f, new Color(4.8f, 0.22f, 0f));
            _whiteEnergy = CreateMaterial(shader, "Q // Crown Energy", new Color(0.82f, 0.93f, 1f), 0.08f, 0.94f, new Color(2.0f, 2.6f, 3.4f));
            _brass = CreateMaterial(shader, "Q // Crown Brass", new Color(0.42f, 0.25f, 0.055f), 0.94f, 0.62f, Color.black);
        }

        private static Material CreateMaterial(Shader shader, string name, Color color, float metallic, float smoothness, Color emission)
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

        private void DisableOlderPresentation()
        {
            Renderer[] renderers = _titan.GetComponentsInChildren<Renderer>(true);
            for (int i = 0; i < renderers.Length; i++) renderers[i].enabled = false;

            CrownArtRebootHeroFrame first = GetComponent<CrownArtRebootHeroFrame>();
            if (first != null) first.enabled = false;
            CrownArtRebootIteration2 second = GetComponent<CrownArtRebootIteration2>();
            if (second != null) second.enabled = false;
            CrownAssetArtReboot third = GetComponent<CrownAssetArtReboot>();
            if (third != null) third.enabled = false;
            CrownAssetArtDirectionPass fourth = GetComponent<CrownAssetArtDirectionPass>();
            if (fourth != null) fourth.enabled = false;
        }

        private void ConfigureLighting()
        {
            RenderSettings.fog = true;
            RenderSettings.fogColor = new Color(0.006f, 0.012f, 0.022f);
            RenderSettings.fogDensity = 0.0042f;
            RenderSettings.ambientMode = AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color(0.19f, 0.25f, 0.34f);
            RenderSettings.ambientEquatorColor = new Color(0.060f, 0.085f, 0.125f);
            RenderSettings.ambientGroundColor = new Color(0.010f, 0.015f, 0.025f);

            Light[] lights = FindObjectsByType<Light>(FindObjectsInactive.Exclude);
            for (int i = 0; i < lights.Length; i++)
            {
                Light light = lights[i];
                if (light.type == LightType.Directional)
                {
                    light.enabled = true;
                    light.intensity = 1.08f;
                    light.color = new Color(0.74f, 0.84f, 1f);
                    light.transform.rotation = Quaternion.Euler(48f, -34f, -7f);
                }
                else
                {
                    light.enabled = false;
                }
            }
        }

        private void BuildTitan()
        {
            Transform root = Group("QUATERNIUS ART REBOOT // MECHANICAL KING", _titan);
            BuildTorso(root);
            BuildRoutes(root);
            BuildHead(root);
            BuildMachinery(root);
        }

        private void BuildTorso(Transform parent)
        {
            Transform torso = Group("Mechanical King Torso", parent);
            Transform sternum = Model(
                "CrownArt/Quaternius/UltimateSpace/House_Long",
                torso,
                "Central Sternum Hull",
                new Vector3(0f, -1.4f, 1.0f),
                new Vector3(15.5f, 3.8f, 23.0f),
                Vector3.zero,
                false);
            Repaint(sternum, _hullDark, _hullMid, _hullEdge);

            Transform leftShoulder = Model(
                "CrownArt/Quaternius/UltimateSpace/Spaceship_Jqfed124pQ",
                torso,
                "Left Shoulder Fortress",
                new Vector3(-9.0f, 0.35f, 7.0f),
                new Vector3(7.0f, 4.6f, 7.8f),
                new Vector3(0f, 22f, -7f),
                false);
            Repaint(leftShoulder, _hullDark, _blueArmor, _hullEdge);

            Transform rightShoulder = Model(
                "CrownArt/Quaternius/UltimateSpace/Spaceship_u105mYHLHU",
                torso,
                "Right Shoulder Fortress",
                new Vector3(9.0f, 0.35f, 7.0f),
                new Vector3(7.0f, 4.6f, 7.8f),
                new Vector3(0f, -22f, 7f),
                false);
            Repaint(rightShoulder, _hullDark, _redArmor, _hullEdge);

            Transform lower = Model(
                "CrownArt/Quaternius/UltimateSpace/Base_Large",
                torso,
                "Lower Torso Bastion",
                new Vector3(0f, -1.8f, -5.6f),
                new Vector3(15.0f, 3.0f, 9.0f),
                Vector3.zero,
                false);
            Repaint(lower, _hullDark, _hullMid, _hullEdge);
        }

        private void BuildRoutes(Transform parent)
        {
            Transform routes = Group("Anatomical Combat Deck", parent);
            BuildRoute(routes, -4.4f, -1f, _blueArmor, _blueEnergy, "Shield Arm Route");
            BuildRoute(routes, 0f, 0f, _hullEdge, _whiteEnergy, "Crown Spine Route");
            BuildRoute(routes, 4.4f, 1f, _redArmor, _redEnergy, "Blade Arm Route");

            Transform bridge = Model(
                "CrownArt/Quaternius/UltimateSpace/Building_L",
                routes,
                "Cross Body Weapon Bridge",
                new Vector3(0f, 2.20f, 0.7f),
                new Vector3(14.5f, 0.95f, 3.2f),
                new Vector3(0f, 90f, 0f),
                false);
            Repaint(bridge, _hullDark, _hullMid, _hullEdge);

            Transform junction = Model(
                "CrownArt/Quaternius/UltimateSpace/Geodesic_Dome",
                routes,
                "Crown Junction",
                new Vector3(0f, 2.56f, 0.7f),
                new Vector3(3.2f, 0.72f, 3.2f),
                Vector3.zero,
                false);
            Repaint(junction, _hullMid, _brass, _hullEdge);
            Accent(routes, "Junction Crown Energy", new Vector3(0f, 2.98f, 0.7f), new Vector3(0.95f, 0.10f, 0.95f), _whiteEnergy);
        }

        private void BuildRoute(Transform parent, float x, float side, Material armor, Material energy, string name)
        {
            Transform route = Group(name, parent);
            for (int z = -8; z <= 10; z += 3)
            {
                Transform segment = Model(
                    "CrownArt/Quaternius/UltimateSpace/Connector",
                    route,
                    "Route Segment",
                    new Vector3(x, 2.20f, z),
                    new Vector3(3.55f, 0.66f, 2.62f),
                    new Vector3(0f, side * ((z / 3) % 2 == 0 ? 3f : -3f), 0f),
                    false);
                Repaint(segment, _hullDark, _hullMid, armor);

                if (side != 0f)
                {
                    Transform support = Model(
                        "CrownArt/Quaternius/UltimateSpace/Metal_Support",
                        route,
                        "Anatomical Outer Support",
                        new Vector3(x + side * 1.70f, 2.18f, z),
                        new Vector3(0.72f, 0.78f, 2.3f),
                        new Vector3(0f, side < 0f ? 0f : 180f, side * 8f),
                        false);
                    Repaint(support, _hullDark, armor, _hullEdge);
                }

                Accent(route, "Embedded Route Energy", new Vector3(x, 2.60f, z), new Vector3(0.12f, 0.06f, 0.78f), energy);
            }
        }

        private void BuildHead(Transform parent)
        {
            Transform head = Group("Mechanical King Head", parent);
            Transform cranium = Model(
                "CrownArt/Quaternius/UltimateSpace/Spaceship_VSxUAFhzbA",
                head,
                "Crown Cranium",
                new Vector3(0f, 4.25f, 14.0f),
                new Vector3(7.0f, 4.3f, 5.0f),
                new Vector3(0f, 180f, 0f),
                false);
            Repaint(cranium, _hullDark, _hullMid, _brass);

            Transform mask = Model(
                "CrownArt/Quaternius/UltimateSpace/House_Pod",
                head,
                "Face Mask",
                new Vector3(0f, 3.55f, 12.3f),
                new Vector3(5.4f, 2.8f, 1.35f),
                new Vector3(0f, 180f, 0f),
                false);
            Repaint(mask, _hullDark, _hullMid, _hullEdge);

            Accent(head, "Left Hostile Eye", new Vector3(-1.32f, 4.25f, 11.58f), new Vector3(0.86f, 0.13f, 0.09f), _redEnergy);
            Accent(head, "Right Hostile Eye", new Vector3(1.32f, 4.25f, 11.58f), new Vector3(0.86f, 0.13f, 0.09f), _redEnergy);

            BuildCrownProng(head, -2.15f, 7.2f, 14.1f, 3.1f, -13f);
            BuildCrownProng(head, 0f, 7.65f, 14.1f, 4.1f, 0f);
            BuildCrownProng(head, 2.15f, 7.2f, 14.1f, 3.1f, 13f);
        }

        private void BuildCrownProng(Transform parent, float x, float y, float z, float height, float roll)
        {
            Transform prong = Model(
                "CrownArt/Quaternius/SciFiEssentials/Gun_Sniper",
                parent,
                "Crown Rail Prong",
                new Vector3(x, y, z),
                new Vector3(0.62f, height, 0.70f),
                new Vector3(0f, 0f, 90f + roll),
                false);
            Repaint(prong, _hullDark, _brass, _hullEdge);
        }

        private void BuildMachinery(Transform parent)
        {
            Transform machinery = Group("Visible Titan Machinery", parent);
            for (int side = -1; side <= 1; side += 2)
            {
                Transform locker = Model(
                    "CrownArt/Quaternius/SciFiEssentials/Prop_Locker",
                    machinery,
                    side < 0 ? "Left Shoulder Machinery" : "Right Shoulder Machinery",
                    new Vector3(side * 7.15f, 0.55f, -1.8f),
                    new Vector3(2.15f, 3.1f, 2.15f),
                    new Vector3(0f, side < 0 ? 18f : -18f, 0f),
                    false);
                TintTextured(locker, side < 0 ? new Color(0.36f, 0.56f, 1f) : new Color(1f, 0.38f, 0.22f));

                Transform dish = Model(
                    "CrownArt/Quaternius/SciFiEssentials/Prop_SatelliteDish",
                    machinery,
                    side < 0 ? "Left Signal Array" : "Right Signal Array",
                    new Vector3(side * 7.4f, 1.7f, 8.7f),
                    new Vector3(1.7f, 2.2f, 1.7f),
                    new Vector3(-18f, side < 0 ? 18f : -18f, 0f),
                    false);
                TintTextured(dish, side < 0 ? new Color(0.38f, 0.62f, 1f) : new Color(1f, 0.42f, 0.24f));
            }
        }

        private void SkinBuildings()
        {
            CrownBuilding[] buildings = FindObjectsByType<CrownBuilding>(FindObjectsInactive.Include);
            for (int i = 0; i < buildings.Length; i++)
            {
                CrownBuilding building = buildings[i];
                if (building == null || _skinnedBuildings.Contains(building)) continue;
                DisableRenderers(building.transform);
                if (building.IsCore) BuildCore(building);
                else BuildTower(building);
                _skinnedBuildings.Add(building);
            }
        }

        private void BuildCore(CrownBuilding building)
        {
            bool blue = building.Team == CrownTeam.Blue;
            Material armor = blue ? _blueArmor : _redArmor;
            Material energy = blue ? _blueEnergy : _redEnergy;
            Color tint = blue ? new Color(0.34f, 0.56f, 1f) : new Color(1f, 0.34f, 0.18f);
            Transform root = Group("QUATERNIUS ART // CORE", building.transform);

            Transform baseModel = Model(
                "CrownArt/Quaternius/UltimateSpace/Base_Large",
                root,
                "Embedded Reactor Base",
                Vector3.zero,
                new Vector3(4.5f, 1.0f, 4.5f),
                Vector3.zero,
                false);
            Repaint(baseModel, _hullDark, armor, _hullEdge);

            Transform dome = Model(
                "CrownArt/Quaternius/UltimateSpace/Geodesic_Dome",
                root,
                "Reactor Containment Dome",
                new Vector3(0f, 0.65f, 0f),
                new Vector3(3.5f, 1.8f, 3.5f),
                Vector3.zero,
                false);
            Repaint(dome, _hullMid, armor, _hullEdge);

            Transform lens = Model(
                "CrownArt/Quaternius/SciFiEssentials/Enemy_EyeDrone",
                root,
                "Living Crown Lens",
                new Vector3(0f, 1.45f, 0f),
                new Vector3(1.55f, 1.55f, 1.55f),
                Vector3.zero,
                false);
            TintTextured(lens, tint);
            Accent(root, "Reactor White Center", new Vector3(0f, 1.52f, -0.72f), new Vector3(0.38f, 0.38f, 0.12f), _whiteEnergy);

            Transform orbit = Group("Reactor Stabilizers", root);
            for (int index = 0; index < 3; index++)
            {
                float angle = index * 120f;
                float radians = angle * Mathf.Deg2Rad;
                Vector3 position = new Vector3(Mathf.Sin(radians) * 2.05f, 0.58f, Mathf.Cos(radians) * 2.05f);
                Transform mine = Model(
                    "CrownArt/Quaternius/SciFiEssentials/Prop_Mine",
                    orbit,
                    "Three Point Stabilizer",
                    position,
                    new Vector3(0.82f, 1.18f, 0.82f),
                    new Vector3(0f, angle, 0f),
                    false);
                TintTextured(mine, tint);
                Accent(orbit, "Stabilizer Energy", position + Vector3.up * 0.62f, new Vector3(0.16f, 0.42f, 0.16f), energy);
            }

            CrownQuaterniusCoreMotion motion = root.gameObject.AddComponent<CrownQuaterniusCoreMotion>();
            motion.Configure(building, lens, orbit);
        }

        private void BuildTower(CrownBuilding building)
        {
            bool blue = building.Team == CrownTeam.Blue;
            Material armor = blue ? _blueArmor : _redArmor;
            Material energy = blue ? _blueEnergy : _redEnergy;
            Color tint = blue ? new Color(0.36f, 0.60f, 1f) : new Color(1f, 0.36f, 0.20f);
            float forward = blue ? 1f : -1f;
            Transform root = Group("QUATERNIUS ART // TOWER", building.transform);

            Transform baseModel = Model(
                "CrownArt/Quaternius/SciFiEssentials/Prop_Crate_Large",
                root,
                "Tower Armored Socket",
                Vector3.zero,
                new Vector3(2.05f, 0.86f, 2.05f),
                new Vector3(0f, blue ? 0f : 180f, 0f),
                false);
            TintTextured(baseModel, tint);

            Transform yaw = Group("Tower Yaw Module", root);
            yaw.localPosition = new Vector3(0f, 0.82f, 0f);
            Transform shell = Model(
                "CrownArt/Quaternius/SciFiEssentials/Enemy_QuadShell",
                yaw,
                "QuadShell Weapon Head",
                Vector3.zero,
                new Vector3(1.55f, 1.15f, 1.55f),
                new Vector3(0f, blue ? 0f : 180f, 0f),
                false);
            TintTextured(shell, tint);

            Transform leftRail = Model(
                "CrownArt/Quaternius/SciFiEssentials/Gun_Sniper",
                yaw,
                "Left Tower Rail",
                new Vector3(-0.38f, 0.14f, forward * 0.90f),
                new Vector3(0.22f, 0.22f, 1.55f),
                new Vector3(0f, blue ? 0f : 180f, 0f),
                false);
            TintTextured(leftRail, tint);

            Transform rightRail = Model(
                "CrownArt/Quaternius/SciFiEssentials/Gun_Sniper",
                yaw,
                "Right Tower Rail",
                new Vector3(0.38f, 0.14f, forward * 0.90f),
                new Vector3(0.22f, 0.22f, 1.55f),
                new Vector3(0f, blue ? 0f : 180f, 0f),
                false);
            TintTextured(rightRail, tint);
            Accent(yaw, "Tower Team Aperture", new Vector3(0f, 0.22f, forward * 0.86f), new Vector3(0.42f, 0.18f, 0.10f), energy);

            CrownQuaterniusTowerMotion motion = root.gameObject.AddComponent<CrownQuaterniusTowerMotion>();
            motion.Configure(building, yaw, leftRail, rightRail, forward);
        }

        private void SkinUnits()
        {
            CrownUnit[] units = FindObjectsByType<CrownUnit>(FindObjectsInactive.Include);
            for (int i = 0; i < units.Length; i++)
            {
                CrownUnit unit = units[i];
                if (unit == null || _skinnedUnits.Contains(unit)) continue;
                DisableRenderers(unit.transform);
                BuildUnit(unit);
                _skinnedUnits.Add(unit);
            }
        }

        private void BuildUnit(CrownUnit unit)
        {
            bool blue = unit.Team == CrownTeam.Blue;
            Material energy = blue ? _blueEnergy : _redEnergy;
            Color tint = blue ? new Color(0.32f, 0.58f, 1f) : new Color(1f, 0.32f, 0.18f);
            Transform root = Group("QUATERNIUS ART // UNIT", unit.transform);

            string modelPath;
            Vector3 desired;
            float hover;
            switch (unit.Kind)
            {
                case CrownUnitKind.Tank:
                    modelPath = "CrownArt/Quaternius/SciFiEssentials/Enemy_QuadShell";
                    desired = new Vector3(1.72f, 1.52f, 1.84f);
                    hover = 0f;
                    break;
                case CrownUnitKind.Raider:
                    modelPath = "CrownArt/Quaternius/SciFiEssentials/Enemy_EyeDrone";
                    desired = new Vector3(0.96f, 0.96f, 0.96f);
                    hover = 0.52f;
                    break;
                default:
                    modelPath = "CrownArt/Quaternius/SciFiEssentials/Enemy_Trilobite";
                    desired = new Vector3(1.28f, 1.42f, 1.62f);
                    hover = 0f;
                    break;
            }

            Transform body = Model(
                modelPath,
                root,
                "Faction Combat Drone",
                new Vector3(0f, hover, 0f),
                desired,
                new Vector3(0f, blue ? 0f : 180f, 0f),
                true);
            TintTextured(body, tint);

            string weaponPath = unit.Kind == CrownUnitKind.Tank
                ? "CrownArt/Quaternius/SciFiEssentials/Gun_Sniper"
                : unit.Kind == CrownUnitKind.Raider
                    ? "CrownArt/Quaternius/SciFiEssentials/Gun_Pistol"
                    : "CrownArt/Quaternius/SciFiEssentials/Gun_Rifle";
            Vector3 weaponSize = unit.Kind == CrownUnitKind.Tank
                ? new Vector3(0.32f, 0.32f, 1.48f)
                : unit.Kind == CrownUnitKind.Raider
                    ? new Vector3(0.22f, 0.22f, 0.70f)
                    : new Vector3(0.26f, 0.26f, 1.08f);
            Transform weapon = Model(
                weaponPath,
                root,
                "Class Weapon",
                new Vector3(0.34f, hover + 0.72f, 0.62f),
                weaponSize,
                new Vector3(0f, blue ? 0f : 180f, -5f),
                false);
            TintTextured(weapon, tint);
            Accent(root, "Faction Energy Signature", new Vector3(0f, hover + 0.78f, 0.58f), new Vector3(0.24f, 0.10f, 0.08f), energy);

            CrownQuaterniusUnitMotion motion = root.gameObject.AddComponent<CrownQuaterniusUnitMotion>();
            motion.Configure(unit, body, weapon, hover);
        }

        private void ConfigureCamera()
        {
            Camera camera = Camera.main;
            if (camera == null) return;
            DisableCameraRig<CrownAuthoredHeroCamera>(camera);
            DisableCameraRig<CrownIteration2Camera>(camera);
            DisableCameraRig<CrownAssetHeroCamera>(camera);
            camera.fieldOfView = 30.5f;
            CrownQuaterniusHeroCamera rig = camera.GetComponent<CrownQuaterniusHeroCamera>();
            if (rig == null) rig = camera.gameObject.AddComponent<CrownQuaterniusHeroCamera>();
            rig.Configure(new Vector3(0f, 30.5f, -31.8f), new Vector3(0f, 2.15f, 1.25f));
        }

        private static void DisableCameraRig<T>(Camera camera) where T : Behaviour
        {
            T rig = camera.GetComponent<T>();
            if (rig != null) rig.enabled = false;
        }

        private Transform Model(
            string resourcePath,
            Transform parent,
            string name,
            Vector3 localPosition,
            Vector3 desiredBounds,
            Vector3 localEuler,
            bool alignBottom)
        {
            GameObject holderObject = new GameObject(name);
            Transform holder = holderObject.transform;
            holder.SetParent(parent, false);
            holder.localPosition = localPosition;
            holder.localEulerAngles = localEuler;

            GameObject instance = Instantiate(_prefabs[resourcePath], holder, false);
            instance.name = "Source // " + resourcePath.Substring(resourcePath.LastIndexOf('/') + 1);
            Renderer[] renderers = instance.GetComponentsInChildren<Renderer>(true);
            if (renderers.Length == 0) throw new InvalidOperationException($"Quaternius source model has no renderers: {resourcePath}");
            for (int i = 0; i < renderers.Length; i++)
            {
                renderers[i].enabled = true;
                renderers[i].shadowCastingMode = ShadowCastingMode.On;
                renderers[i].receiveShadows = true;
            }

            Bounds bounds = CombinedBounds(renderers);
            float factor = Mathf.Min(
                desiredBounds.x / Mathf.Max(bounds.size.x, 0.001f),
                Mathf.Min(
                    desiredBounds.y / Mathf.Max(bounds.size.y, 0.001f),
                    desiredBounds.z / Mathf.Max(bounds.size.z, 0.001f)));
            factor = Mathf.Clamp(factor, 0.001f, 1000f);
            instance.transform.localScale *= factor;

            bounds = CombinedBounds(renderers);
            Vector3 target = holder.position;
            Vector3 delta = alignBottom
                ? new Vector3(target.x - bounds.center.x, target.y - bounds.min.y, target.z - bounds.center.z)
                : target - bounds.center;
            instance.transform.position += delta;

            Collider[] colliders = instance.GetComponentsInChildren<Collider>(true);
            for (int i = 0; i < colliders.Length; i++) Destroy(colliders[i]);
            return holder;
        }

        private static Bounds CombinedBounds(IReadOnlyList<Renderer> renderers)
        {
            Bounds bounds = renderers[0].bounds;
            for (int i = 1; i < renderers.Count; i++) bounds.Encapsulate(renderers[i].bounds);
            return bounds;
        }

        private static void Repaint(Transform root, Material primary, Material secondary, Material tertiary)
        {
            Renderer[] renderers = root.GetComponentsInChildren<Renderer>(true);
            for (int r = 0; r < renderers.Length; r++)
            {
                int count = Mathf.Max(1, renderers[r].sharedMaterials.Length);
                Material[] materials = new Material[count];
                for (int i = 0; i < count; i++)
                {
                    materials[i] = i % 3 == 0 ? primary : i % 3 == 1 ? secondary : tertiary;
                }
                renderers[r].sharedMaterials = materials;
                renderers[r].enabled = true;
            }
        }

        private static void TintTextured(Transform root, Color tint)
        {
            Renderer[] renderers = root.GetComponentsInChildren<Renderer>(true);
            MaterialPropertyBlock block = new MaterialPropertyBlock();
            for (int i = 0; i < renderers.Length; i++)
            {
                renderers[i].GetPropertyBlock(block);
                block.SetColor("_Color", tint);
                block.SetColor("_BaseColor", tint);
                renderers[i].SetPropertyBlock(block);
                renderers[i].enabled = true;
                block.Clear();
            }
        }

        private static GameObject Accent(Transform parent, string name, Vector3 position, Vector3 scale, Material material)
        {
            GameObject accent = GameObject.CreatePrimitive(PrimitiveType.Cube);
            accent.name = name;
            accent.transform.SetParent(parent, false);
            accent.transform.localPosition = position;
            accent.transform.localScale = scale;
            Renderer renderer = accent.GetComponent<Renderer>();
            renderer.sharedMaterial = material;
            Collider collider = accent.GetComponent<Collider>();
            if (collider != null) Destroy(collider);
            return accent;
        }

        private static void DisableRenderers(Transform root)
        {
            Renderer[] renderers = root.GetComponentsInChildren<Renderer>(true);
            for (int i = 0; i < renderers.Length; i++) renderers[i].enabled = false;
        }

        private static Transform Group(string name, Transform parent)
        {
            GameObject group = new GameObject(name);
            group.transform.SetParent(parent, false);
            return group.transform;
        }
    }

    public sealed class CrownQuaterniusCoreMotion : MonoBehaviour
    {
        private CrownBuilding _building;
        private Transform _lens;
        private Transform _stabilizers;

        public void Configure(CrownBuilding building, Transform lens, Transform stabilizers)
        {
            _building = building;
            _lens = lens;
            _stabilizers = stabilizers;
        }

        private void LateUpdate()
        {
            if (_building == null) return;
            float damage = Mathf.InverseLerp(3200f, 0f, _building.Health);
            if (_lens != null) _lens.Rotate(Vector3.up, (18f + damage * 34f) * Time.deltaTime, Space.Self);
            if (_stabilizers != null) _stabilizers.Rotate(Vector3.up, (-10f - damage * 22f) * Time.deltaTime, Space.Self);
            transform.localScale = Vector3.one * (1f + Mathf.Sin(Time.time * (2.0f + damage * 2.5f)) * (0.010f + damage * 0.025f));
        }
    }

    public sealed class CrownQuaterniusTowerMotion : MonoBehaviour
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
            _yaw.localRotation = Quaternion.Euler(0f, Mathf.Sin(Time.time * 0.66f + _building.Lane) * 15f, 0f);
            float recoil = Mathf.Max(0f, Mathf.Sin(Time.time * 5.1f + _building.Lane * 1.6f)) * 0.055f;
            Vector3 offset = Vector3.back * (_forward * recoil);
            _left.localPosition = _leftBase + offset;
            _right.localPosition = _rightBase + offset;
        }
    }

    public sealed class CrownQuaterniusUnitMotion : MonoBehaviour
    {
        private CrownUnit _unit;
        private Transform _body;
        private Transform _weapon;
        private Vector3 _lastPosition;
        private Vector3 _bodyBase;
        private Vector3 _weaponBase;
        private float _seed;
        private float _hover;

        public void Configure(CrownUnit unit, Transform body, Transform weapon, float hover)
        {
            _unit = unit;
            _body = body;
            _weapon = weapon;
            _lastPosition = unit.transform.position;
            _bodyBase = body.localPosition;
            _weaponBase = weapon.localPosition;
            _hover = hover;
            _seed = ((int)unit.Team * 17 + (int)unit.Kind * 7 + unit.Lane) * 0.37f;
        }

        private void LateUpdate()
        {
            if (_unit == null) return;
            float speed = (_unit.transform.position - _lastPosition).magnitude / Mathf.Max(Time.deltaTime, 0.0001f);
            _lastPosition = _unit.transform.position;
            float phase = Time.time * Mathf.Lerp(4.0f, 8.8f, Mathf.Clamp01(speed / 4f)) + _seed;
            float bob = Mathf.Sin(phase * 2f) * (0.018f + speed * 0.005f);
            if (_hover > 0f) bob += Mathf.Sin(Time.time * 2.6f + _seed) * 0.055f;
            _body.localPosition = _bodyBase + Vector3.up * bob;
            _body.localRotation = Quaternion.Euler(speed > 0.08f ? 5f : Mathf.Sin(phase) * 1.4f, 0f, Mathf.Sin(phase * 0.5f) * 1.8f);
            _weapon.localPosition = Vector3.Lerp(_weapon.localPosition, _weaponBase + Vector3.up * (bob * 0.45f), Time.deltaTime * 12f);
        }
    }

    public sealed class CrownQuaterniusHeroCamera : MonoBehaviour
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
            Vector3 breath = new Vector3(Mathf.Sin(Time.time * 0.22f) * 0.022f, Mathf.Sin(Time.time * 0.29f) * 0.028f, 0f);
            transform.position = Vector3.Lerp(_position + Vector3.back, _position, settle) + breath;
            transform.LookAt(_target + breath * 0.2f);
        }
    }
}
