using System;
using System.Collections.Generic;
using UnityEngine;

namespace CrownFront.Cloud
{
    public enum CrownTeam { Blue, Red }
    public enum CrownUnitKind { Assault, Tank, Raider }

    public interface ICrownTarget
    {
        CrownTeam Team { get; }
        int Lane { get; }
        bool IsDead { get; }
        Vector3 AimPoint { get; }
        void Damage(float amount, CrownTeam source);
    }

    public sealed class CrownEngineGame : MonoBehaviour
    {
        private const float MatchSeconds = 180f;
        private const float MaxEnergy = 10f;
        private const int MaxUnits = 28;
        private static readonly float[] LaneX = { -4.4f, 0f, 4.4f };

        private readonly List<CrownUnit> _units = new List<CrownUnit>(MaxUnits);
        private readonly List<CrownBuilding> _buildings = new List<CrownBuilding>(8);
        private readonly Dictionary<string, Material> _materials = new Dictionary<string, Material>();
        private readonly Queue<CrownProjectile> _projectilePool = new Queue<CrownProjectile>(64);
        private readonly Queue<CrownImpact> _impactPool = new Queue<CrownImpact>(72);

        private Transform _titan;
        private Transform _poolRoot;
        private CrownBuilding _blueCore;
        private CrownBuilding _redCore;
        private CrownCameraPresentation _cameraPresentation;
        private CrownAudioHooks _audioHooks;
        private CrownUnitKind _selected = CrownUnitKind.Assault;
        private float _energy = 6f;
        private float _aiEnergy = 6f;
        private float _timeLeft = MatchSeconds;
        private float _nextAi;
        private bool _finished;
        private string _result = string.Empty;
        private int _lastDeploymentFrame = -1;

        public bool Finished => _finished;
        public IReadOnlyList<CrownUnit> Units => _units;
        public int SharedMaterialCount => _materials.Count;
        public int RealtimeLightCount => FindObjectsByType<Light>(FindObjectsInactive.Exclude).Length;

        private void Awake()
        {
            Application.targetFrameRate = 60;
            Screen.orientation = ScreenOrientation.Portrait;
            Input.multiTouchEnabled = true;
            CreateMaterials();
            BuildWorld();
            BuildPools();
            BeginMatch();
        }

        private void Update()
        {
            AnimateTitan();
            if (_finished) return;

            float dt = Mathf.Min(Time.deltaTime, 0.05f);
            _timeLeft = Mathf.Max(0f, _timeLeft - dt);
            _energy = Mathf.Min(MaxEnergy, _energy + dt * 0.72f);
            _aiEnergy = Mathf.Min(MaxEnergy, _aiEnergy + dt * 0.72f);

            HandleBattlefieldDeploymentInput();

            if (Time.time >= _nextAi) RunAi();
            if (_timeLeft <= 0f)
            {
                Finish(_blueCore.Health >= _redCore.Health ? CrownTeam.Blue : CrownTeam.Red);
            }

            for (int i = _units.Count - 1; i >= 0; i--)
            {
                if (_units[i] == null) _units.RemoveAt(i);
            }
        }

        private void BeginMatch()
        {
            _timeLeft = MatchSeconds;
            _energy = 6f;
            _aiEnergy = 6f;
            _nextAi = Time.time + 1.4f;
            _finished = false;
            _result = string.Empty;
            Spawn(CrownTeam.Blue, CrownUnitKind.Assault, 1);
            Spawn(CrownTeam.Red, CrownUnitKind.Assault, 1);
        }

        private void RunAi()
        {
            _nextAi = Time.time + UnityEngine.Random.Range(1.0f, 2.0f);
            CrownUnitKind kind = (CrownUnitKind)UnityEngine.Random.Range(0, 3);
            int lane = UnityEngine.Random.Range(0, 3);
            float cost = Cost(kind);
            if (_aiEnergy >= cost && _units.Count < MaxUnits)
            {
                _aiEnergy -= cost;
                Spawn(CrownTeam.Red, kind, lane);
            }
        }

        private void OnGUI()
        {
            float scale = Mathf.Clamp(Screen.width / 1080f, 0.55f, 1.35f);
            Matrix4x4 old = GUI.matrix;
            GUI.matrix = Matrix4x4.TRS(Vector3.zero, Quaternion.identity, new Vector3(scale, scale, 1f));
            float width = Screen.width / scale;
            float height = Screen.height / scale;

            GUI.skin.label.fontSize = 26;
            GUI.skin.label.fontStyle = FontStyle.Bold;
            GUI.skin.button.fontSize = 24;
            GUI.skin.button.fontStyle = FontStyle.Bold;
            GUI.skin.box.fontSize = 24;

            float safeTop = Mathf.Max(18f, Screen.safeArea.yMax < Screen.height ? 48f : 18f);
            GUI.color = new Color(0.012f, 0.025f, 0.042f, 0.88f);
            GUI.Box(new Rect(18, safeTop, width - 36, 112), string.Empty);
            GUI.color = new Color(0.05f, 0.82f, 1f, 0.9f);
            GUI.Box(new Rect(20, safeTop + 108, width * 0.5f - 22, 4), string.Empty);
            GUI.color = new Color(1f, 0.19f, 0.05f, 0.9f);
            GUI.Box(new Rect(width * 0.5f + 2, safeTop + 108, width * 0.5f - 22, 4), string.Empty);
            GUI.color = Color.white;
            GUI.Label(new Rect(42, safeTop + 14, 340, 40), "CROWN//FRONT");
            GUI.skin.label.fontSize = 18;
            GUI.Label(new Rect(44, safeTop + 52, 300, 30), "0.3.0-alpha.3  //  CROWN ENGINE");
            GUI.skin.label.fontSize = 24;
            GUI.Label(new Rect(42, safeTop + 78, 320, 30), $"BLUE CORE  {Mathf.CeilToInt(_blueCore.Health)}");
            GUI.skin.label.fontSize = 31;
            GUI.Label(new Rect(width * 0.5f - 82, safeTop + 38, 164, 44), FormatTime(_timeLeft), CenterStyle());
            GUI.skin.label.fontSize = 24;
            GUI.Label(new Rect(width - 354, safeTop + 18, 320, 38), "HOSTILE CROWN", RightStyle());
            GUI.Label(new Rect(width - 354, safeTop + 78, 320, 30), $"RED CORE  {Mathf.CeilToInt(_redCore.Health)}", RightStyle());

            // Keep the middle of the battlefield completely unobstructed.
            // Select a unit below, then tap/click the desired lane directly on the arena.
            float panelH = 232f;
            float y = height - panelH - 20f;
            GUI.color = new Color(0.012f, 0.025f, 0.042f, 0.91f);
            GUI.Box(new Rect(18, y, width - 36, panelH), string.Empty);
            for (int i = 0; i < 10; i++)
            {
                GUI.color = i < Mathf.FloorToInt(_energy) ? new Color(0.02f, 0.82f, 1f, 1f) : new Color(0.08f, 0.13f, 0.18f, 0.9f);
                GUI.Box(new Rect(42 + i * 31, y + 27, 24, 13), string.Empty);
            }
            GUI.color = Color.white;
            GUI.Label(new Rect(42, y + 48, 350, 36), $"ENERGY  {Mathf.FloorToInt(_energy)}/10");
            GUI.skin.label.fontSize = 20;
            GUI.Label(new Rect(width - 540, y + 31, 500, 36), $"{_selected.ToString().ToUpperInvariant()} SELECTED", RightStyle());
            GUI.Label(new Rect(width - 540, y + 59, 500, 30), "SELECT A UNIT • TAP THE BATTLEFIELD", RightStyle());

            float cardW = (width - 96f) / 3f;
            DrawUnitButton(new Rect(30, y + 96, cardW, 112), CrownUnitKind.Assault, "ASSAULT", 3, "STRIKE");
            DrawUnitButton(new Rect(48 + cardW, y + 96, cardW, 112), CrownUnitKind.Tank, "TANK", 4, "HEAVY");
            DrawUnitButton(new Rect(66 + cardW * 2f, y + 96, cardW, 112), CrownUnitKind.Raider, "RAIDER", 2, "RAPID");

            if (_finished)
            {
                GUI.color = new Color(0f, 0f, 0f, 0.82f);
                GUI.Box(new Rect(width * 0.12f, height * 0.31f, width * 0.76f, 330f), string.Empty);
                GUI.color = Color.white;
                GUI.skin.label.fontSize = 64;
                GUI.Label(new Rect(width * 0.12f, height * 0.35f, width * 0.76f, 90f), _result, CenterStyle());
                GUI.skin.label.fontSize = 28;
                GUI.Label(new Rect(width * 0.12f, height * 0.43f, width * 0.76f, 60f), "THE CROWN ENGINE", CenterStyle());
                if (GUI.Button(new Rect(width * 0.28f, height * 0.49f, width * 0.44f, 82f), "PLAY AGAIN"))
                {
                    UnityEngine.SceneManagement.SceneManager.LoadScene(UnityEngine.SceneManagement.SceneManager.GetActiveScene().buildIndex);
                }
            }

            GUI.matrix = old;
        }

