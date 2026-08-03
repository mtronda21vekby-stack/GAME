using UnityEngine;

namespace CrownFront
{
    public enum CrownUnitType
    {
        Assault,
        Tank,
        Raider
    }

    public sealed class CrownEngineUnit : CrownEngineEntity
    {
        public CrownUnitType UnitType { get; private set; }
        public int LaneIndex { get; private set; }

        private Transform visualRoot;
        private Transform weaponRoot;
        private CrownEngineEntity currentTarget;
        private float moveSpeed;
        private float attackRange;
        private float detectionRange;
        private float damage;
        private float attackInterval;
        private float nextAttackTime;
        private float nextScanTime;
        private float bobSeed;
        private float baselineY;

        public void Setup(CrownEngineBootstrap game, CrownTeam team, CrownUnitType type, int laneIndex)
        {
            UnitType = type;
            LaneIndex = Mathf.Clamp(laneIndex, 0, 2);
            ConfigureStats(type, out float hp);
            BuildVisual(game, team, type);
            InitializeEntity(game, team, hp);
            baselineY = transform.position.y;
            bobSeed = Random.Range(0f, 10f);
            game.RegisterUnit(this);
        }

        private void ConfigureStats(CrownUnitType type, out float hp)
        {
            switch (type)
            {
                case CrownUnitType.Tank:
                    hp = 430f;
                    moveSpeed = 1.25f;
                    attackRange = 3.2f;
                    detectionRange = 5.6f;
                    damage = 44f;
                    attackInterval = 1.35f;
                    break;

                case CrownUnitType.Raider:
                    hp = 125f;
                    moveSpeed = 3.05f;
                    attackRange = 2.5f;
                    detectionRange = 4.4f;
                    damage = 24f;
                    attackInterval = 0.64f;
                    break;

                default:
                    hp = 190f;
                    moveSpeed = 2.05f;
                    attackRange = 3.8f;
                    detectionRange = 5.2f;
                    damage = 31f;
                    attackInterval = 0.88f;
                    break;
            }
        }

        private void BuildVisual(CrownEngineBootstrap game, CrownTeam team, CrownUnitType type)
        {
            visualRoot = new GameObject("Visual").transform;
            visualRoot.SetParent(transform, false);
            Material armor = team == CrownTeam.Blue ? game.BlueArmorMaterial : game.RedArmorMaterial;
            Material energy = team == CrownTeam.Blue ? game.CyanMaterial : game.OrangeMaterial;

            switch (type)
            {
                case CrownUnitType.Tank:
                    BuildTank(armor, energy);
                    break;
                case CrownUnitType.Raider:
                    BuildRaider(armor, energy);
                    break;
                default:
                    BuildAssault(armor, energy);
                    break;
            }
        }

        private void BuildAssault(Material armor, Material energy)
        {
            CrownEngineVisuals.Primitive(PrimitiveType.Capsule, visualRoot, "Exosuit", new Vector3(0f, 0.72f, 0f), new Vector3(0.52f, 0.72f, 0.52f), armor);
            CrownEngineVisuals.Primitive(PrimitiveType.Sphere, visualRoot, "Helmet", new Vector3(0f, 1.62f, 0.04f), new Vector3(0.53f, 0.42f, 0.5f), armor);
            CrownEngineVisuals.Primitive(PrimitiveType.Cube, visualRoot, "Visor", new Vector3(0f, 1.63f, 0.27f), new Vector3(0.35f, 0.12f, 0.08f), energy);
            CrownEngineVisuals.Primitive(PrimitiveType.Cube, visualRoot, "LeftShoulder", new Vector3(-0.48f, 1.18f, 0f), new Vector3(0.38f, 0.22f, 0.48f), armor, false, new Vector3(0f, 0f, -18f));
            CrownEngineVisuals.Primitive(PrimitiveType.Cube, visualRoot, "RightShoulder", new Vector3(0.48f, 1.18f, 0f), new Vector3(0.38f, 0.22f, 0.48f), armor, false, new Vector3(0f, 0f, 18f));
            CrownEngineVisuals.Primitive(PrimitiveType.Cube, visualRoot, "Reactor", new Vector3(0f, 1.1f, -0.28f), new Vector3(0.28f, 0.28f, 0.12f), energy);

            weaponRoot = new GameObject("PulseRifle").transform;
            weaponRoot.SetParent(visualRoot, false);
            weaponRoot.localPosition = new Vector3(0.38f, 1.05f, 0.36f);
            weaponRoot.localEulerAngles = new Vector3(0f, 0f, -8f);
            CrownEngineVisuals.Primitive(PrimitiveType.Cube, weaponRoot, "RifleBody", Vector3.zero, new Vector3(0.18f, 0.18f, 0.78f), armor);
            CrownEngineVisuals.Primitive(PrimitiveType.Cylinder, weaponRoot, "RifleCore", new Vector3(0f, 0f, 0.33f), new Vector3(0.09f, 0.28f, 0.09f), energy, false, new Vector3(90f, 0f, 0f));
        }

