using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Rendering;

namespace CrownFront.Cloud
{
    [DefaultExecutionOrder(2700)]
    public sealed class CrownQuaterniusHybridPolish : MonoBehaviour
    {
        private readonly Dictionary<string, Material> _materials = new Dictionary<string, Material>(12);
        private Mesh _plate;
        private Mesh _blade;
        private Mesh _ring;
        private Transform _titan;
        private bool _applied;

        private void Start() => ApplyNow();

        public void ApplyNow()
        {
            if (_applied) return;

            CrownQuaterniusArtReboot quaternius = GetComponent<CrownQuaterniusArtReboot>();
            if (quaternius == null) return;
            quaternius.ApplyNow();

            GameObject titanObject = GameObject.Find("THE CROWN ENGINE // PRESENTATION ROOT");
            if (titanObject == null) return;
            _titan = titanObject.transform;

            CreateMeshes();
            CreateMaterials();
            RestoreAuthoredKingFoundation();
            RefineQuaterniusDetails();
            RefineBuildings();
            RefineUnits();
            AddHeroLighting();
            ConfigureCamera();
            _applied = true;

            Debug.Log("CROWN//FRONT hybrid Quaternius polish applied: authored king anatomy, real CC0 mechanisms, reduced reactor scale, readable routes and cinematic value separation.");
        }

        private void CreateMeshes()
        {
            _plate = CrownAuthoredMeshFactory.CreateTaperedBox("Hybrid_Plate", 0.76f, 0.82f, 0.84f);
            _blade = CrownAuthoredMeshFactory.CreateBlade("Hybrid_Blade");
            _ring = CrownAuthoredMeshFactory.CreateRing("Hybrid_Ring", 24, 0.78f, 1f, 0.12f);
        }

        private void CreateMaterials()
        {
            Shader shader = Shader.Find("CrownFront/EngineSurface") ??
                            Shader.Find("Universal Render Pipeline/Lit") ??
                            Shader.Find("Standard") ??
                            Shader.Find("Unlit/Color");
            if (shader == null) throw new InvalidOperationException("No WebGL-compatible shader is available for hybrid polish.");

            AddMaterial("abyss", new Color(0.012f, 0.020f, 0.034f), 0.72f, 0.28f);
            AddMaterial("graphite", new Color(0.065f, 0.090f, 0.125f), 0.84f, 0.44f);
            AddMaterial("steel", new Color(0.19f, 0.25f, 0.32f), 0.91f, 0.61f);
            AddMaterial("edge", new Color(0.46f, 0.56f, 0.66f), 0.90f, 0.72f);
            AddMaterial("blueArmor", new Color(0.025f, 0.22f, 0.56f), 0.72f, 0.62f, new Color(0f, 0.09f, 0.34f));
            AddMaterial("redArmor", new Color(0.54f, 0.038f, 0.016f), 0.74f, 0.58f, new Color(0.34f, 0.01f, 0f));
            AddMaterial("blueEnergy", new Color(0.01f, 0.78f, 1f), 0.04f, 0.94f, new Color(0f, 2.7f, 5.4f));
            AddMaterial("redEnergy", new Color(1f, 0.14f, 0.01f), 0.04f, 0.92f, new Color(5.2f, 0.28f, 0f));
            AddMaterial("whiteEnergy", new Color(0.86f, 0.95f, 1f), 0.04f, 0.96f, new Color(2.8f, 3.4f, 4.2f));
            AddMaterial("brass", new Color(0.46f, 0.29f, 0.07f), 0.94f, 0.64f);
        }