        private void DrawUnitButton(Rect rect, CrownUnitKind kind, string label, int cost, string role)
        {
            Color previous = GUI.color;
            bool available = _energy >= cost;
            if (!available) GUI.color = new Color(0.32f, 0.38f, 0.43f, 0.82f);
            else if (_selected == kind) GUI.color = new Color(0.18f, 0.88f, 1f, 1f);
            else GUI.color = new Color(0.78f, 0.86f, 0.93f, 1f);
            if (GUI.Button(rect, $"{label}\n{role}  •  {cost}⚡"))
            {
                _selected = kind;
                PlayAudio(CrownAudioCue.UiSelect);
            }
            GUI.color = previous;
        }

        private void HandleBattlefieldDeploymentInput()
        {
            if (_finished || _lastDeploymentFrame == Time.frameCount) return;

            Vector2 screenPosition = default;
            bool released = false;

            // Touch may also emulate a mouse release. Prefer the real touch path to avoid duplicates.
            if (Input.touchCount > 0)
            {
                Touch touch = Input.GetTouch(0);
                if (touch.phase == TouchPhase.Ended)
                {
                    screenPosition = touch.position;
                    released = true;
                }
            }
            else if (Input.GetMouseButtonUp(0))
            {
                screenPosition = Input.mousePosition;
                released = true;
            }

            if (!released || Screen.width <= 0 || Screen.height <= 0) return;

            float normalizedY = screenPosition.y / Screen.height;
            if (normalizedY < 0.16f || normalizedY > 0.90f) return;

            int lane = Mathf.Clamp(Mathf.FloorToInt(screenPosition.x / (Screen.width / 3f)), 0, 2);
            _lastDeploymentFrame = Time.frameCount;
            TryPlayerSpawn(lane);
        }

        private void TryPlayerSpawn(int lane)
        {
            if (_finished || _units.Count >= MaxUnits) return;
            float cost = Cost(_selected);
            if (_energy < cost) return;
            _energy -= cost;
            Spawn(CrownTeam.Blue, _selected, lane);
        }

        private static float Cost(CrownUnitKind kind)
        {
            switch (kind)
            {
                case CrownUnitKind.Tank: return 4f;
                case CrownUnitKind.Raider: return 2f;
                default: return 3f;
            }
        }

        private static string FormatTime(float seconds)
        {
            int total = Mathf.CeilToInt(seconds);
            return $"{total / 60:00}:{total % 60:00}";
        }

        private static GUIStyle CenterStyle()
        {
            GUIStyle style = new GUIStyle(GUI.skin.label) { alignment = TextAnchor.MiddleCenter };
            return style;
        }

        private static GUIStyle RightStyle()
        {
            GUIStyle style = new GUIStyle(GUI.skin.label) { alignment = TextAnchor.MiddleRight };
            return style;
        }

        private void CreateMaterials()
        {
            AddMaterial("graphite", new Color(0.035f, 0.052f, 0.07f), 0.78f, 0.46f);
            AddMaterial("dark", new Color(0.009f, 0.016f, 0.028f), 0.62f, 0.35f);
            AddMaterial("metal", new Color(0.16f, 0.21f, 0.27f), 0.9f, 0.66f);
            AddMaterial("armor", new Color(0.24f, 0.29f, 0.34f), 0.82f, 0.53f);
            AddMaterial("blue", new Color(0.015f, 0.18f, 0.55f), 0.58f, 0.62f, new Color(0f, 0.18f, 0.72f));
            AddMaterial("red", new Color(0.43f, 0.015f, 0.012f), 0.62f, 0.58f, new Color(0.8f, 0.015f, 0f));
            AddMaterial("cyan", new Color(0.015f, 0.56f, 0.82f), 0.12f, 0.75f, new Color(0f, 1.35f, 2.8f));
            AddMaterial("orange", new Color(0.96f, 0.13f, 0.005f), 0.14f, 0.72f, new Color(3f, 0.18f, 0f));
            AddMaterial("gold", new Color(0.47f, 0.26f, 0.055f), 0.92f, 0.61f);
            AddMaterial("white", new Color(0.75f, 0.86f, 0.95f), 0.42f, 0.76f, new Color(0.15f, 0.24f, 0.32f));
            AddMaterial("cloud", new Color(0.075f, 0.11f, 0.16f), 0.05f, 0.18f);
        }

