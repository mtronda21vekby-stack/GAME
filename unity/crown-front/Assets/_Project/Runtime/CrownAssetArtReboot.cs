using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Rendering;

namespace CrownFront.Cloud
{
    [DefaultExecutionOrder(1500)]
    public sealed class CrownAssetArtReboot : MonoBehaviour
    {
        private readonly Dictionary<string, GameObject> _prefabs = new Dictionary<string, GameObject>(40);
        private readonly HashSet<CrownBuilding> _skinnedBuildings = new HashSet<CrownBuilding>();
        private readonly HashSet<CrownUnit> _skinnedUnits = new HashSet<CrownUnit>();

        private Transform _titan;
        private Material _blueEnergy;
        private Material _redEnergy;
        private Material _whiteEnergy;
        private bool _applied;
        private float _nextScan;

        private void Start() => ApplyNow();

        private void Update()
        {
            if (!_applied || Time.unscaledTime < _nextScan) return;
            _nextScan = Time.unscaledTime + 0.2f;
            SkinBuildings();
            SkinUnits();
        }

        public void ApplyNow()
        {
            if (_applied) return;
            GameObject titanObject = GameObject.Find("THE CROWN ENGINE // PRESENTATION ROOT");
            if (titanObject == null) return;

            _titan = titanObject.transform;
            LoadRequiredModels();
            CreateAccentMaterials();
            DisablePreviousPresentation();
            BuildAssetTitan();
            SkinBuildings();
            SkinUnits();
            ConfigureCameraAndLighting();
            _applied = true;
            Debug.Log($"CROWN//FRONT asset Art Reboot applied with {_prefabs.Count} real CC0 model resources.");
        }

        private void LoadRequiredModels()
        {
            string[] paths =
            {
                "CrownArt/SpaceKit/astronautA",
                "CrownArt/SpaceKit/astronautB",
                "CrownArt/SpaceKit/turret_double",
                "CrownArt/SpaceKit/turret_single",
                "CrownArt/SpaceKit/weapon_gun",
                "CrownArt/SpaceKit/weapon_rifle",
                "CrownArt/SpaceKit/machine_generator",
                "CrownArt/SpaceKit/machine_generatorLarge",
                "CrownArt/SpaceKit/machine_wireless",
                "CrownArt/SpaceKit/machine_wirelessCable",
                "CrownArt/SpaceKit/platform_center",
                "CrownArt/SpaceKit/platform_large",
                "CrownArt/SpaceKit/platform_long",
                "CrownArt/SpaceKit/platform_side",
                "CrownArt/SpaceKit/platform_cornerRound",
                "CrownArt/SpaceKit/corridor_wall",
                "CrownArt/SpaceKit/corridor_wallCorner",
                "CrownArt/SpaceKit/pipe_straight",
                "CrownArt/SpaceKit/pipe_cornerRoundLarge",
                "CrownArt/SpaceKit/pipe_ringHigh",
                "CrownArt/SpaceKit/satelliteDish_detailed",
                "CrownArt/FactoryKit/machine",
                "CrownArt/FactoryKit/machine-fortified",
                "CrownArt/FactoryKit/machine-bed",
                "CrownArt/FactoryKit/robot-arm-a",
                "CrownArt/FactoryKit/robot-arm-b",
                "CrownArt/FactoryKit/pipe-large",
                "CrownArt/FactoryKit/pipe-large-bend",
                "CrownArt/FactoryKit/pipe-large-junction",
                "CrownArt/FactoryKit/screen-panel-wide",
                "CrownArt/FactoryKit/screen-panel-small",
                "CrownArt/FactoryKit/structure-wall"
            };

            for (int i = 0; i < paths.Length; i++)
            {
                GameObject prefab = Resources.Load<GameObject>(paths[i]);
                if (prefab == null)
                {
                    throw new InvalidOperationException($"Required Art Reboot model was not imported: Resources/{paths[i]}");
                }
                _prefabs[paths[i]] = prefab;
            }
        }

