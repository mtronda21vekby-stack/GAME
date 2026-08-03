using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace CrownFront
{
    public sealed class CrownEngineBootstrap : MonoBehaviour
    {
        private const float MatchDuration = 210f;
        private const float MaxEnergy = 10f;
        private const float EnergyPerSecond = 0.5f;

        private readonly List<CrownEngineUnit> units = new List<CrownEngineUnit>(40);
        private readonly List<CrownEngineBuilding> buildings = new List<CrownEngineBuilding>(12);
        private readonly Queue<CrownEngineProjectile> projectilePool = new Queue<CrownEngineProjectile>(40);

        private readonly float[] laneX = { -4.7f, 0f, 4.7f };

        private CrownEngineBuilding blueCore;
        private CrownEngineBuilding redCore;
        private Camera battleCamera;
        private Transform titanVisual;
        private CrownUnitType selectedUnit = CrownUnitType.Assault;
        private float playerEnergy = 6f;
        private float enemyEnergy = 6f;
        private float timeRemaining = MatchDuration;
        private float nextEnemyDecision;
        private bool guiReady;
        private string resultText = string.Empty;

        private GUIStyle titleStyle;
        private GUIStyle smallStyle;
        private GUIStyle cardStyle;
        private GUIStyle selectedCardStyle;
        private GUIStyle laneStyle;
        private GUIStyle resultStyle;
        private GUIStyle buttonStyle;
        private Texture2D panelTexture;
        private Texture2D cyanTexture;
        private Texture2D orangeTexture;
        private Texture2D darkTexture;

        public Material GraphiteMaterial { get; private set; }
        public Material DarkMetalMaterial { get; private set; }
        public Material BlueArmorMaterial { get; private set; }
        public Material RedArmorMaterial { get; private set; }
        public Material CyanMaterial { get; private set; }
        public Material OrangeMaterial { get; private set; }
        public Material BronzeMaterial { get; private set; }
        public Material WhiteAlloyMaterial { get; private set; }
        public bool MatchEnded { get; private set; }

        private void Awake()
        {
            Application.targetFrameRate = 60;
            QualitySettings.vSyncCount = 0;
            Screen.orientation = ScreenOrientation.Portrait;

            CreatePalette();
            BuildCameraAndLighting();
            BuildTitanArena();
            BuildDefenses();
            PrewarmProjectilePool(24);

            SpawnUnit(CrownTeam.Blue, CrownUnitType.Assault, 1, false);
            SpawnUnit(CrownTeam.Red, CrownUnitType.Assault, 1, false);
            nextEnemyDecision = Time.time + 1.5f;
        }

        private void Update()
        {
            if (titanVisual != null)
            {
                float breath = Mathf.Sin(Time.time * 0.48f) * 0.055f;
                titanVisual.localPosition = new Vector3(0f, breath, 0f);
                titanVisual.localRotation = Quaternion.Euler(0f, Mathf.Sin(Time.time * 0.16f) * 0.22f, Mathf.Sin(Time.time * 0.24f) * 0.12f);
            }

            if (MatchEnded) return;

            timeRemaining = Mathf.Max(0f, timeRemaining - Time.deltaTime);
            playerEnergy = Mathf.Min(MaxEnergy, playerEnergy + EnergyPerSecond * Time.deltaTime);
            enemyEnergy = Mathf.Min(MaxEnergy, enemyEnergy + EnergyPerSecond * Time.deltaTime);

            if (Time.time >= nextEnemyDecision)
            {
                RunEnemyDecision();
            }

            if (timeRemaining <= 0f)
            {
                ResolveTimeout();
            }

            if (Input.GetKeyDown(KeyCode.Alpha1)) selectedUnit = CrownUnitType.Assault;
            if (Input.GetKeyDown(KeyCode.Alpha2)) selectedUnit = CrownUnitType.Tank;
            if (Input.GetKeyDown(KeyCode.Alpha3)) selectedUnit = CrownUnitType.Raider;
            if (Input.GetKeyDown(KeyCode.A)) TryDeploy(0);
            if (Input.GetKeyDown(KeyCode.S)) TryDeploy(1);
            if (Input.GetKeyDown(KeyCode.D)) TryDeploy(2);
        }

        private void CreatePalette()
        {
            GraphiteMaterial = CrownEngineVisuals.CreateMaterial(
                "CF_Graphite",
                new Color(0.045f, 0.055f, 0.07f),
                Color.black,
                0.78f,
                0.47f);

            DarkMetalMaterial = CrownEngineVisuals.CreateMaterial(
                "CF_DarkMetal",
                new Color(0.085f, 0.105f, 0.13f),
                Color.black,
                0.88f,
                0.58f);

            BlueArmorMaterial = CrownEngineVisuals.CreateMaterial(
                "CF_BlueArmor",
                new Color(0.055f, 0.14f, 0.21f),
                new Color(0.005f, 0.06f, 0.12f),
                0.82f,
                0.62f);

            RedArmorMaterial = CrownEngineVisuals.CreateMaterial(
                "CF_RedArmor",
                new Color(0.19f, 0.045f, 0.035f),
                new Color(0.13f, 0.01f, 0f),
                0.82f,
                0.6f);

            CyanMaterial = CrownEngineVisuals.CreateMaterial(
                "CF_CyanEnergy",
                new Color(0.02f, 0.42f, 0.72f),
                new Color(0.02f, 1.2f, 2.2f),
                0.18f,
                0.92f);

            OrangeMaterial = CrownEngineVisuals.CreateMaterial(
                "CF_OrangeEnergy",
                new Color(0.76f, 0.14f, 0.025f),
                new Color(2.1f, 0.28f, 0.015f),
                0.18f,
                0.9f);

            BronzeMaterial = CrownEngineVisuals.CreateMaterial(
                "CF_Bronze",
                new Color(0.34f, 0.19f, 0.07f),
                new Color(0.04f, 0.015f, 0f),
                0.93f,
                0.68f);

            WhiteAlloyMaterial = CrownEngineVisuals.CreateMaterial(
                "CF_WhiteAlloy",
                new Color(0.58f, 0.64f, 0.69f),
                Color.black,
                0.7f,
                0.76f);
        }

        private void BuildCameraAndLighting()
        {
            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = new Color(0.055f, 0.08f, 0.12f);
            RenderSettings.ambientEquatorColor = new Color(0.025f, 0.035f, 0.05f);
            RenderSettings.ambientGroundColor = new Color(0.006f, 0.008f, 0.012f);
            RenderSettings.fog = true;
            RenderSettings.fogColor = new Color(0.022f, 0.03f, 0.045f);
            RenderSettings.fogMode = FogMode.ExponentialSquared;
            RenderSettings.fogDensity = 0.012f;

            GameObject cameraObject = new GameObject("BattleCamera");
            battleCamera = cameraObject.AddComponent<Camera>();
            battleCamera.clearFlags = CameraClearFlags.SolidColor;
            battleCamera.backgroundColor = new Color(0.012f, 0.018f, 0.028f);
            battleCamera.fieldOfView = 38f;
            battleCamera.nearClipPlane = 0.15f;
            battleCamera.farClipPlane = 100f;
            cameraObject.transform.position = new Vector3(0f, 22.2f, -21.4f);
            cameraObject.transform.LookAt(new Vector3(0f, 0.6f, 1.2f));

            GameObject keyLightObject = new GameObject("KeyLight");
            Light keyLight = keyLightObject.AddComponent<Light>();
            keyLight.type = LightType.Directional;
            keyLight.color = new Color(0.72f, 0.82f, 1f);
            keyLight.intensity = 1.15f;
            keyLight.shadows = LightShadows.Soft;
            keyLight.shadowStrength = 0.65f;
            keyLightObject.transform.rotation = Quaternion.Euler(48f, -28f, 0f);

            GameObject fillObject = new GameObject("WarmRim");
            Light fill = fillObject.AddComponent<Light>();
            fill.type = LightType.Directional;
            fill.color = new Color(1f, 0.34f, 0.13f);
            fill.intensity = 0.42f;
            fill.shadows = LightShadows.None;
            fillObject.transform.rotation = Quaternion.Euler(25f, 145f, 0f);
        }

        private void BuildTitanArena()
        {
            titanVisual = new GameObject("THE_CROWN_ENGINE").transform;

            CrownEngineVisuals.Primitive(
                PrimitiveType.Cube,
                titanVisual,
                "ChestSuperstructure",
                new Vector3(0f, -0.85f, 0f),
                new Vector3(15.6f, 1.15f, 28.4f),
                GraphiteMaterial);

            CrownEngineVisuals.Primitive(
                PrimitiveType.Cube,
                titanVisual,
                "ChestInnerMass",
                new Vector3(0f, -1.45f, 1.5f),
                new Vector3(12.8f, 1.5f, 23.8f),
                DarkMetalMaterial);

            for (int lane = 0; lane < 3; lane++)
            {
                float x = laneX[lane];
                CrownEngineVisuals.Primitive(
                    PrimitiveType.Cube,
                    titanVisual,
                    "Lane_" + lane,
                    new Vector3(x, -0.18f, 0f),
                    new Vector3(3.55f, 0.18f, 25.8f),
                    DarkMetalMaterial);

                CrownEngineVisuals.Primitive(
                    PrimitiveType.Cube,
                    titanVisual,
                    "BlueConduit_" + lane,
                    new Vector3(x - 1.55f, 0.02f, -5.8f),
                    new Vector3(0.075f, 0.055f, 11.8f),
                    CyanMaterial);

                CrownEngineVisuals.Primitive(
                    PrimitiveType.Cube,
                    titanVisual,
                    "RedConduit_" + lane,
                    new Vector3(x + 1.55f, 0.02f, 5.8f),
                    new Vector3(0.075f, 0.055f, 11.8f),
                    OrangeMaterial);

                for (int segment = -5; segment <= 5; segment++)
                {
                    float z = segment * 2.15f;
                    CrownEngineVisuals.Primitive(
                        PrimitiveType.Cube,
                        titanVisual,
                        "ArmorPlate",
                        new Vector3(x, -0.03f, z),
                        new Vector3(3.1f, 0.1f, 1.72f),
                        segment % 2 == 0 ? GraphiteMaterial : DarkMetalMaterial,
                        false,
                        new Vector3(0f, segment % 2 == 0 ? 0f : 1.5f, 0f));
                }
            }

            for (int side = -1; side <= 1; side += 2)
            {
                float x = side * 9.4f;
                CrownEngineVisuals.Primitive(
                    PrimitiveType.Sphere,
                    titanVisual,
                    side < 0 ? "LeftShoulder" : "RightShoulder",
                    new Vector3(x, -0.1f, 4.8f),
                    new Vector3(5.6f, 2.4f, 6.6f),
                    GraphiteMaterial);

                CrownEngineVisuals.Primitive(
                    PrimitiveType.Cylinder,
                    titanVisual,
                    "ShoulderReactor",
                    new Vector3(side * 8.3f, 0.8f, 3.8f),
                    new Vector3(1.15f, 0.4f, 1.15f),
                    side < 0 ? CyanMaterial : OrangeMaterial);

                CrownEngineVisuals.Primitive(
                    PrimitiveType.Cylinder,
                    titanVisual,
                    "ArmStructure",
                    new Vector3(side * 11.8f, -2.6f, 0f),
                    new Vector3(2.8f, 7.4f, 2.8f),
                    DarkMetalMaterial,
                    false,
                    new Vector3(13f, 0f, side * 9f));
            }

            Transform headRoot = new GameObject("MechanicalKingHead").transform;
            headRoot.SetParent(titanVisual, false);
            headRoot.localPosition = new Vector3(0f, 4.2f, 16.4f);

            CrownEngineVisuals.Primitive(PrimitiveType.Sphere, headRoot, "Skull", Vector3.zero, new Vector3(5.5f, 5.1f, 4.2f), GraphiteMaterial);
            CrownEngineVisuals.Primitive(PrimitiveType.Cube, headRoot, "FacePlate", new Vector3(0f, -0.15f, -2.2f), new Vector3(4.6f, 4.2f, 0.65f), DarkMetalMaterial, false, new Vector3(5f, 0f, 0f));
            CrownEngineVisuals.Primitive(PrimitiveType.Cube, headRoot, "LeftEye", new Vector3(-1.45f, 0.65f, -2.62f), new Vector3(1.05f, 0.27f, 0.13f), OrangeMaterial, false, new Vector3(0f, 0f, -6f));
            CrownEngineVisuals.Primitive(PrimitiveType.Cube, headRoot, "RightEye", new Vector3(1.45f, 0.65f, -2.62f), new Vector3(1.05f, 0.27f, 0.13f), OrangeMaterial, false, new Vector3(0f, 0f, 6f));
            CrownEngineVisuals.Primitive(PrimitiveType.Cube, headRoot, "Mouth", new Vector3(0f, -1.35f, -2.61f), new Vector3(2.4f, 0.18f, 0.12f), OrangeMaterial);

            CrownEngineVisuals.Primitive(PrimitiveType.Cylinder, headRoot, "CrownBand", new Vector3(0f, 2.7f, 0f), new Vector3(3.8f, 0.32f, 3.8f), BronzeMaterial);
            for (int i = 0; i < 7; i++)
            {
                float angle = Mathf.Lerp(-67f, 67f, i / 6f);
                Vector3 offset = Quaternion.Euler(0f, angle, 0f) * new Vector3(0f, 4.5f, -2.1f);
                CrownEngineVisuals.Primitive(
                    PrimitiveType.Cube,
                    headRoot,
                    "CrownSpike",
                    offset,
                    new Vector3(0.42f, 2.5f + (i == 3 ? 1.2f : 0f), 0.42f),
                    BronzeMaterial,
                    false,
                    new Vector3(0f, angle, i % 2 == 0 ? -4f : 4f));
            }

            for (int z = -10; z <= 10; z += 4)
            {
                CrownEngineVisuals.CreateRing(titanVisual, "ChestMechanism", 1.2f + (Mathf.Abs(z) % 3) * 0.15f, 0.08f, 10, z < 0 ? CyanMaterial : OrangeMaterial, 0.16f).localPosition = new Vector3(0f, 0f, z);
            }
        }

        private void BuildDefenses()
        {
            blueCore = CreateBuilding(CrownTeam.Blue, CrownBuildingType.Core, 1, new Vector3(0f, 0.1f, -11.1f));
            redCore = CreateBuilding(CrownTeam.Red, CrownBuildingType.Core, 1, new Vector3(0f, 0.1f, 11.1f));

            CreateBuilding(CrownTeam.Blue, CrownBuildingType.Tower, 0, new Vector3(laneX[0], 0.1f, -7.5f));
            CreateBuilding(CrownTeam.Blue, CrownBuildingType.Tower, 2, new Vector3(laneX[2], 0.1f, -7.5f));
            CreateBuilding(CrownTeam.Red, CrownBuildingType.Tower, 0, new Vector3(laneX[0], 0.1f, 7.5f));
            CreateBuilding(CrownTeam.Red, CrownBuildingType.Tower, 2, new Vector3(laneX[2], 0.1f, 7.5f));
        }

        private CrownEngineBuilding CreateBuilding(CrownTeam team, CrownBuildingType type, int lane, Vector3 position)
        {
            GameObject go = new GameObject(team + "_" + type + "_" + lane);
            go.transform.SetParent(titanVisual, false);
            go.transform.localPosition = position;
            go.transform.localRotation = team == CrownTeam.Blue ? Quaternion.identity : Quaternion.Euler(0f, 180f, 0f);
            CrownEngineBuilding building = go.AddComponent<CrownEngineBuilding>();
            building.Setup(this, team, type, lane);
            return building;
        }

        public void RegisterUnit(CrownEngineUnit unit)
        {
            if (unit != null && !units.Contains(unit)) units.Add(unit);
        }

        public void UnregisterUnit(CrownEngineUnit unit)
        {
            units.Remove(unit);
        }

        public void RegisterBuilding(CrownEngineBuilding building)
        {
            if (building != null && !buildings.Contains(building)) buildings.Add(building);
        }

        public float GetLaneX(int lane)
        {
            return laneX[Mathf.Clamp(lane, 0, laneX.Length - 1)];
        }

        public CrownEngineEntity FindNearestEnemy(CrownEngineEntity seeker, float range)
        {
            if (seeker == null) return null;

            CrownEngineEntity best = null;
            float bestDistance = range * range;
            CrownEngineUnit seekerUnit = seeker as CrownEngineUnit;

            for (int i = units.Count - 1; i >= 0; i--)
            {
                CrownEngineUnit candidate = units[i];
                if (candidate == null)
                {
                    units.RemoveAt(i);
                    continue;
                }
                if (!candidate.IsAlive || candidate.Team == seeker.Team) continue;

                if (seekerUnit != null && seekerUnit.LaneIndex != candidate.LaneIndex)
                {
                    float crossLaneDistance = Mathf.Abs(seeker.transform.position.x - candidate.transform.position.x);
                    if (crossLaneDistance > 2.6f) continue;
                }

                float distance = (candidate.transform.position - seeker.transform.position).sqrMagnitude;
                if (distance < bestDistance)
                {
                    bestDistance = distance;
                    best = candidate;
                }
            }

            for (int i = buildings.Count - 1; i >= 0; i--)
            {
                CrownEngineBuilding candidate = buildings[i];
                if (candidate == null)
                {
                    buildings.RemoveAt(i);
                    continue;
                }
                if (!candidate.IsAlive || candidate.Team == seeker.Team) continue;

                float distance = (candidate.transform.position - seeker.transform.position).sqrMagnitude;
                if (distance < bestDistance)
                {
                    bestDistance = distance;
                    best = candidate;
                }
            }

            return best;
        }

        public void FireProjectile(Vector3 origin, CrownEngineEntity target, float damage, float speed, Material material)
        {
            CrownEngineProjectile projectile;
            if (projectilePool.Count > 0)
            {
                projectile = projectilePool.Dequeue();
            }
            else
            {
                projectile = CreateProjectile();
            }

            projectile.Launch(this, target, origin, damage, speed, material);
        }

        public void RecycleProjectile(CrownEngineProjectile projectile)
        {
            if (projectile != null && !projectilePool.Contains(projectile))
            {
                projectilePool.Enqueue(projectile);
            }
        }

        private CrownEngineProjectile CreateProjectile()
        {
            GameObject projectileObject = new GameObject("PooledProjectile");
            projectileObject.transform.SetParent(transform, false);
            CrownEngineProjectile projectile = projectileObject.AddComponent<CrownEngineProjectile>();
            projectileObject.SetActive(false);
            return projectile;
        }

        private void PrewarmProjectilePool(int count)
        {
            for (int i = 0; i < count; i++)
            {
                CrownEngineProjectile projectile = CreateProjectile();
                projectilePool.Enqueue(projectile);
            }
        }

        public void CreateImpactPulse(Vector3 position, Material material, float scale)
        {
            GameObject pulse = CrownEngineVisuals.Primitive(
                PrimitiveType.Sphere,
                transform,
                "ImpactPulse",
                position,
                Vector3.one * 0.1f,
                material ?? WhiteAlloyMaterial);
            pulse.transform.SetParent(null, true);
            CrownEnginePulse pulseComponent = pulse.AddComponent<CrownEnginePulse>();
            pulseComponent.Configure(material ?? WhiteAlloyMaterial, scale, 0.26f);
        }

        public void OnBuildingDestroyed(CrownEngineBuilding building)
        {
            if (building == null) return;

            if (building.BuildingType == CrownBuildingType.Core)
            {
                MatchEnded = true;
                resultText = building.Team == CrownTeam.Red ? "VICTORY" : "DEFEAT";
            }
        }

        private void SpawnUnit(CrownTeam team, CrownUnitType type, int lane, bool chargeEnergy)
        {
            float cost = GetCost(type);
            if (chargeEnergy)
            {
                if (team == CrownTeam.Blue)
                {
                    if (playerEnergy + 0.001f < cost) return;
                    playerEnergy -= cost;
                }
                else
                {
                    if (enemyEnergy + 0.001f < cost) return;
                    enemyEnergy -= cost;
                }
            }

            int aliveCount = 0;
            for (int i = 0; i < units.Count; i++)
            {
                if (units[i] != null && units[i].IsAlive) aliveCount++;
            }
            if (aliveCount >= 28) return;

            float z = team == CrownTeam.Blue ? -9.45f : 9.45f;
            Vector3 spawnPosition = new Vector3(GetLaneX(lane) + Random.Range(-0.25f, 0.25f), type == CrownUnitType.Raider ? 0.45f : 0.05f, z);
            GameObject go = new GameObject(team + "_" + type);
            go.transform.SetParent(titanVisual, false);
            go.transform.localPosition = spawnPosition;
            go.transform.localRotation = team == CrownTeam.Blue ? Quaternion.identity : Quaternion.Euler(0f, 180f, 0f);
            CrownEngineUnit unit = go.AddComponent<CrownEngineUnit>();
            unit.Setup(this, team, type, lane);
            CreateImpactPulse(go.transform.position + Vector3.up * 0.6f, team == CrownTeam.Blue ? CyanMaterial : OrangeMaterial, 0.75f);
        }

        private void RunEnemyDecision()
        {
            nextEnemyDecision = Time.time + Random.Range(1.75f, 2.75f);
            CrownUnitType type;

            if (enemyEnergy >= 5f && Random.value > 0.62f)
            {
                type = CrownUnitType.Raider;
            }
            else if (enemyEnergy >= 4f && Random.value > 0.48f)
            {
                type = CrownUnitType.Tank;
            }
            else
            {
                type = CrownUnitType.Assault;
            }

            int lane = ChooseEnemyLane();
            SpawnUnit(CrownTeam.Red, type, lane, true);
        }

        private int ChooseEnemyLane()
        {
            int[] bluePressure = { 0, 0, 0 };
            for (int i = 0; i < units.Count; i++)
            {
                CrownEngineUnit unit = units[i];
                if (unit != null && unit.IsAlive && unit.Team == CrownTeam.Blue)
                {
                    bluePressure[unit.LaneIndex]++;
                }
            }

            int lane = 0;
            if (bluePressure[1] > bluePressure[lane]) lane = 1;
            if (bluePressure[2] > bluePressure[lane]) lane = 2;
            if (Random.value < 0.32f) lane = Random.Range(0, 3);
            return lane;
        }

        private void TryDeploy(int lane)
        {
            if (MatchEnded) return;
            float cost = GetCost(selectedUnit);
            if (playerEnergy + 0.001f < cost) return;
            SpawnUnit(CrownTeam.Blue, selectedUnit, lane, true);
        }

        private static float GetCost(CrownUnitType type)
        {
            switch (type)
            {
                case CrownUnitType.Tank: return 4f;
                case CrownUnitType.Raider: return 5f;
                default: return 3f;
            }
        }

        private void ResolveTimeout()
        {
            MatchEnded = true;
            float blueScore = blueCore != null ? blueCore.Health01 : 0f;
            float redScore = redCore != null ? redCore.Health01 : 0f;
            resultText = blueScore > redScore + 0.01f ? "VICTORY" : redScore > blueScore + 0.01f ? "DEFEAT" : "DRAW";
        }

        private void OnGUI()
        {
            EnsureGui();

            Rect safe = Screen.safeArea;
            float safeTop = Screen.height - safe.yMax;
            float left = safe.x + 14f;
            float top = safeTop + 12f;
            float width = safe.width - 28f;
            float bottom = Screen.height - safe.y + 2f;

            GUI.DrawTexture(new Rect(left, top, width, 70f), panelTexture);
            GUI.Label(new Rect(left + 14f, top + 8f, width * 0.45f, 28f), "CROWN//FRONT", titleStyle);
            GUI.Label(new Rect(left + 14f, top + 35f, width * 0.45f, 22f), "THE CROWN ENGINE", smallStyle);

            string timeText = Mathf.CeilToInt(timeRemaining / 60f).ToString("00") + ":" + Mathf.CeilToInt(timeRemaining % 60f).ToString("00");
            GUI.Label(new Rect(left + width * 0.43f, top + 11f, width * 0.18f, 32f), timeText, titleStyle);

            float redHealth = redCore != null ? redCore.Health01 : 0f;
            float blueHealth = blueCore != null ? blueCore.Health01 : 0f;
            DrawBar(new Rect(left + width * 0.65f, top + 13f, width * 0.31f, 14f), redHealth, orangeTexture, "ENEMY CORE");
            DrawBar(new Rect(left + width * 0.65f, top + 42f, width * 0.31f, 14f), blueHealth, cyanTexture, "YOUR CORE");

            float deckHeight = Mathf.Clamp(safe.height * 0.22f, 150f, 240f);
            float deckTop = bottom - deckHeight;
            GUI.DrawTexture(new Rect(left, deckTop, width, deckHeight - 10f), panelTexture);

            GUI.Label(new Rect(left + 14f, deckTop + 8f, 180f, 22f), "ENERGY " + Mathf.FloorToInt(playerEnergy) + "/10", smallStyle);
            DrawBar(new Rect(left + 14f, deckTop + 32f, width - 28f, 12f), playerEnergy / MaxEnergy, cyanTexture, string.Empty);

            float cardGap = 8f;
            float cardWidth = (width - 28f - cardGap * 2f) / 3f;
            float cardTop = deckTop + 52f;
            float cardHeight = Mathf.Clamp(deckHeight * 0.42f, 58f, 90f);

            DrawUnitCard(new Rect(left + 14f, cardTop, cardWidth, cardHeight), CrownUnitType.Assault, "ASSAULT", 3);
            DrawUnitCard(new Rect(left + 14f + cardWidth + cardGap, cardTop, cardWidth, cardHeight), CrownUnitType.Tank, "TANK", 4);
            DrawUnitCard(new Rect(left + 14f + (cardWidth + cardGap) * 2f, cardTop, cardWidth, cardHeight), CrownUnitType.Raider, "RAIDER", 5);

            float laneTop = cardTop + cardHeight + 8f;
            float laneHeight = Mathf.Max(42f, deckTop + deckHeight - laneTop - 18f);
            string[] laneNames = { "LEFT", "CENTER", "RIGHT" };
            for (int i = 0; i < 3; i++)
            {
                Rect laneRect = new Rect(left + 14f + i * (cardWidth + cardGap), laneTop, cardWidth, laneHeight);
                if (GUI.Button(laneRect, laneNames[i], laneStyle))
                {
                    TryDeploy(i);
                }
            }

            if (MatchEnded)
            {
                float overlayWidth = Mathf.Min(width - 30f, 520f);
                float overlayHeight = 250f;
                float overlayX = left + (width - overlayWidth) * 0.5f;
                float overlayY = top + (safe.height - overlayHeight) * 0.42f;
                GUI.DrawTexture(new Rect(overlayX, overlayY, overlayWidth, overlayHeight), darkTexture);
                GUI.Label(new Rect(overlayX + 10f, overlayY + 30f, overlayWidth - 20f, 70f), resultText, resultStyle);
                GUI.Label(new Rect(overlayX + 20f, overlayY + 105f, overlayWidth - 40f, 35f), "THE KING REMEMBERS THIS BATTLE", smallStyle);

                if (GUI.Button(new Rect(overlayX + 30f, overlayY + 155f, overlayWidth - 60f, 38f), "PLAY AGAIN", buttonStyle))
                {
                    SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
                }
                if (GUI.Button(new Rect(overlayX + 30f, overlayY + 200f, overlayWidth - 60f, 32f), "BACK TO LOBBY", buttonStyle))
                {
                    Application.OpenURL("/");
                }
            }
        }

        private void DrawUnitCard(Rect rect, CrownUnitType type, string label, int cost)
        {
            bool selected = selectedUnit == type;
            bool affordable = playerEnergy + 0.001f >= cost;
            GUI.enabled = affordable || selected;
            if (GUI.Button(rect, label + "\n" + cost + " ENERGY", selected ? selectedCardStyle : cardStyle))
            {
                selectedUnit = type;
            }
            GUI.enabled = true;
        }

        private void DrawBar(Rect rect, float value, Texture2D fill, string label)
        {
            GUI.DrawTexture(rect, darkTexture);
            GUI.DrawTexture(new Rect(rect.x + 2f, rect.y + 2f, Mathf.Max(0f, (rect.width - 4f) * Mathf.Clamp01(value)), rect.height - 4f), fill);
            if (!string.IsNullOrEmpty(label))
            {
                GUI.Label(new Rect(rect.x, rect.y - 14f, rect.width, 14f), label, smallStyle);
            }
        }

        private void EnsureGui()
        {
            if (guiReady) return;
            guiReady = true;

            panelTexture = SolidTexture(new Color(0.015f, 0.025f, 0.04f, 0.93f));
            darkTexture = SolidTexture(new Color(0.005f, 0.009f, 0.015f, 0.96f));
            cyanTexture = SolidTexture(new Color(0.02f, 0.72f, 1f, 0.95f));
            orangeTexture = SolidTexture(new Color(1f, 0.2f, 0.035f, 0.95f));

            titleStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = Mathf.Clamp(Screen.width / 32, 16, 30),
                fontStyle = FontStyle.Bold,
                alignment = TextAnchor.MiddleLeft,
                normal = { textColor = Color.white }
            };

            smallStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = Mathf.Clamp(Screen.width / 52, 10, 18),
                fontStyle = FontStyle.Bold,
                alignment = TextAnchor.MiddleLeft,
                normal = { textColor = new Color(0.68f, 0.82f, 0.9f) }
            };

            cardStyle = new GUIStyle(GUI.skin.button)
            {
                fontSize = Mathf.Clamp(Screen.width / 46, 11, 19),
                fontStyle = FontStyle.Bold,
                alignment = TextAnchor.MiddleCenter,
                wordWrap = true,
                normal = { textColor = Color.white, background = darkTexture },
                hover = { textColor = Color.white, background = panelTexture },
                active = { textColor = Color.white, background = cyanTexture }
            };

            selectedCardStyle = new GUIStyle(cardStyle)
            {
                normal = { textColor = Color.white, background = cyanTexture }
            };

            laneStyle = new GUIStyle(GUI.skin.button)
            {
                fontSize = Mathf.Clamp(Screen.width / 48, 11, 18),
                fontStyle = FontStyle.Bold,
                normal = { textColor = Color.white, background = panelTexture },
                hover = { textColor = Color.white, background = cyanTexture },
                active = { textColor = Color.white, background = cyanTexture }
            };

            resultStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = Mathf.Clamp(Screen.width / 18, 28, 58),
                fontStyle = FontStyle.Bold,
                alignment = TextAnchor.MiddleCenter,
                normal = { textColor = Color.white }
            };

            buttonStyle = new GUIStyle(GUI.skin.button)
            {
                fontSize = Mathf.Clamp(Screen.width / 44, 12, 20),
                fontStyle = FontStyle.Bold,
                normal = { textColor = Color.white, background = panelTexture },
                hover = { textColor = Color.white, background = cyanTexture },
                active = { textColor = Color.white, background = cyanTexture }
            };
        }

        private static Texture2D SolidTexture(Color color)
        {
            Texture2D texture = new Texture2D(1, 1, TextureFormat.RGBA32, false)
            {
                name = "RuntimeSolid",
                wrapMode = TextureWrapMode.Clamp,
                filterMode = FilterMode.Bilinear
            };
            texture.SetPixel(0, 0, color);
            texture.Apply(false, true);
            return texture;
        }
    }
}