        private void AddMaterial(string key, Color color, float metallic, float smoothness, Color? emission = null)
        {
            Shader shader =
                Shader.Find("CrownFront/EngineSurface") ??
                Shader.Find("Standard") ??
                Shader.Find("Universal Render Pipeline/Lit") ??
                Shader.Find("Unlit/Color") ??
                Shader.Find("Legacy Shaders/Diffuse") ??
                Shader.Find("Hidden/Internal-Colored");
            if (shader == null)
            {
                throw new InvalidOperationException("No WebGL-compatible presentation shader is available.");
            }
            Material material = new Material(shader) { name = key };
            material.enableInstancing = true;
            if (material.HasProperty("_Color")) material.SetColor("_Color", color);
            if (material.HasProperty("_BaseColor")) material.SetColor("_BaseColor", color);
            if (material.HasProperty("_Metallic")) material.SetFloat("_Metallic", metallic);
            if (material.HasProperty("_Glossiness")) material.SetFloat("_Glossiness", smoothness);
            if (material.HasProperty("_Smoothness")) material.SetFloat("_Smoothness", smoothness);
            if (emission.HasValue && material.HasProperty("_EmissionColor"))
            {
                material.EnableKeyword("_EMISSION");
                material.SetColor("_EmissionColor", emission.Value);
            }
            if (emission.HasValue && material.HasProperty("_Emission")) material.SetColor("_Emission", emission.Value);
            _materials[key] = material;
        }

        private void BuildWorld()
        {
            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color(0.1f, 0.15f, 0.22f);
            RenderSettings.ambientEquatorColor = new Color(0.025f, 0.04f, 0.07f);
            RenderSettings.ambientGroundColor = new Color(0.006f, 0.01f, 0.02f);
            RenderSettings.fog = true;
            RenderSettings.fogColor = new Color(0.008f, 0.018f, 0.035f);
            RenderSettings.fogDensity = 0.012f;

            _titan = new GameObject("THE CROWN ENGINE // PRESENTATION ROOT").transform;
            BuildCameraAndLight();
            BuildTitan();
            BuildArena();
            BuildDefenses();
        }

        private void BuildCameraAndLight()
        {
            Camera camera = new GameObject("Main Camera").AddComponent<Camera>();
            camera.tag = "MainCamera";
            camera.backgroundColor = new Color(0.003f, 0.008f, 0.018f);
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.fieldOfView = 35.5f;
            camera.nearClipPlane = 0.2f;
            camera.farClipPlane = 90f;
            camera.transform.position = new Vector3(0f, 24.8f, -25.8f);
            camera.transform.LookAt(new Vector3(0f, 1.6f, 1.3f));
            _cameraPresentation = camera.gameObject.AddComponent<CrownCameraPresentation>();
            _cameraPresentation.Configure(camera);

            Light key = new GameObject("Crown Key Light").AddComponent<Light>();
            key.type = LightType.Directional;
            key.intensity = 1.12f;
            key.color = new Color(0.79f, 0.86f, 0.94f);
            key.shadows = LightShadows.Soft;
            key.shadowStrength = 0.62f;
            key.transform.rotation = Quaternion.Euler(52f, -31f, 0f);
            _audioHooks = gameObject.AddComponent<CrownAudioHooks>();
        }

        private void BuildTitan()
        {
            Transform body = Group("[PRESENTATION] COLOSSUS BODY", _titan);
            Primitive(PrimitiveType.Cube, "Armored Sternum", body, new Vector3(0, -0.45f, 1.8f), new Vector3(15.8f, 3.1f, 25.8f), "graphite");
            Primitive(PrimitiveType.Cube, "Lower Keel", body, new Vector3(0, -3.4f, 2.4f), new Vector3(11.8f, 3.4f, 22f), "dark");
            for (int side = -1; side <= 1; side += 2)
            {
                Primitive(PrimitiveType.Cube, "Shoulder Bastion", body, new Vector3(side * 10.6f, -0.15f, 5.1f), new Vector3(5.9f, 4.2f, 9.4f), "graphite").transform.rotation = Quaternion.Euler(0f, side * 7f, side * 9f);
                Primitive(PrimitiveType.Cube, "Articulated Arm", body, new Vector3(side * 12.1f, -4.2f, -2.1f), new Vector3(4.4f, 5.2f, 18.8f), "dark").transform.rotation = Quaternion.Euler(8f, 0f, side * 8f);
                Primitive(PrimitiveType.Cylinder, "Shoulder Joint", body, new Vector3(side * 9.4f, -1.1f, 4.7f), new Vector3(4.2f, 1.6f, 4.2f), "metal").transform.rotation = Quaternion.Euler(0f, 0f, 90f);
                for (int z = -7; z <= 9; z += 4)
                {
                    Primitive(PrimitiveType.Cylinder, "Hydraulic Joint", body, new Vector3(side * 9f, -2.2f, z), new Vector3(0.48f, 2.1f, 0.48f), "armor").transform.rotation = Quaternion.Euler(90f, 0f, 0f);
                }
            }

            Transform head = Group("THE SLEEPING KING", body);
            Primitive(PrimitiveType.Cube, "Crown Skull", head, new Vector3(0f, 6.9f, 16.4f), new Vector3(8.8f, 6.9f, 5.8f), "graphite");
            Primitive(PrimitiveType.Cube, "Face Mask", head, new Vector3(0f, 6.45f, 13.35f), new Vector3(6.5f, 4.5f, 0.5f), "dark");
            Primitive(PrimitiveType.Cube, "Jaw Armor", head, new Vector3(0f, 4.5f, 14f), new Vector3(5.2f, 1.15f, 1.4f), "armor");
            Primitive(PrimitiveType.Cube, "Left Eye Slit", head, new Vector3(-1.65f, 7.2f, 13.02f), new Vector3(1.15f, 0.18f, 0.12f), "orange");
            Primitive(PrimitiveType.Cube, "Right Eye Slit", head, new Vector3(1.65f, 7.2f, 13.02f), new Vector3(1.15f, 0.18f, 0.12f), "orange");
            for (int i = -2; i <= 2; i++)
            {
                float h = i == 0 ? 5.4f : Mathf.Abs(i) == 1 ? 4.35f : 3.2f;
                GameObject spike = Primitive(PrimitiveType.Cube, "Crown Blade", head, new Vector3(i * 1.5f, 11f + h * 0.5f, 16.3f), new Vector3(0.72f, h, 1.05f), i == 0 ? "gold" : "metal");
                spike.transform.rotation = Quaternion.Euler(0f, 0f, -i * 4f);
            }

            Transform depth = Group("[PRESENTATION] REACTOR DEPTH", _titan);
            for (int z = -8; z <= 10; z += 4)
            {
                GameObject rotor = Primitive(PrimitiveType.Cylinder, "Subdeck Rotor", depth, new Vector3(0f, -2.1f, z), new Vector3(3.4f, 0.35f, 3.4f), z % 8 == 0 ? "cyan" : "metal", false);
                rotor.AddComponent<CrownAmbientMotion>().DegreesPerSecond = z % 8 == 0 ? 10f : -14f;
            }
            for (int side = -1; side <= 1; side += 2)
            {
                GameObject conduit = Primitive(PrimitiveType.Cylinder, "Primary Power Spine", depth, new Vector3(side * 7.15f, -1.9f, 1f), new Vector3(0.5f, 10.8f, 0.5f), side < 0 ? "cyan" : "orange", false);
                conduit.transform.rotation = Quaternion.Euler(90f, 0f, 0f);
            }
            for (int i = 0; i < 9; i++)
            {
                float x = (i - 4) * 4.2f;
                float z = 4f + Mathf.Sin(i * 1.7f) * 8f;
                Primitive(PrimitiveType.Sphere, "Atmospheric Cloud", depth, new Vector3(x, -7.4f - (i % 3), z), new Vector3(5.2f, 1.4f, 3.6f), "cloud", false);
            }
        }