        private void CreateAccentMaterials()
        {
            Shader shader = Shader.Find("CrownFront/EngineSurface") ??
                            Shader.Find("Universal Render Pipeline/Lit") ??
                            Shader.Find("Standard") ??
                            Shader.Find("Unlit/Color");
            if (shader == null) throw new InvalidOperationException("No WebGL-safe shader for Art Reboot accents.");

            _blueEnergy = CreateMaterial(shader, "Asset Art // Blue Energy", new Color(0.02f, 0.72f, 1f), new Color(0f, 2.8f, 5.2f));
            _redEnergy = CreateMaterial(shader, "Asset Art // Red Energy", new Color(1f, 0.12f, 0.01f), new Color(5.2f, 0.2f, 0f));
            _whiteEnergy = CreateMaterial(shader, "Asset Art // White Energy", new Color(0.82f, 0.94f, 1f), new Color(2.8f, 3.3f, 4f));
        }

        private static Material CreateMaterial(Shader shader, string name, Color baseColor, Color emission)
        {
            Material material = new Material(shader) { name = name, enableInstancing = true };
            if (material.HasProperty("_Color")) material.SetColor("_Color", baseColor);
            if (material.HasProperty("_BaseColor")) material.SetColor("_BaseColor", baseColor);
            if (material.HasProperty("_Metallic")) material.SetFloat("_Metallic", 0.1f);
            if (material.HasProperty("_Glossiness")) material.SetFloat("_Glossiness", 0.85f);
            if (material.HasProperty("_Smoothness")) material.SetFloat("_Smoothness", 0.85f);
            material.EnableKeyword("_EMISSION");
            if (material.HasProperty("_EmissionColor")) material.SetColor("_EmissionColor", emission);
            return material;
        }

        private void DisablePreviousPresentation()
        {
            Renderer[] renderers = _titan.GetComponentsInChildren<Renderer>(true);
            for (int i = 0; i < renderers.Length; i++) renderers[i].enabled = false;

            CrownArtRebootHeroFrame i1 = GetComponent<CrownArtRebootHeroFrame>();
            if (i1 != null) i1.enabled = false;
            CrownArtRebootIteration2 i2 = GetComponent<CrownArtRebootIteration2>();
            if (i2 != null) i2.enabled = false;
        }

        private void BuildAssetTitan()
        {
            Transform root = Group("ASSET ART REBOOT // TITAN", _titan);
            BuildTorso(root);
            BuildAnatomicalRoutes(root);
            BuildHeadAndCrown(root);
            BuildMachinery(root);
        }

        private void BuildTorso(Transform parent)
        {
            Transform torso = Group("Mechanical King Torso", parent);
            Model("CrownArt/FactoryKit/machine-fortified", torso, "Central Reactor Hull", new Vector3(0f, -1.45f, 1.0f), new Vector3(7.6f, 2.5f, 11.8f));
            Model("CrownArt/FactoryKit/structure-wall", torso, "Left Torso Wall", new Vector3(-7.3f, -0.2f, 1.1f), new Vector3(4.6f, 3.2f, 11.6f), new Vector3(0f, 90f, 0f));
            Model("CrownArt/FactoryKit/structure-wall", torso, "Right Torso Wall", new Vector3(7.3f, -0.2f, 1.1f), new Vector3(4.6f, 3.2f, 11.6f), new Vector3(0f, -90f, 0f));
            Model("CrownArt/FactoryKit/machine-bed", torso, "Upper Shoulder Bed", new Vector3(0f, 0.35f, 8.2f), new Vector3(7.8f, 2.1f, 3.8f));
            Model("CrownArt/FactoryKit/machine-bed", torso, "Lower Chest Bed", new Vector3(0f, 0.35f, -6.8f), new Vector3(7.8f, 2.1f, 3.8f), new Vector3(0f, 180f, 0f));

            Model("CrownArt/FactoryKit/robot-arm-a", torso, "Left Titan Arm", new Vector3(-10.4f, -0.6f, 1.3f), new Vector3(4.8f, 4.8f, 4.8f), new Vector3(0f, 0f, -18f));
            Model("CrownArt/FactoryKit/robot-arm-b", torso, "Right Titan Arm", new Vector3(10.4f, -0.6f, 1.3f), new Vector3(4.8f, 4.8f, 4.8f), new Vector3(0f, 180f, 18f));
        }