        private void AddMaterial(string key, Color color, float metallic, float smoothness, Color? emission = null)
        {
            Shader shader = Shader.Find("CrownFront/EngineSurface") ??
                            Shader.Find("Universal Render Pipeline/Lit") ??
                            Shader.Find("Standard") ??
                            Shader.Find("Unlit/Color");
            if (shader == null) throw new InvalidOperationException("Hybrid polish material shader is unavailable.");

            Material material = new Material(shader)
            {
                name = "HYBRID POLISH // " + key,
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

        private void RestoreAuthoredKingFoundation()
        {
            Transform root = FindDeep(_titan, "ART REBOOT // MECHANICAL KING");
            if (root == null) throw new InvalidOperationException("Authored king foundation is missing from the hybrid review scene.");

            Renderer[] renderers = root.GetComponentsInChildren<Renderer>(true);
            for (int i = 0; i < renderers.Length; i++)
            {
                Renderer renderer = renderers[i];
                string path = BuildPath(renderer.transform, root);
                Material material = ResolveFoundationMaterial(path);
                ApplyMaterial(renderer, material);
                renderer.enabled = true;
                renderer.shadowCastingMode = ShadowCastingMode.On;
                renderer.receiveShadows = true;
            }

            Transform depth = FindDeep(root, "Deep Machine Anatomy");
            if (depth != null) depth.localPosition = new Vector3(0f, 0.45f, 0f);

            Transform head = FindDeep(root, "Mechanical King Head");
            if (head != null)
            {
                head.localPosition = new Vector3(0f, -0.85f, -0.45f);
                head.localScale = new Vector3(0.88f, 0.88f, 0.88f);
            }

            Transform friendlyChest = FindDeep(root, "Friendly Chest Core");
            if (friendlyChest != null) friendlyChest.localScale = Vector3.one * 0.78f;
        }

        private Material ResolveFoundationMaterial(string path)
        {
            if (ContainsAny(path, "Left Eye", "Right Eye")) return _materials["redEnergy"];
            if (ContainsAny(path, "Shield Conduit", "Deep Energy Vessel") && path.IndexOf("Left", StringComparison.OrdinalIgnoreCase) >= 0) return _materials["blueEnergy"];
            if (ContainsAny(path, "Blade Conduit") || (path.IndexOf("Deep Energy Vessel", StringComparison.OrdinalIgnoreCase) >= 0 && path.IndexOf("Right", StringComparison.OrdinalIgnoreCase) >= 0)) return _materials["redEnergy"];
            if (ContainsAny(path, "Spinal Energy Channel", "White", "Chest Lens")) return _materials["whiteEnergy"];
            if (ContainsAny(path, "Crown Prong")) return _materials["brass"];
            if (ContainsAny(path, "Shield Rim", "Blade Fin", "Shoulder Edge", "Hydraulic Bundle")) return _materials["edge"];
            if (path.IndexOf("Shield Arm Route", StringComparison.OrdinalIgnoreCase) >= 0 && ContainsAny(path, "Shield Rib")) return _materials["blueArmor"];
            if (path.IndexOf("Blade Arm Route", StringComparison.OrdinalIgnoreCase) >= 0 && ContainsAny(path, "Blade Plate")) return _materials["redArmor"];
            if (ContainsAny(path, "Deep", "Keel", "Face Shield")) return _materials["abyss"];
            if (ContainsAny(path, "Breastplate", "Vertebra", "Jaw", "Cranium")) return _materials["steel"];
            return _materials["graphite"];
        }

        private void RefineQuaterniusDetails()
        {
            Transform root = FindDeep(_titan, "QUATERNIUS ART REBOOT // MECHANICAL KING");
            if (root == null) throw new InvalidOperationException("Quaternius king detail layer is missing from the hybrid review scene.");

            Renderer[] renderers = root.GetComponentsInChildren<Renderer>(true);
            for (int i = 0; i < renderers.Length; i++)
            {
                string path = BuildPath(renderers[i].transform, root);
                Material material = _materials["graphite"];
                if (ContainsAny(path, "Left Shoulder Fortress")) material = _materials["blueArmor"];
                else if (ContainsAny(path, "Right Shoulder Fortress")) material = _materials["redArmor"];
                else if (ContainsAny(path, "Crown", "Rail Prong")) material = _materials["brass"];
                else if (ContainsAny(path, "Support", "Machinery", "Signal Array")) material = _materials["edge"];
                else if (ContainsAny(path, "Sternum", "Lower Torso", "Face Mask")) material = _materials["abyss"];
                ApplyMaterial(renderers[i], material);
                renderers[i].enabled = true;
            }

            Transform sternum = FindDeep(root, "Central Sternum Hull");
            if (sternum != null) sternum.localScale *= 0.82f;
            Transform bridge = FindDeep(root, "Cross Body Weapon Bridge");
            if (bridge != null) bridge.localScale = new Vector3(0.76f, 0.62f, 0.82f);
            Transform cranium = FindDeep(root, "Crown Cranium");
            if (cranium != null)
            {
                cranium.localScale *= 0.72f;
                cranium.localPosition += new Vector3(0f, -0.75f, -0.35f);
            }

            Transform polish = Group("HYBRID POLISH // TITAN ACCENTS", _titan);
            Part("Left Shoulder Backplate", polish, _plate, new Vector3(-10.7f, 0.7f, 4.8f), new Vector3(4.7f, 3.2f, 11.5f), _materials["graphite"], new Vector3(0f, -7f, -10f));
            Part("Right Shoulder Backplate", polish, _plate, new Vector3(10.7f, 0.7f, 4.8f), new Vector3(4.7f, 3.2f, 11.5f), _materials["graphite"], new Vector3(0f, 7f, 10f));
            Part("Left Crown Silhouette", polish, _blade, new Vector3(-3.4f, 10.4f, 15.6f), new Vector3(1.3f, 5.6f, 1.9f), _materials["edge"], new Vector3(0f, 0f, -12f));
            Part("Center Crown Silhouette", polish, _blade, new Vector3(0f, 11.8f, 15.7f), new Vector3(1.5f, 7.2f, 2.1f), _materials["brass"]);
            Part("Right Crown Silhouette", polish, _blade, new Vector3(3.4f, 10.4f, 15.6f), new Vector3(1.3f, 5.6f, 1.9f), _materials["edge"], new Vector3(0f, 0f, 12f));
        }

        private void RefineBuildings()
        {
            CrownBuilding[] buildings = FindObjectsByType<CrownBuilding>(FindObjectsInactive.Include);
            for (int i = 0; i < buildings.Length; i++)
            {
                CrownBuilding building = buildings[i];
                if (building == null) continue;
                if (building.IsCore) RefineCore(building);
                else RefineTower(building);
            }
        }

        private void RefineCore(CrownBuilding building)
        {
            Transform root = FindDeep(building.transform, "QUATERNIUS ART // CORE");
            if (root == null) return;

            bool blue = building.Team == CrownTeam.Blue;
            Material armor = blue ? _materials["blueArmor"] : _materials["redArmor"];
            Material energy = blue ? _materials["blueEnergy"] : _materials["redEnergy"];

            Transform lens = FindDeep(root, "Living Crown Lens");
            if (lens != null)
            {
                lens.localScale = Vector3.one * 0.48f;
                lens.localPosition = new Vector3(0f, 1.15f, 0f);
            }
            Transform dome = FindDeep(root, "Reactor Containment Dome");
            if (dome != null)
            {
                dome.localScale = new Vector3(0.82f, 0.62f, 0.82f);
                dome.localPosition = new Vector3(0f, 0.35f, 0f);
            }
            Transform baseModel = FindDeep(root, "Embedded Reactor Base");
            if (baseModel != null) baseModel.localScale = new Vector3(0.86f, 0.72f, 0.86f);
            Transform oldCenter = FindDeep(root, "Reactor White Center");
            if (oldCenter != null) oldCenter.gameObject.SetActive(false);

            Transform polish = Group("HYBRID POLISH // CORE", building.transform);
            Part("Outer Magnetic Ring", polish, _ring, new Vector3(0f, 1.20f, 0f), new Vector3(1.78f, 1.78f, 1.78f), armor, new Vector3(62f, 0f, 0f));
            Part("Inner Magnetic Ring", polish, _ring, new Vector3(0f, 1.20f, 0f), new Vector3(1.28f, 1.28f, 1.28f), _materials["edge"], new Vector3(-48f, 0f, 0f));
            Part("Focused Reactor Core", polish, _blade, new Vector3(0f, 1.22f, 0f), new Vector3(0.34f, 0.96f, 0.34f), _materials["whiteEnergy"]);
            for (int index = 0; index < 3; index++)
            {
                float angle = index * 120f;
                float radians = angle * Mathf.Deg2Rad;
                Vector3 position = new Vector3(Mathf.Sin(radians) * 1.92f, 0.68f, Mathf.Cos(radians) * 1.92f);
                Part("Reactor Armor Fin", polish, _blade, position, new Vector3(0.55f, 1.05f, 0.68f), armor, new Vector3(0f, angle, 0f));
                Part("Reactor Fin Energy", polish, _blade, position + Vector3.up * 0.20f, new Vector3(0.12f, 0.55f, 0.16f), energy, new Vector3(0f, angle, 0f));
            }

            CrownHybridCoreMotion motion = polish.gameObject.AddComponent<CrownHybridCoreMotion>();
            motion.Configure(building);
        }

        private void RefineTower(CrownBuilding building)
        {
            Transform root = FindDeep(building.transform, "QUATERNIUS ART // TOWER");
            if (root == null) return;

            bool blue = building.Team == CrownTeam.Blue;
            Material armor = blue ? _materials["blueArmor"] : _materials["redArmor"];
            Material energy = blue ? _materials["blueEnergy"] : _materials["redEnergy"];

            Transform socket = FindDeep(root, "Tower Armored Socket");
            if (socket != null) socket.localScale = new Vector3(0.72f, 0.66f, 0.72f);
            Transform yaw = FindDeep(root, "Tower Yaw Module");
            if (yaw != null)
            {
                yaw.localScale = Vector3.one * 0.80f;
                yaw.localPosition = new Vector3(0f, 0.68f, 0f);
            }

            Transform polish = Group("HYBRID POLISH // TOWER", building.transform);
            Part("Tower Armor Collar", polish, _ring, new Vector3(0f, 0.52f, 0f), new Vector3(1.20f, 1.20f, 1.20f), armor);
            Part("Tower Floor Aperture", polish, _ring, new Vector3(0f, 0.14f, 0f), new Vector3(1.48f, 1.48f, 1.48f), _materials["edge"]);
            Part("Tower Energy Spine", polish, _blade, new Vector3(0f, 0.76f, 0f), new Vector3(0.14f, 0.58f, 0.14f), energy);
        }

        private void RefineUnits()
        {
            CrownUnit[] units = FindObjectsByType<CrownUnit>(FindObjectsInactive.Include);
            for (int i = 0; i < units.Length; i++)
            {
                CrownUnit unit = units[i];
                if (unit == null) continue;
                Transform root = FindDeep(unit.transform, "QUATERNIUS ART // UNIT");
                if (root == null) continue;

                bool blue = unit.Team == CrownTeam.Blue;
                Material energy = blue ? _materials["blueEnergy"] : _materials["redEnergy"];
                Transform body = FindDeep(root, "Faction Combat Drone");
                if (body != null)
                {
                    switch (unit.Kind)
                    {
                        case CrownUnitKind.Tank:
                            body.localScale = new Vector3(0.92f, 0.92f, 0.92f);
                            break;
                        case CrownUnitKind.Raider:
                            body.localScale = Vector3.one * 0.70f;
                            body.localPosition = new Vector3(0f, 0.68f, 0f);
                            break;
                        default:
                            body.localScale = new Vector3(0.86f, 1.38f, 0.90f);
                            break;
                    }
                }

                Transform polish = Group("HYBRID POLISH // UNIT", unit.transform);
                Part("Unit Ground Signature", polish, _ring, new Vector3(0f, 0.08f, 0f), unit.Kind == CrownUnitKind.Tank ? new Vector3(0.84f, 0.84f, 0.84f) : new Vector3(0.58f, 0.58f, 0.58f), energy);
                Part("Unit Vertical Signature", polish, _blade, new Vector3(0f, unit.Kind == CrownUnitKind.Raider ? 0.95f : 1.12f, 0.46f), new Vector3(0.10f, 0.36f, 0.08f), energy);
            }
        }

        private void AddHeroLighting()
        {
            RenderSettings.fog = true;
            RenderSettings.fogColor = new Color(0.014f, 0.024f, 0.043f);
            RenderSettings.fogDensity = 0.0022f;
            RenderSettings.ambientMode = AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color(0.34f, 0.42f, 0.54f);
            RenderSettings.ambientEquatorColor = new Color(0.12f, 0.17f, 0.24f);
            RenderSettings.ambientGroundColor = new Color(0.025f, 0.038f, 0.062f);

            Light[] lights = FindObjectsByType<Light>(FindObjectsInactive.Exclude);
            for (int i = 0; i < lights.Length; i++)
            {
                if (lights[i].type == LightType.Directional)
                {
                    lights[i].enabled = true;
                    lights[i].intensity = 1.32f;
                    lights[i].color = new Color(0.78f, 0.87f, 1f);
                    lights[i].transform.rotation = Quaternion.Euler(46f, -35f, -8f);
                }
            }

            Transform lightRoot = Group("HYBRID POLISH // LIGHTS", _titan);
            CreatePointLight(lightRoot, "Vanguard Rim", new Vector3(-10f, 6.5f, -3f), 7.0f, 31f, new Color(0.08f, 0.42f, 1f));
            CreatePointLight(lightRoot, "Hostile Rim", new Vector3(10f, 7.5f, 7f), 7.4f, 31f, new Color(1f, 0.17f, 0.035f));
            CreatePointLight(lightRoot, "Crown Key", new Vector3(0f, 12f, 3f), 4.8f, 28f, new Color(0.72f, 0.84f, 1f));
        }

        private static void CreatePointLight(Transform parent, string name, Vector3 position, float intensity, float range, Color color)
        {
            GameObject lightObject = new GameObject(name);
            lightObject.transform.SetParent(parent, false);
            lightObject.transform.localPosition = position;
            Light light = lightObject.AddComponent<Light>();
            light.type = LightType.Point;
            light.intensity = intensity;
            light.range = range;
            light.color = color;
            light.shadows = LightShadows.None;
        }

        private void ConfigureCamera()
        {
            Camera camera = Camera.main;
            if (camera == null) return;
            CrownQuaterniusHeroCamera oldRig = camera.GetComponent<CrownQuaterniusHeroCamera>();
            if (oldRig != null) oldRig.enabled = false;
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(0.010f, 0.018f, 0.034f);
            camera.fieldOfView = 33.5f;

            CrownHybridHeroCamera rig = camera.GetComponent<CrownHybridHeroCamera>();
            if (rig == null) rig = camera.gameObject.AddComponent<CrownHybridHeroCamera>();
            rig.Configure(new Vector3(0f, 25.8f, -36.2f), new Vector3(0f, 2.55f, 2.15f));
        }

        private static bool ContainsAny(string value, params string[] candidates)
        {
            for (int i = 0; i < candidates.Length; i++)
            {
                if (value.IndexOf(candidates[i], StringComparison.OrdinalIgnoreCase) >= 0) return true;
            }
            return false;
        }

        private static void ApplyMaterial(Renderer renderer, Material material)
        {
            int count = Mathf.Max(1, renderer.sharedMaterials.Length);
            Material[] materials = new Material[count];
            for (int i = 0; i < count; i++) materials[i] = material;
            renderer.sharedMaterials = materials;
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

        private static Transform FindDeep(Transform root, string name)
        {
            Transform[] transforms = root.GetComponentsInChildren<Transform>(true);
            for (int i = 0; i < transforms.Length; i++)
            {
                if (string.Equals(transforms[i].name, name, StringComparison.Ordinal)) return transforms[i];
            }
            return null;
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
    }

    public sealed class CrownHybridCoreMotion : MonoBehaviour
    {
        private CrownBuilding _building;
        private Transform _outer;
        private Transform _inner;

        public void Configure(CrownBuilding building)
        {
            _building = building;
            _outer = transform.Find("Outer Magnetic Ring");
            _inner = transform.Find("Inner Magnetic Ring");
        }

        private void LateUpdate()
        {
            if (_building == null) return;
            float damage = Mathf.InverseLerp(3200f, 0f, _building.Health);
            if (_outer != null) _outer.Rotate(Vector3.up, (18f + damage * 28f) * Time.deltaTime, UnityEngine.Space.Self);
            if (_inner != null) _inner.Rotate(Vector3.right, (-14f - damage * 24f) * Time.deltaTime, UnityEngine.Space.Self);
        }
    }

    public sealed class CrownHybridHeroCamera : MonoBehaviour
    {
        private Vector3 _position;
        private Vector3 _target;
        private float _start;

        public void Configure(Vector3 position, Vector3 target)
        {
            _position = position;
            _target = target;
            _start = Time.time;
            transform.position = position + Vector3.back * 1.2f;
            transform.LookAt(target);
        }

        private void LateUpdate()
        {
            float settle = 1f - Mathf.Exp(-(Time.time - _start) * 4.0f);
            Vector3 breathing = new Vector3(Mathf.Sin(Time.time * 0.20f) * 0.028f, Mathf.Sin(Time.time * 0.27f) * 0.034f, 0f);
            transform.position = Vector3.Lerp(_position + Vector3.back * 1.2f, _position, settle) + breathing;
            transform.LookAt(_target + breathing * 0.18f);
        }
    }
}