        private void BuildArena()
        {
            Transform arena = Group("[PRESENTATION] CROWN DECK", _titan);
            Primitive(PrimitiveType.Cube, "Main Armored Deck", arena, new Vector3(0f, 1.12f, 0.65f), new Vector3(14.2f, 1.15f, 22.8f), "graphite");
            Primitive(PrimitiveType.Cube, "Blue Forward Mass", arena, new Vector3(0f, 1.55f, -7.3f), new Vector3(12.8f, 0.65f, 4.6f), "dark");
            Primitive(PrimitiveType.Cube, "Red Forward Mass", arena, new Vector3(0f, 1.55f, 8.5f), new Vector3(12.8f, 0.65f, 4.6f), "dark");
            for (int lane = 0; lane < 3; lane++)
            {
                float x = LaneX[lane];
                float laneWidth = lane == 1 ? 3.15f : 2.75f;
                Primitive(PrimitiveType.Cube, $"Tactical Conduit {lane}", arena, new Vector3(x, 1.86f, 0.6f), new Vector3(laneWidth, 0.32f, 20.7f), lane == 1 ? "armor" : "metal");
                Primitive(PrimitiveType.Cube, "Embedded Energy Seam", arena, new Vector3(x, 2.055f, 0.6f), new Vector3(0.09f, 0.035f, 20.4f), lane == 1 ? "cyan" : "blue", false);
                for (int z = -8; z <= 10; z += 3)
                {
                    GameObject plate = Primitive(PrimitiveType.Cube, "Beveled Combat Plate", arena, new Vector3(x, 2.08f, z), new Vector3(laneWidth - 0.24f, 0.12f, 1.88f), "graphite");
                    plate.transform.rotation = Quaternion.Euler(0f, ((z + lane) & 1) == 0 ? 1.2f : -1.2f, 0f);
                }
            }

            Transform focus = Group("Central Crown Junction", arena);
            Primitive(PrimitiveType.Cylinder, "Junction Well", focus, new Vector3(0f, 1.87f, 1f), new Vector3(3.8f, 0.22f, 3.8f), "dark");
            Primitive(PrimitiveType.Cylinder, "Junction Ring", focus, new Vector3(0f, 2.12f, 1f), new Vector3(3.15f, 0.11f, 3.15f), "metal").AddComponent<CrownAmbientMotion>().DegreesPerSecond = 4f;
            Primitive(PrimitiveType.Cylinder, "Junction Energy", focus, new Vector3(0f, 2.18f, 1f), new Vector3(1.15f, 0.08f, 1.15f), "white", false).AddComponent<CrownPulse>().Amount = 0.08f;

            for (int i = -4; i <= 4; i++)
            {
                if (i == 0) continue;
                Primitive(PrimitiveType.Cube, "Structural Rib", arena, new Vector3(i * 1.65f, 1.7f, 1.2f), new Vector3(1.05f, 0.34f, 2.65f), "armor").transform.rotation = Quaternion.Euler(0f, i * 1.8f, 0f);
            }
            for (int side = -1; side <= 1; side += 2)
            {
                for (int z = -7; z <= 8; z += 5)
                {
                    Primitive(PrimitiveType.Cube, "Deck Buttress", arena, new Vector3(side * 7.35f, 2.15f, z), new Vector3(1.35f, 1.45f, 2.3f), "graphite").transform.rotation = Quaternion.Euler(0f, side * 10f, side * 7f);
                    Primitive(PrimitiveType.Cylinder, "Cooling Vent", arena, new Vector3(side * 6.9f, 2.65f, z), new Vector3(0.72f, 0.18f, 0.72f), "metal");
                }
            }
        }

        private void BuildDefenses()
        {
            _blueCore = CreateCore(CrownTeam.Blue, new Vector3(0f, 2.25f, -9.1f));
            _redCore = CreateCore(CrownTeam.Red, new Vector3(0f, 2.25f, 10.4f));
            for (int lane = 0; lane < 3; lane++)
            {
                CreateTower(CrownTeam.Blue, lane, new Vector3(LaneX[lane], 2.25f, -6.2f));
                CreateTower(CrownTeam.Red, lane, new Vector3(LaneX[lane], 2.25f, 7.5f));
            }
        }

        private CrownBuilding CreateCore(CrownTeam team, Vector3 position)
        {
            Transform root = new GameObject($"{team} CORE").transform;
            root.SetParent(_titan, false);
            root.position = position;
            Transform visual = Group("[PRESENTATION] Crown Reactor", root);
            string accent = team == CrownTeam.Blue ? "blue" : "red";
            string energyMaterial = team == CrownTeam.Blue ? "cyan" : "orange";
            Primitive(PrimitiveType.Cylinder, "Integrated Foundation", visual, Vector3.zero, new Vector3(3.55f, 0.48f, 3.55f), "dark");
            Primitive(PrimitiveType.Cylinder, "Armored Plinth", visual, new Vector3(0f, 0.42f, 0f), new Vector3(2.85f, 0.62f, 2.85f), "graphite");
            Primitive(PrimitiveType.Cylinder, "Team Conduit", visual, new Vector3(0f, 0.92f, 0f), new Vector3(2.28f, 0.16f, 2.28f), accent);
            Transform energy = Primitive(PrimitiveType.Sphere, "Contained Star", visual, new Vector3(0f, 2.02f, 0f), Vector3.one * 1.18f, energyMaterial, false).transform;
            energy.gameObject.AddComponent<CrownPulse>().Amount = 0.065f;
            Primitive(PrimitiveType.Cylinder, "Vertical Energy Column", visual, new Vector3(0f, 2.08f, 0f), new Vector3(0.34f, 1.9f, 0.34f), "white", false).AddComponent<CrownPulse>().Speed = 3.4f;

            Transform[] rings = new Transform[3];
            for (int i = 0; i < rings.Length; i++)
            {
                Transform ring = BuildSegmentRing(visual, $"Magnetic Crown Ring {i + 1}", new Vector3(0f, 2f, 0f), 1.32f + i * 0.32f, i == 1 ? accent : "metal");
                ring.rotation = Quaternion.Euler(i == 0 ? 68f : i == 1 ? 0f : -68f, i * 37f, 0f);
                rings[i] = ring;
            }

            for (int side = -1; side <= 1; side += 2)
            {
                for (int axis = -1; axis <= 1; axis += 2)
                {
                    Vector3 p = new Vector3(side * 1.85f, 1.35f, axis * 1.35f);
                    GameObject stabilizer = Primitive(PrimitiveType.Cube, "Reactor Stabilizer", visual, p, new Vector3(0.58f, 2.1f, 0.78f), "armor");
                    stabilizer.transform.rotation = Quaternion.Euler(axis * 7f, side * 16f, side * 10f);
                    Primitive(PrimitiveType.Cube, "Stabilizer Energy Slit", visual, p + Vector3.up * 0.08f, new Vector3(0.62f, 0.12f, 0.82f), energyMaterial, false);
                }
            }

            for (int crown = -1; crown <= 1; crown++)
            {
                float height = crown == 0 ? 2.35f : 1.75f;
                GameObject blade = Primitive(PrimitiveType.Cube, "Trident Crown Blade", visual, new Vector3(crown * 0.78f, 3.18f + height * 0.42f, -0.75f), new Vector3(0.28f, height, 0.48f), crown == 0 ? "white" : accent);
                blade.transform.rotation = Quaternion.Euler(-10f, 0f, -crown * 8f);
            }

            CrownBuilding building = root.gameObject.AddComponent<CrownBuilding>();
            CrownBuildingPresentation presentation = root.gameObject.AddComponent<CrownBuildingPresentation>();
            presentation.Configure(true, visual, null, null, null, energy, rings);
            building.Configure(this, team, 3200f, 1, true);
            _buildings.Add(building);
            return building;
        }