        private void BuildAnatomicalRoutes(Transform parent)
        {
            Transform routes = Group("Anatomical Combat Deck", parent);
            BuildRoute(routes, -4.4f, "Shield Arm Route", -1f);
            BuildRoute(routes, 0f, "Crown Spine Route", 0f);
            BuildRoute(routes, 4.4f, "Blade Arm Route", 1f);

            Model("CrownArt/SpaceKit/platform_long", routes, "Cross Body Junction", new Vector3(0f, 2.23f, 0.6f), new Vector3(4.8f, 1.25f, 2.1f), new Vector3(0f, 90f, 0f));
            Model("CrownArt/SpaceKit/platform_center", routes, "Crown Junction", new Vector3(0f, 2.48f, 0.6f), new Vector3(2.8f, 1.4f, 2.8f));
            Accent(routes, "Junction Energy", new Vector3(0f, 2.87f, 0.6f), new Vector3(1.05f, 0.10f, 1.05f), _whiteEnergy);
        }

        private void BuildRoute(Transform parent, float x, string name, float side)
        {
            Transform route = Group(name, parent);
            for (int z = -8; z <= 10; z += 3)
            {
                string model = z % 6 == 0 ? "CrownArt/SpaceKit/platform_large" : "CrownArt/SpaceKit/platform_center";
                Model(model, route, "Route Platform", new Vector3(x, 2.15f, z), new Vector3(2.25f, 1.28f, 2.25f), new Vector3(0f, side * (z % 2 == 0 ? 3f : -3f), 0f));
                if (side != 0f)
                {
                    Model("CrownArt/SpaceKit/platform_side", route, "Outer Armor Edge", new Vector3(x + side * 1.72f, 2.14f, z), new Vector3(1.1f, 1.22f, 2.0f), new Vector3(0f, side < 0f ? 0f : 180f, 0f));
                }
            }

            Material energy = side < 0f ? _blueEnergy : side > 0f ? _redEnergy : _whiteEnergy;
            for (int z = -8; z <= 10; z += 2)
            {
                Accent(route, "Embedded Route Light", new Vector3(x, 2.67f, z), new Vector3(0.10f, 0.06f, 0.78f), energy);
            }
        }

        private void BuildHeadAndCrown(Transform parent)
        {
            Transform head = Group("Mechanical King Head", parent);
            Model("CrownArt/FactoryKit/machine-fortified", head, "Cranium", new Vector3(0f, 3.7f, 14.1f), new Vector3(4.5f, 4.0f, 3.6f), new Vector3(0f, 180f, 0f));
            Model("CrownArt/SpaceKit/corridor_wallCorner", head, "Face Left", new Vector3(-2.1f, 3.2f, 12.8f), new Vector3(2.5f, 2.4f, 2.5f), new Vector3(0f, 180f, 0f));
            Model("CrownArt/SpaceKit/corridor_wallCorner", head, "Face Right", new Vector3(2.1f, 3.2f, 12.8f), new Vector3(2.5f, 2.4f, 2.5f), new Vector3(0f, 90f, 0f));
            Accent(head, "Left Eye", new Vector3(-1.35f, 4.4f, 11.8f), new Vector3(0.88f, 0.12f, 0.09f), _redEnergy);
            Accent(head, "Right Eye", new Vector3(1.35f, 4.4f, 11.8f), new Vector3(0.88f, 0.12f, 0.09f), _redEnergy);

            Model("CrownArt/SpaceKit/satelliteDish_detailed", head, "Central Crown Prong", new Vector3(0f, 8.2f, 14.3f), new Vector3(3.0f, 3.8f, 3.0f), new Vector3(-20f, 0f, 0f));
            Model("CrownArt/FactoryKit/robot-arm-a", head, "Left Crown Prong", new Vector3(-2.4f, 7.7f, 14.0f), new Vector3(1.7f, 2.2f, 1.7f), new Vector3(-15f, 0f, -18f));
            Model("CrownArt/FactoryKit/robot-arm-b", head, "Right Crown Prong", new Vector3(2.4f, 7.7f, 14.0f), new Vector3(1.7f, 2.2f, 1.7f), new Vector3(-15f, 180f, 18f));
        }