        private void BuildTank(Material armor, Material energy)
        {
            CrownEngineVisuals.Primitive(PrimitiveType.Cube, visualRoot, "HeavyHull", new Vector3(0f, 0.54f, 0f), new Vector3(1.28f, 0.52f, 1.6f), armor);
            CrownEngineVisuals.Primitive(PrimitiveType.Cube, visualRoot, "LeftTrack", new Vector3(-0.82f, 0.35f, 0f), new Vector3(0.42f, 0.48f, 1.72f), gameObject.name.Contains("Blue") ? armor : armor);
            CrownEngineVisuals.Primitive(PrimitiveType.Cube, visualRoot, "RightTrack", new Vector3(0.82f, 0.35f, 0f), new Vector3(0.42f, 0.48f, 1.72f), armor);
            CrownEngineVisuals.Primitive(PrimitiveType.Cylinder, visualRoot, "Turret", new Vector3(0f, 1.03f, 0f), new Vector3(0.64f, 0.34f, 0.64f), armor);
            CrownEngineVisuals.Primitive(PrimitiveType.Sphere, visualRoot, "Reactor", new Vector3(0f, 1.12f, -0.22f), new Vector3(0.34f, 0.25f, 0.34f), energy);

            weaponRoot = new GameObject("HeavyCannon").transform;
            weaponRoot.SetParent(visualRoot, false);
            weaponRoot.localPosition = new Vector3(0f, 1.1f, 0.72f);
            CrownEngineVisuals.Primitive(PrimitiveType.Cylinder, weaponRoot, "Cannon", Vector3.zero, new Vector3(0.18f, 0.78f, 0.18f), armor, false, new Vector3(90f, 0f, 0f));
            CrownEngineVisuals.Primitive(PrimitiveType.Sphere, weaponRoot, "Muzzle", new Vector3(0f, 0f, 0.75f), Vector3.one * 0.22f, energy);
        }

        private void BuildRaider(Material armor, Material energy)
        {
            CrownEngineVisuals.Primitive(PrimitiveType.Sphere, visualRoot, "RaiderCore", new Vector3(0f, 1.05f, 0f), new Vector3(0.72f, 0.42f, 0.9f), armor);
            CrownEngineVisuals.Primitive(PrimitiveType.Cube, visualRoot, "WingL", new Vector3(-0.68f, 1.02f, 0f), new Vector3(0.75f, 0.11f, 0.52f), armor, false, new Vector3(0f, 10f, -12f));
            CrownEngineVisuals.Primitive(PrimitiveType.Cube, visualRoot, "WingR", new Vector3(0.68f, 1.02f, 0f), new Vector3(0.75f, 0.11f, 0.52f), armor, false, new Vector3(0f, -10f, 12f));
            CrownEngineVisuals.Primitive(PrimitiveType.Sphere, visualRoot, "Eye", new Vector3(0f, 1.05f, 0.63f), new Vector3(0.28f, 0.17f, 0.12f), energy);
            CrownEngineVisuals.Primitive(PrimitiveType.Cylinder, visualRoot, "ThrusterL", new Vector3(-0.42f, 0.84f, -0.55f), new Vector3(0.18f, 0.32f, 0.18f), energy, false, new Vector3(90f, 0f, 0f));
            CrownEngineVisuals.Primitive(PrimitiveType.Cylinder, visualRoot, "ThrusterR", new Vector3(0.42f, 0.84f, -0.55f), new Vector3(0.18f, 0.32f, 0.18f), energy, false, new Vector3(90f, 0f, 0f));

            weaponRoot = visualRoot;
        }