        private void CreateTower(CrownTeam team, int lane, Vector3 position)
        {
            Transform root = new GameObject($"{team} Tower {lane}").transform;
            root.SetParent(_titan, false);
            root.position = position;
            Transform visual = Group("[PRESENTATION] Integrated Turret", root);
            string accent = team == CrownTeam.Blue ? "blue" : "red";
            string energyMaterial = team == CrownTeam.Blue ? "cyan" : "orange";
            Primitive(PrimitiveType.Cylinder, "Socket", visual, Vector3.zero, new Vector3(1.75f, 0.36f, 1.75f), "dark");
            Primitive(PrimitiveType.Cylinder, "Armored Pedestal", visual, new Vector3(0f, 0.38f, 0f), new Vector3(1.42f, 0.58f, 1.42f), "graphite");
            Transform turret = Group("Tracking Combat Module", visual);
            turret.localPosition = new Vector3(0f, 0.95f, 0f);
            Primitive(PrimitiveType.Cube, "Sloped Gun Housing", turret, Vector3.zero, new Vector3(1.55f, 0.72f, 1.45f), "armor").transform.rotation = Quaternion.Euler(0f, 45f, 0f);
            Primitive(PrimitiveType.Cylinder, "Energy Collar", turret, new Vector3(0f, 0.08f, 0f), new Vector3(1.05f, 0.16f, 1.05f), accent, false);
            Transform barrel = Primitive(PrimitiveType.Cube, "Rail Cannon", turret, new Vector3(0f, 0.18f, 1.22f), new Vector3(0.42f, 0.42f, 2.35f), "metal").transform;
            Primitive(PrimitiveType.Cube, "Rail Energy Slot", barrel, new Vector3(0f, 0.48f, 0f), new Vector3(0.5f, 0.08f, 0.82f), energyMaterial, false);
            Transform muzzle = Primitive(PrimitiveType.Sphere, "Muzzle Flash", barrel, new Vector3(0f, 0f, 0.58f), Vector3.zero, energyMaterial, false).transform;
            for (int fin = -1; fin <= 1; fin += 2)
            {
                Primitive(PrimitiveType.Cube, "Crown Armor Fin", turret, new Vector3(fin * 0.92f, 0.24f, -0.22f), new Vector3(0.26f, 1.15f, 0.72f), accent).transform.rotation = Quaternion.Euler(0f, 0f, fin * 14f);
            }
            CrownBuilding building = root.gameObject.AddComponent<CrownBuilding>();
            CrownBuildingPresentation presentation = root.gameObject.AddComponent<CrownBuildingPresentation>();
            presentation.Configure(false, visual, turret, barrel, muzzle, turret.Find("Energy Collar"), new Transform[0]);
            building.Configure(this, team, 980f, lane, false);
            _buildings.Add(building);
        }

        private void Spawn(CrownTeam team, CrownUnitKind kind, int lane)
        {
            if (_units.Count >= MaxUnits) return;
            float z = team == CrownTeam.Blue ? -8.1f : 9.4f;
            Transform root = BuildUnitVisual(team, kind);
            root.SetParent(_titan, true);
            root.position = new Vector3(LaneX[Mathf.Clamp(lane, 0, 2)], 2.35f, z);
            root.rotation = Quaternion.Euler(0f, team == CrownTeam.Blue ? 0f : 180f, 0f);
            CrownUnit unit = root.gameObject.AddComponent<CrownUnit>();
            unit.Configure(this, team, kind, lane);
            _units.Add(unit);
            Impact(root.position + Vector3.up * 0.6f, team, kind == CrownUnitKind.Tank ? 1.15f : 0.78f);
            PlayAudio(CrownAudioCue.Deploy);
        }