        private void BuildMachinery(Transform parent)
        {
            Transform mechanics = Group("Visible Titan Machinery", parent);
            for (int side = -1; side <= 1; side += 2)
            {
                Model("CrownArt/FactoryKit/pipe-large", mechanics, "Long Coolant Pipe", new Vector3(side * 7.0f, 0.65f, 1f), new Vector3(2.0f, 5.5f, 2.0f), new Vector3(90f, 0f, 0f));
                Model("CrownArt/FactoryKit/pipe-large-bend", mechanics, "Upper Pipe Bend", new Vector3(side * 7.0f, 0.7f, 8.4f), new Vector3(2.0f, 2.0f, 2.0f), new Vector3(0f, side < 0 ? 0f : 180f, 0f));
                Model("CrownArt/SpaceKit/machine_wirelessCable", mechanics, "Energy Cable", new Vector3(side * 6.2f, 1.0f, -5.3f), new Vector3(2.0f, 2.0f, 2.0f), new Vector3(0f, side < 0 ? 0f : 180f, 0f));
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
            Material energy = blue ? _blueEnergy : _redEnergy;
            Transform root = Group("ASSET ART // CORE", building.transform);

            Model("CrownArt/SpaceKit/machine_generatorLarge", root, "Generator Chamber", new Vector3(0f, 0.25f, 0f), new Vector3(2.6f, 2.6f, 2.6f), new Vector3(0f, blue ? 0f : 180f, 0f));
            Transform dish = Model("CrownArt/SpaceKit/satelliteDish_detailed", root, "Crown Aperture", new Vector3(0f, 1.8f, 0f), new Vector3(1.65f, 1.65f, 1.65f), new Vector3(-90f, 0f, 0f)).transform;
            Model("CrownArt/SpaceKit/pipe_ringHigh", root, "Outer Reactor Ring", new Vector3(0f, 1.2f, 0f), new Vector3(2.2f, 2.2f, 2.2f), new Vector3(0f, 0f, 90f));
            Accent(root, "Core Lens", new Vector3(0f, 1.65f, 0f), new Vector3(0.72f, 1.05f, 0.72f), energy);
            Accent(root, "White Center", new Vector3(0f, 1.75f, 0f), new Vector3(0.28f, 0.62f, 0.28f), _whiteEnergy);

            for (int i = 0; i < 3; i++)
            {
                float angle = i * 120f;
                float radians = angle * Mathf.Deg2Rad;
                Vector3 position = new Vector3(Mathf.Sin(radians) * 2.05f, 0.62f, Mathf.Cos(radians) * 2.05f);
                Model("CrownArt/SpaceKit/machine_generator", root, "Reactor Stabilizer", position, new Vector3(0.95f, 1.25f, 0.95f), new Vector3(0f, angle, 0f));
                Accent(root, "Stabilizer Energy", position + Vector3.up * 0.65f, new Vector3(0.18f, 0.55f, 0.18f), energy);
            }

            CrownAssetCoreMotion motion = root.gameObject.AddComponent<CrownAssetCoreMotion>();
            motion.Configure(building, dish);
        }

        private void BuildTower(CrownBuilding building)
        {
            bool blue = building.Team == CrownTeam.Blue;
            Material energy = blue ? _blueEnergy : _redEnergy;
            Transform root = Group("ASSET ART // TOWER", building.transform);
            Model("CrownArt/SpaceKit/platform_center", root, "Integrated Tower Socket", Vector3.zero, new Vector3(1.8f, 1.0f, 1.8f));
            Transform turret = Model("CrownArt/SpaceKit/turret_double", root, "Double Rail Turret", new Vector3(0f, 0.6f, 0f), new Vector3(1.55f, 1.55f, 1.55f), new Vector3(0f, blue ? 0f : 180f, 0f)).transform;
            Accent(turret, "Team Aperture", new Vector3(0f, 0.38f, blue ? 0.72f : -0.72f), new Vector3(0.38f, 0.16f, 0.14f), energy);
            CrownAssetTowerMotion motion = root.gameObject.AddComponent<CrownAssetTowerMotion>();
            motion.Configure(building, turret, blue ? 1f : -1f);
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
            Transform root = Group("ASSET ART // UNIT", unit.transform);
            string astronaut = unit.Kind == CrownUnitKind.Raider ? "CrownArt/SpaceKit/astronautB" : "CrownArt/SpaceKit/astronautA";
            float scale = unit.Kind == CrownUnitKind.Tank ? 1.85f : unit.Kind == CrownUnitKind.Raider ? 1.36f : 1.48f;
            Transform body = Model(astronaut, root, "Faction Operative", Vector3.zero, Vector3.one * scale, new Vector3(0f, blue ? 0f : 180f, 0f)).transform;

            string weaponPath = unit.Kind == CrownUnitKind.Tank ? "CrownArt/SpaceKit/weapon_gun" : "CrownArt/SpaceKit/weapon_rifle";
            Transform weapon = Model(weaponPath, body, "Class Weapon", new Vector3(0.46f, 0.90f, 0.55f), Vector3.one * (unit.Kind == CrownUnitKind.Tank ? 1.0f : 0.82f), new Vector3(0f, 0f, -8f)).transform;
            Accent(body, "Faction Visor", new Vector3(0f, 1.56f, 0.36f), new Vector3(0.42f, 0.12f, 0.08f), energy);

            if (unit.Kind == CrownUnitKind.Tank)
            {
                Model("CrownArt/FactoryKit/machine", body, "Heavy Backpack", new Vector3(0f, 0.88f, -0.48f), new Vector3(0.62f, 0.72f, 0.62f), new Vector3(0f, 180f, 0f));
            }
            else if (unit.Kind == CrownUnitKind.Raider)
            {
                Accent(body, "Left Booster", new Vector3(-0.30f, 0.78f, -0.42f), new Vector3(0.13f, 0.52f, 0.13f), energy);
                Accent(body, "Right Booster", new Vector3(0.30f, 0.78f, -0.42f), new Vector3(0.13f, 0.52f, 0.13f), energy);
            }

            CrownAssetUnitMotion motion = root.gameObject.AddComponent<CrownAssetUnitMotion>();
            motion.Configure(unit, body, weapon);
        }

        private void ConfigureCameraAndLighting()
        {
            Camera camera = Camera.main;
            if (camera != null)
            {
                CrownAuthoredHeroCamera first = camera.GetComponent<CrownAuthoredHeroCamera>();
                if (first != null) first.enabled = false;
                CrownIteration2Camera second = camera.GetComponent<CrownIteration2Camera>();
                if (second != null) second.enabled = false;
                camera.fieldOfView = 31f;
                CrownAssetHeroCamera rig = camera.GetComponent<CrownAssetHeroCamera>();
                if (rig == null) rig = camera.gameObject.AddComponent<CrownAssetHeroCamera>();
                rig.Configure(new Vector3(0f, 29.4f, -30.8f), new Vector3(0f, 2.15f, 1.4f));
            }

            RenderSettings.ambientSkyColor = new Color(0.30f, 0.38f, 0.50f);
            RenderSettings.ambientEquatorColor = new Color(0.09f, 0.13f, 0.19f);
            RenderSettings.ambientGroundColor = new Color(0.016f, 0.022f, 0.035f);
            Light[] lights = FindObjectsByType<Light>(FindObjectsInactive.Exclude);
            for (int i = 0; i < lights.Length; i++)
            {
                if (lights[i].type == LightType.Directional)
                {
                    lights[i].enabled = true;
                    lights[i].intensity = 1.55f;
                    lights[i].color = new Color(0.76f, 0.86f, 1f);
                    lights[i].transform.rotation = Quaternion.Euler(48f, -38f, -6f);
                }
                else lights[i].enabled = false;
            }
        }

        private Transform Model(string resourcePath, Transform parent, string name, Vector3 position, Vector3 scale, Vector3? euler = null)
        {
            GameObject prefab = _prefabs[resourcePath];
            GameObject instance = Instantiate(prefab, parent, false);
            instance.name = name;
            instance.transform.localPosition = position;
            instance.transform.localScale = scale;
            instance.transform.localEulerAngles = euler ?? Vector3.zero;
            Renderer[] renderers = instance.GetComponentsInChildren<Renderer>(true);
            for (int i = 0; i < renderers.Length; i++)
            {
                renderers[i].enabled = true;
                renderers[i].shadowCastingMode = ShadowCastingMode.On;
                renderers[i].receiveShadows = true;
            }
            Collider[] colliders = instance.GetComponentsInChildren<Collider>(true);
            for (int i = 0; i < colliders.Length; i++) Destroy(colliders[i]);
            return instance.transform;
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

    public sealed class CrownAssetCoreMotion : MonoBehaviour
    {
        private CrownBuilding _building;
        private Transform _dish;
        public void Configure(CrownBuilding building, Transform dish) { _building = building; _dish = dish; }
        private void LateUpdate()
        {
            if (_building == null || _dish == null) return;
            float damage = Mathf.InverseLerp(3200f, 0f, _building.Health);
            _dish.Rotate(Vector3.up, (15f + damage * 35f) * Time.deltaTime, Space.Self);
        }
    }

    public sealed class CrownAssetTowerMotion : MonoBehaviour
    {
        private CrownBuilding _building;
        private Transform _turret;
        private float _direction;
        public void Configure(CrownBuilding building, Transform turret, float direction) { _building = building; _turret = turret; _direction = direction; }
        private void LateUpdate()
        {
            if (_building == null || _building.IsDead || _turret == null) return;
            _turret.localRotation = Quaternion.Euler(0f, Mathf.Sin(Time.time * 0.62f + _building.Lane) * 16f * _direction, 0f);
        }
    }

    public sealed class CrownAssetUnitMotion : MonoBehaviour
    {
        private CrownUnit _unit;
        private Transform _body;
        private Transform _weapon;
        private Vector3 _last;
        private Vector3 _basePosition;
        private float _seed;
        public void Configure(CrownUnit unit, Transform body, Transform weapon)
        {
            _unit = unit; _body = body; _weapon = weapon; _last = unit.transform.position; _basePosition = body.localPosition;
            _seed = ((int)unit.Team * 19 + (int)unit.Kind * 7 + unit.Lane) * 0.31f;
        }
        private void LateUpdate()
        {
            if (_unit == null || _body == null) return;
            float speed = (_unit.transform.position - _last).magnitude / Mathf.Max(Time.deltaTime, 0.0001f);
            _last = _unit.transform.position;
            float phase = Time.time * Mathf.Lerp(3.8f, 8.5f, Mathf.Clamp01(speed / 4f)) + _seed;
            _body.localPosition = _basePosition + Vector3.up * (Mathf.Sin(phase * 2f) * (0.018f + speed * 0.004f));
            _body.localRotation = Quaternion.Euler(speed > 0.08f ? 7f : Mathf.Sin(phase) * 1.5f, 0f, 0f);
            if (_weapon != null) _weapon.localRotation = Quaternion.Euler(-6f + Mathf.Sin(phase * 2.3f) * 1.8f, 0f, 0f);
        }
    }

    public sealed class CrownAssetHeroCamera : MonoBehaviour
    {
        private Vector3 _position;
        private Vector3 _target;
        private float _start;
        public void Configure(Vector3 position, Vector3 target)
        {
            _position = position; _target = target; _start = Time.time;
            transform.position = position + Vector3.back * 1.1f; transform.LookAt(target);
        }
        private void LateUpdate()
        {
            float settle = 1f - Mathf.Exp(-(Time.time - _start) * 4f);
            Vector3 breath = new Vector3(Mathf.Sin(Time.time * 0.21f) * 0.024f, Mathf.Sin(Time.time * 0.29f) * 0.030f, 0f);
            transform.position = Vector3.Lerp(_position + Vector3.back * 1.1f, _position, settle) + breath;
            transform.LookAt(_target + breath * 0.2f);
        }
    }
}