        private void Update()
        {
            if (Game == null || !IsAlive || Game.MatchEnded) return;

            AnimateVisual();

            if (Time.time >= nextScanTime)
            {
                nextScanTime = Time.time + 0.18f + Random.Range(0f, 0.08f);
                currentTarget = Game.FindNearestEnemy(this, detectionRange);
            }

            if (currentTarget != null && currentTarget.IsAlive)
            {
                Vector3 toTarget = currentTarget.transform.position - transform.position;
                float distance = new Vector2(toTarget.x, toTarget.z).magnitude;
                if (distance <= attackRange)
                {
                    CrownEngineVisuals.FaceDirection(transform, toTarget, 12f);
                    TryAttack();
                    return;
                }
            }

            MoveAlongLane();
        }

        private void MoveAlongLane()
        {
            float direction = Team == CrownTeam.Blue ? 1f : -1f;
            Vector3 destination = new Vector3(Game.GetLaneX(LaneIndex), baselineY, direction > 0f ? 12.2f : -12.2f);
            Vector3 delta = destination - transform.position;
            delta.y = 0f;
            if (delta.sqrMagnitude < 0.04f) return;

            Vector3 velocity = delta.normalized * moveSpeed;
            transform.position += velocity * Time.deltaTime;
            transform.position = new Vector3(
                Mathf.Lerp(transform.position.x, Game.GetLaneX(LaneIndex), Mathf.Clamp01(Time.deltaTime * 2.8f)),
                baselineY,
                transform.position.z);
            CrownEngineVisuals.FaceDirection(transform, velocity, 10f);
        }

        private void TryAttack()
        {
            if (Time.time < nextAttackTime || currentTarget == null || !currentTarget.IsAlive) return;

            nextAttackTime = Time.time + attackInterval;
            Vector3 origin = transform.position + Vector3.up * (UnitType == CrownUnitType.Tank ? 1.3f : 1.15f) + transform.forward * 0.7f;
            float projectileSpeed = UnitType == CrownUnitType.Tank ? 10f : UnitType == CrownUnitType.Raider ? 15f : 13f;
            Material material = Team == CrownTeam.Blue ? Game.CyanMaterial : Game.OrangeMaterial;
            Game.FireProjectile(origin, currentTarget, damage, projectileSpeed, material);

            if (weaponRoot != null)
            {
                weaponRoot.localScale = Vector3.one * 1.12f;
            }
        }

        private void AnimateVisual()
        {
            if (visualRoot == null) return;
            float bobAmplitude = UnitType == CrownUnitType.Tank ? 0.025f : UnitType == CrownUnitType.Raider ? 0.16f : 0.06f;
            float bobSpeed = UnitType == CrownUnitType.Tank ? 4f : UnitType == CrownUnitType.Raider ? 7f : 6f;
            visualRoot.localPosition = new Vector3(0f, Mathf.Sin(Time.time * bobSpeed + bobSeed) * bobAmplitude, 0f);

            if (weaponRoot != null)
            {
                weaponRoot.localScale = Vector3.Lerp(weaponRoot.localScale, Vector3.one, Time.deltaTime * 14f);
            }
        }

        protected override void Die()
        {
            Game?.CreateImpactPulse(transform.position + Vector3.up, Team == CrownTeam.Blue ? Game.CyanMaterial : Game.OrangeMaterial, UnitType == CrownUnitType.Tank ? 1.4f : 0.9f);
            Game?.UnregisterUnit(this);
            gameObject.SetActive(false);
            Destroy(gameObject, 0.1f);
        }
    }
}