        private Transform BuildUnitVisual(CrownTeam team, CrownUnitKind kind)
        {
            Transform root = new GameObject($"{team} {kind}").transform;
            Transform visual = Group("[PRESENTATION] Visual Root", root);
            string accent = team == CrownTeam.Blue ? "blue" : "red";
            string energyMaterial = team == CrownTeam.Blue ? "cyan" : "orange";
            float scale = kind == CrownUnitKind.Tank ? 1.42f : kind == CrownUnitKind.Raider ? 0.9f : 1.08f;
            Transform leftLeg = Primitive(PrimitiveType.Cube, "Left Armored Leg", visual, new Vector3(-0.27f, 0.34f, 0f) * scale, new Vector3(0.32f, 0.72f, 0.38f) * scale, "graphite").transform;
            Transform rightLeg = Primitive(PrimitiveType.Cube, "Right Armored Leg", visual, new Vector3(0.27f, 0.34f, 0f) * scale, new Vector3(0.32f, 0.72f, 0.38f) * scale, "graphite").transform;
            Primitive(PrimitiveType.Cube, "Left Heavy Boot", leftLeg, new Vector3(0f, -0.42f, 0.12f), new Vector3(1.05f, 0.34f, 1.42f), "metal");
            Primitive(PrimitiveType.Cube, "Right Heavy Boot", rightLeg, new Vector3(0f, -0.42f, 0.12f), new Vector3(1.05f, 0.34f, 1.42f), "metal");
            Transform torso = Group("Layered Torso", visual);
            torso.localPosition = new Vector3(0f, 1.1f, 0f) * scale;
            Primitive(PrimitiveType.Cube, "Graphite Chest", torso, Vector3.zero, new Vector3(0.82f, 0.86f, 0.58f) * scale, "graphite").transform.rotation = Quaternion.Euler(7f, 0f, 0f);
            Primitive(PrimitiveType.Cube, "Crown Breastplate", torso, new Vector3(0f, 0.02f, 0.34f) * scale, new Vector3(0.52f, 0.45f, 0.1f) * scale, accent);
            Primitive(PrimitiveType.Cube, "Left Shoulder Plate", torso, new Vector3(-0.63f, 0.28f, 0f) * scale, new Vector3(0.48f, 0.35f, 0.7f) * scale, "armor").transform.rotation = Quaternion.Euler(0f, 0f, -16f);
            Primitive(PrimitiveType.Cube, "Right Shoulder Plate", torso, new Vector3(0.63f, 0.28f, 0f) * scale, new Vector3(0.48f, 0.35f, 0.7f) * scale, "armor").transform.rotation = Quaternion.Euler(0f, 0f, 16f);
            Primitive(PrimitiveType.Sphere, "Angular Helmet", torso, new Vector3(0f, 0.82f, 0.03f) * scale, Vector3.one * 0.5f * scale, "metal");
            Primitive(PrimitiveType.Cube, "Team Visor", torso, new Vector3(0f, 0.84f, 0.44f) * scale, new Vector3(0.62f, 0.16f, 0.12f) * scale, energyMaterial, false);
            Transform reactor = Primitive(PrimitiveType.Cylinder, "Magnetic Backpack Reactor", torso, new Vector3(0f, 0.04f, -0.48f) * scale, new Vector3(0.43f, 0.16f, 0.43f) * scale, energyMaterial, false).transform;
            reactor.rotation = Quaternion.Euler(90f, 0f, 0f);
            Transform weapon;

            if (kind == CrownUnitKind.Tank)
            {
                Primitive(PrimitiveType.Cube, "Heavy Frontal Shield", torso, new Vector3(0f, -0.18f, 0.62f) * scale, new Vector3(1.18f, 1.05f, 0.24f) * scale, "armor");
                Primitive(PrimitiveType.Cube, "Shield Energy Cross", torso, new Vector3(0f, -0.18f, 0.76f) * scale, new Vector3(0.13f, 0.7f, 0.05f) * scale, energyMaterial, false);
                weapon = Primitive(PrimitiveType.Cube, "Siege Cannon", torso, new Vector3(0.58f, 0.06f, 0.94f) * scale, new Vector3(0.34f, 0.34f, 1.65f) * scale, "metal").transform;
            }
            else if (kind == CrownUnitKind.Raider)
            {
                Primitive(PrimitiveType.Cylinder, "Left Vector Thruster", torso, new Vector3(-0.47f, -0.12f, -0.52f) * scale, new Vector3(0.21f, 0.52f, 0.21f) * scale, energyMaterial, false).transform.rotation = Quaternion.Euler(90f, 0f, 0f);
                Primitive(PrimitiveType.Cylinder, "Right Vector Thruster", torso, new Vector3(0.47f, -0.12f, -0.52f) * scale, new Vector3(0.21f, 0.52f, 0.21f) * scale, energyMaterial, false).transform.rotation = Quaternion.Euler(90f, 0f, 0f);
                weapon = Primitive(PrimitiveType.Cube, "Monomolecular Crown Blade", torso, new Vector3(0.58f, -0.1f, 0.72f) * scale, new Vector3(0.13f, 0.13f, 1.42f) * scale, energyMaterial, false).transform;
                weapon.rotation = Quaternion.Euler(0f, 18f, -9f);
            }
            else
            {
                weapon = Primitive(PrimitiveType.Cube, "Crown Energy Carbine", torso, new Vector3(0.42f, -0.08f, 0.84f) * scale, new Vector3(0.2f, 0.23f, 1.42f) * scale, "metal").transform;
                Primitive(PrimitiveType.Cube, "Carbine Energy Magazine", weapon, new Vector3(0f, -0.6f, -0.06f), new Vector3(0.72f, 0.48f, 0.34f), energyMaterial, false);
            }

            CrownUnitPresentation presentation = root.gameObject.AddComponent<CrownUnitPresentation>();
            presentation.Configure(kind, visual, torso, weapon, leftLeg, rightLeg, reactor);
            return root;
        }

        private static Transform Group(string name, Transform parent)
        {
            Transform group = new GameObject(name).transform;
            group.SetParent(parent, false);
            return group;
        }

        private Transform BuildSegmentRing(Transform parent, string name, Vector3 position, float radius, string material)
        {
            Transform ring = Group(name, parent);
            ring.localPosition = position;
            const int segments = 10;
            for (int i = 0; i < segments; i++)
            {
                float angle = i * Mathf.PI * 2f / segments;
                Vector3 p = new Vector3(Mathf.Sin(angle) * radius, 0f, Mathf.Cos(angle) * radius);
                GameObject segment = Primitive(PrimitiveType.Cube, "Magnetic Segment", ring, p, new Vector3(0.24f, 0.14f, radius * 0.62f), material, false);
                segment.transform.localRotation = Quaternion.Euler(0f, angle * Mathf.Rad2Deg + 90f, 0f);
            }
            return ring;
        }

        private GameObject Primitive(PrimitiveType type, string name, Transform parent, Vector3 position, Vector3 scale, string material, bool castShadows = true)
        {
            GameObject go = GameObject.CreatePrimitive(type);
            go.name = name;
            go.transform.SetParent(parent, false);
            go.transform.localPosition = position;
            go.transform.localScale = scale;
            Renderer renderer = go.GetComponent<Renderer>();
            if (renderer != null)
            {
                renderer.sharedMaterial = _materials[material];
                renderer.shadowCastingMode = castShadows ? UnityEngine.Rendering.ShadowCastingMode.On : UnityEngine.Rendering.ShadowCastingMode.Off;
                renderer.receiveShadows = castShadows;
            }
            Collider collider = go.GetComponent<Collider>();
            if (collider != null) Destroy(collider);
            return go;
        }

        public ICrownTarget FindTarget(CrownUnit seeker)
        {
            ICrownTarget best = null;
            float bestDistance = float.MaxValue;
            for (int i = 0; i < _units.Count; i++)
            {
                CrownUnit candidate = _units[i];
                if (candidate == null || candidate.IsDead || candidate.Team == seeker.Team || candidate.Lane != seeker.Lane) continue;
                float distance = (candidate.AimPoint - seeker.AimPoint).sqrMagnitude;
                if (distance < bestDistance) { bestDistance = distance; best = candidate; }
            }
            if (best != null && bestDistance <= 64f) return best;

            for (int i = 0; i < _buildings.Count; i++)
            {
                CrownBuilding building = _buildings[i];
                if (building == null || building.IsDead || building.Team == seeker.Team) continue;
                if (!building.IsCore && building.Lane != seeker.Lane) continue;
                float distance = (building.AimPoint - seeker.AimPoint).sqrMagnitude;
                if (distance < bestDistance) { bestDistance = distance; best = building; }
            }
            return best;
        }

        public CrownUnit FindTowerTarget(CrownTeam team, int lane, Vector3 point)
        {
            CrownUnit best = null;
            float bestDistance = 56.25f;
            for (int i = 0; i < _units.Count; i++)
            {
                CrownUnit unit = _units[i];
                if (unit == null || unit.IsDead || unit.Team == team || unit.Lane != lane) continue;
                float distance = (unit.AimPoint - point).sqrMagnitude;
                if (distance < bestDistance) { bestDistance = distance; best = unit; }
            }
            return best;
        }

        public void Fire(Vector3 origin, ICrownTarget target, CrownTeam team, float damage, float speed, float scale)
        {
            CrownProjectile projectile = _projectilePool.Count > 0 ? _projectilePool.Dequeue() : CreateProjectileObject();
            projectile.gameObject.SetActive(true);
            projectile.Configure(this, target, team, damage, speed, origin, scale, _materials[team == CrownTeam.Blue ? "cyan" : "orange"]);
        }

        public void Impact(Vector3 point, CrownTeam team, float size)
        {
            CrownImpact impact = _impactPool.Count > 0 ? _impactPool.Dequeue() : CreateImpactObject();
            impact.gameObject.SetActive(true);
            impact.Configure(this, point, _materials[team == CrownTeam.Blue ? "cyan" : "orange"], size, 0.24f);
            PlayAudio(CrownAudioCue.Impact);
        }

        private void BuildPools()
        {
            _poolRoot = Group("[POOL] MOBILE VFX", transform);
            for (int i = 0; i < 64; i++)
            {
                CrownProjectile projectile = CreateProjectileObject();
                projectile.gameObject.SetActive(false);
                _projectilePool.Enqueue(projectile);
            }
            for (int i = 0; i < 72; i++)
            {
                CrownImpact impact = CreateImpactObject();
                impact.gameObject.SetActive(false);
                _impactPool.Enqueue(impact);
            }
        }

        private CrownProjectile CreateProjectileObject()
        {
            Transform root = Group("Pooled Energy Projectile", _poolRoot);
            Renderer core = Primitive(PrimitiveType.Sphere, "White-hot Core", root, Vector3.zero, Vector3.one, "white", false).GetComponent<Renderer>();
            Renderer trail = Primitive(PrimitiveType.Cube, "Controlled Trail", root, new Vector3(0f, 0f, -0.75f), new Vector3(0.22f, 0.22f, 1.45f), "cyan", false).GetComponent<Renderer>();
            CrownProjectile projectile = root.gameObject.AddComponent<CrownProjectile>();
            projectile.SetRenderers(core, trail);
            return projectile;
        }

        private CrownImpact CreateImpactObject()
        {
            Transform root = Group("Pooled Impact", _poolRoot);
            Renderer flash = Primitive(PrimitiveType.Sphere, "Impact Flash", root, Vector3.zero, Vector3.one, "cyan", false).GetComponent<Renderer>();
            Renderer debris = Primitive(PrimitiveType.Cube, "Armor Spark", root, new Vector3(0.3f, 0.15f, 0f), new Vector3(0.5f, 0.08f, 0.08f), "white", false).GetComponent<Renderer>();
            CrownImpact impact = root.gameObject.AddComponent<CrownImpact>();
            impact.SetRenderers(flash, debris);
            return impact;
        }

        public void ReturnProjectile(CrownProjectile projectile)
        {
            if (projectile == null) return;
            projectile.gameObject.SetActive(false);
            projectile.transform.SetParent(_poolRoot, false);
            _projectilePool.Enqueue(projectile);
        }

        public void ReturnImpact(CrownImpact impact)
        {
            if (impact == null) return;
            impact.gameObject.SetActive(false);
            impact.transform.SetParent(_poolRoot, false);
            _impactPool.Enqueue(impact);
        }

        public void PlayAudio(CrownAudioCue cue)
        {
            if (_audioHooks != null) _audioHooks.Play(cue);
        }

        public void BuildingDestroyed(CrownBuilding building)
        {
            Impact(building.AimPoint, building.Team == CrownTeam.Blue ? CrownTeam.Red : CrownTeam.Blue, building.IsCore ? 3f : 1.7f);
            _cameraPresentation?.Impact(building.IsCore ? 0.2f : 0.08f);
            if (building.IsCore)
            {
                PlayAudio(CrownAudioCue.CoreDestroyed);
                Finish(building.Team == CrownTeam.Blue ? CrownTeam.Red : CrownTeam.Blue);
            }
        }

        private void Finish(CrownTeam winner)
        {
            if (_finished) return;
            _finished = true;
            _result = winner == CrownTeam.Blue ? "VICTORY" : "DEFEAT";
            _cameraPresentation?.Finish();
            PlayAudio(winner == CrownTeam.Blue ? CrownAudioCue.Victory : CrownAudioCue.Defeat);
        }

        private void AnimateTitan()
        {
            if (_titan == null) return;
            float breathe = Mathf.Sin(Time.time * 0.55f) * 0.09f;
            _titan.localPosition = new Vector3(0f, breathe, 0f);
            _titan.localRotation = Quaternion.Euler(Mathf.Sin(Time.time * 0.22f) * 0.35f, Mathf.Sin(Time.time * 0.17f) * 0.25f, 0f);
        }
    }

    public sealed class CrownUnit : MonoBehaviour, ICrownTarget
    {
        private CrownEngineGame _game;
        private ICrownTarget _target;
        private float _health;
        private float _speed;
        private float _damage;
        private float _range;
        private float _attackInterval;
        private float _nextAttack;
        private float _deathAt;
        private CrownUnitPresentation _presentation;

        public CrownTeam Team { get; private set; }
        public CrownUnitKind Kind { get; private set; }
        public int Lane { get; private set; }
        public bool IsDead { get; private set; }
        public Vector3 AimPoint => transform.position + Vector3.up * 0.65f;

        public void Configure(CrownEngineGame game, CrownTeam team, CrownUnitKind kind, int lane)
        {
            _game = game;
            Team = team;
            Kind = kind;
            Lane = lane;
            _presentation = GetComponent<CrownUnitPresentation>();
            if (kind == CrownUnitKind.Tank) { _health = 640f; _speed = 1.55f; _damage = 72f; _range = 4.8f; _attackInterval = 1.55f; }
            else if (kind == CrownUnitKind.Raider) { _health = 190f; _speed = 4.3f; _damage = 42f; _range = 1.45f; _attackInterval = 0.66f; }
            else { _health = 330f; _speed = 2.65f; _damage = 48f; _range = 4.1f; _attackInterval = 0.92f; }
        }

        private void Update()
        {
            if (IsDead)
            {
                float remaining = _deathAt - Time.time;
                if (remaining <= 0f) Destroy(gameObject);
                return;
            }
            if (_game == null || _game.Finished) return;

            if (_target == null || _target.IsDead) _target = _game.FindTarget(this);
            if (_target != null && !_target.IsDead)
            {
                Vector3 delta = _target.AimPoint - AimPoint;
                float distance = delta.magnitude;
                if (distance <= _range) { _presentation?.SetMoving(false); Face(delta); Attack(); return; }
                if (distance < 9f) { Move(delta.normalized); return; }
            }
            Move(Team == CrownTeam.Blue ? Vector3.forward : Vector3.back);
        }

        private void Move(Vector3 direction)
        {
            direction.y = 0f;
            if (direction.sqrMagnitude < 0.001f) return;
            direction.Normalize();
            _presentation?.SetMoving(true);
            transform.position += direction * (_speed * Time.deltaTime);
            Face(direction);
        }

        private void Face(Vector3 direction)
        {
            direction.y = 0f;
            if (direction.sqrMagnitude > 0.001f) transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(direction), Time.deltaTime * 10f);
        }

        private void Attack()
        {
            if (Time.time < _nextAttack || _target == null || _target.IsDead) return;
            _nextAttack = Time.time + _attackInterval;
            _presentation?.PlayAttack();
            if (Kind == CrownUnitKind.Raider)
            {
                _game.PlayAudio(CrownAudioCue.RaiderAttack);
                _target.Damage(_damage, Team);
                _game.Impact(_target.AimPoint, Team, 0.7f);
            }
            else
            {
                _game.PlayAudio(Kind == CrownUnitKind.Tank ? CrownAudioCue.TankShot : CrownAudioCue.AssaultShot);
                _game.Fire(AimPoint + transform.forward * 0.65f, _target, Team, _damage, Kind == CrownUnitKind.Tank ? 11f : 15f, Kind == CrownUnitKind.Tank ? 0.4f : 0.24f);
            }
        }

        public void Damage(float amount, CrownTeam source)
        {
            if (IsDead) return;
            _health -= amount;
            _presentation?.PlayHit();
            if (_health <= 0f)
            {
                IsDead = true;
                _deathAt = Time.time + 0.55f;
                _presentation?.SetMoving(false);
                _presentation?.PlayDeath();
                _game.Impact(AimPoint, source, Kind == CrownUnitKind.Tank ? 1.35f : 0.85f);
            }
        }
    }

    public sealed class CrownBuilding : MonoBehaviour, ICrownTarget
    {
        private CrownEngineGame _game;
        private float _nextAttack;
        private float _maxHealth;
        private CrownBuildingPresentation _presentation;

        public CrownTeam Team { get; private set; }
        public int Lane { get; private set; }
        public bool IsCore { get; private set; }
        public float Health { get; private set; }
        public bool IsDead { get; private set; }
        public Vector3 AimPoint => transform.position + Vector3.up * (IsCore ? 1.3f : 1.5f);

        public void Configure(CrownEngineGame game, CrownTeam team, float health, int lane, bool isCore)
        {
            _game = game;
            Team = team;
            Lane = lane;
            IsCore = isCore;
            Health = _maxHealth = health;
            _presentation = GetComponent<CrownBuildingPresentation>();
        }

        private void Update()
        {
            if (IsDead || IsCore || _game == null || _game.Finished || Time.time < _nextAttack) return;
            CrownUnit target = _game.FindTowerTarget(Team, Lane, transform.position);
            if (target == null) return;
            _presentation?.Track(target.AimPoint);
            _nextAttack = Time.time + 1.2f;
            _presentation?.PlayShot();
            _game.PlayAudio(CrownAudioCue.TowerShot);
            _game.Fire(AimPoint, target, Team, 62f, 17f, 0.31f);
        }

        public void Damage(float amount, CrownTeam source)
        {
            if (IsDead) return;
            Health = Mathf.Max(0f, Health - amount);
            _presentation?.PlayHit(1f - Health / _maxHealth);
            _game.Impact(AimPoint, source, IsCore ? 0.9f : 0.55f);
            if (IsCore) _game.PlayAudio(CrownAudioCue.CoreDamage);
            if (Health <= 0f)
            {
                IsDead = true;
                _presentation?.PlayDestroyed();
                _game.BuildingDestroyed(this);
            }
        }
    }

    public sealed class CrownProjectile : MonoBehaviour
    {
        private CrownEngineGame _game;
        private ICrownTarget _target;
        private CrownTeam _team;
        private float _damage;
        private float _speed;
        private float _dieAt;
        private Vector3 _baseScale;
        private Renderer _core;
        private Renderer _trail;

        public void SetRenderers(Renderer core, Renderer trail)
        {
            _core = core;
            _trail = trail;
        }

        public void Configure(CrownEngineGame game, ICrownTarget target, CrownTeam team, float damage, float speed, Vector3 origin, float scale, Material material)
        {
            _game = game;
            _target = target;
            _team = team;
            _damage = damage;
            _speed = speed;
            _dieAt = Time.time + 3f;
            transform.position = origin;
            transform.localScale = Vector3.one * scale;
            _baseScale = Vector3.one * scale;
            if (_core != null) _core.sharedMaterial = material;
            if (_trail != null) _trail.sharedMaterial = material;
        }

        private void Update()
        {
            if (_target == null || _target.IsDead || Time.time >= _dieAt) { _game.ReturnProjectile(this); return; }
            Vector3 direction = _target.AimPoint - transform.position;
            if (direction.sqrMagnitude > 0.001f) transform.rotation = Quaternion.LookRotation(direction);
            transform.position = Vector3.MoveTowards(transform.position, _target.AimPoint, _speed * Time.deltaTime);
            transform.localScale = _baseScale * (0.9f + Mathf.Sin(Time.time * 18f) * 0.12f);
            if ((transform.position - _target.AimPoint).sqrMagnitude <= 0.06f)
            {
                _target.Damage(_damage, _team);
                _game.Impact(_target.AimPoint, _team, 0.65f);
                _game.ReturnProjectile(this);
            }
        }
    }

    public sealed class CrownSpin : MonoBehaviour
    {
        public float DegreesPerSecond = 30f;
        private void Update() { transform.Rotate(Vector3.up, DegreesPerSecond * Time.deltaTime, Space.Self); }
    }

    public sealed class CrownPulse : MonoBehaviour
    {
        public float Amount = 0.045f;
        public float Speed = 2f;
        private Vector3 _base;
        private void Awake() { _base = transform.localScale; }
        private void Update() { transform.localScale = _base * (1f + Mathf.Sin(Time.time * Speed) * Amount); }
    }

    public sealed class CrownImpact : MonoBehaviour
    {
        private CrownEngineGame _game;
        private float _target;
        private float _duration;
        private float _start;
        private Renderer _flash;
        private Renderer _debris;

        public void SetRenderers(Renderer flash, Renderer debris)
        {
            _flash = flash;
            _debris = debris;
        }

        public void Configure(CrownEngineGame game, Vector3 point, Material material, float target, float duration)
        {
            _game = game;
            transform.position = point;
            transform.rotation = Quaternion.Euler(UnityEngine.Random.Range(-30f, 30f), UnityEngine.Random.Range(0f, 180f), UnityEngine.Random.Range(-30f, 30f));
            transform.localScale = Vector3.one * 0.1f;
            if (_flash != null) _flash.sharedMaterial = material;
            if (_debris != null) _debris.sharedMaterial = material;
            _target = target;
            _duration = duration;
            _start = Time.time;
        }
        private void Update()
        {
            float t = Mathf.Clamp01((Time.time - _start) / Mathf.Max(0.01f, _duration));
            float envelope = Mathf.Sin(t * Mathf.PI);
            transform.localScale = Vector3.one * Mathf.Lerp(0.1f, _target, envelope);
            transform.Rotate(new Vector3(130f, 210f, 75f) * Time.deltaTime, Space.Self);
            if (t >= 1f) _game.ReturnImpact(this);
        }
    }
}
