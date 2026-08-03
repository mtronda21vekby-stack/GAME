using UnityEngine;

namespace CrownFront
{
    public enum CrownBuildingType
    {
        Core,
        Tower
    }

    public sealed class CrownEngineBuilding : CrownEngineEntity
    {
        public CrownBuildingType BuildingType { get; private set; }
        public int LaneIndex { get; private set; }

        private Transform rotatingRoot;
        private Transform muzzle;
        private CrownEngineEntity currentTarget;
        private float nextScanTime;
        private float nextAttackTime;
        private float attackRange;
        private float damage;
        private float attackInterval;
        private float rotationSeed;

        public void Setup(CrownEngineBootstrap game, CrownTeam team, CrownBuildingType type, int laneIndex)
        {
            BuildingType = type;
            LaneIndex = Mathf.Clamp(laneIndex, 0, 2);
            float health = type == CrownBuildingType.Core ? 2500f : 720f;
            attackRange = 6.4f;
            damage = 38f;
            attackInterval = 1.05f;
            rotationSeed = Random.Range(0f, 10f);

            BuildVisual(game, team, type);
            InitializeEntity(game, team, health);
            game.RegisterBuilding(this);
        }

        private void BuildVisual(CrownEngineBootstrap game, CrownTeam team, CrownBuildingType type)
        {
            Material armor = team == CrownTeam.Blue ? game.BlueArmorMaterial : game.RedArmorMaterial;
            Material energy = team == CrownTeam.Blue ? game.CyanMaterial : game.OrangeMaterial;

            if (type == CrownBuildingType.Core)
            {
                CrownEngineVisuals.Primitive(PrimitiveType.Cylinder, transform, "CoreHousing", new Vector3(0f, 0.46f, 0f), new Vector3(1.75f, 0.42f, 1.75f), armor);
                CrownEngineVisuals.Primitive(PrimitiveType.Cylinder, transform, "InnerHousing", new Vector3(0f, 0.79f, 0f), new Vector3(1.2f, 0.32f, 1.2f), game.GraphiteMaterial);
                CrownEngineVisuals.Primitive(PrimitiveType.Sphere, transform, "LivingReactor", new Vector3(0f, 1.28f, 0f), Vector3.one * 0.9f, energy);

                rotatingRoot = CrownEngineVisuals.CreateRing(transform, "MagneticRing", 1.45f, 1.28f, 14, energy, 0.24f);
                Transform secondRing = CrownEngineVisuals.CreateRing(transform, "ArmorRing", 1.05f, 1.28f, 10, armor, 0.22f);
                secondRing.localEulerAngles = new Vector3(28f, 0f, 0f);

                for (int i = 0; i < 4; i++)
                {
                    float angle = i * 90f;
                    Vector3 offset = Quaternion.Euler(0f, angle, 0f) * new Vector3(0f, 0.5f, 1.65f);
                    CrownEngineVisuals.Primitive(PrimitiveType.Cube, transform, "CoreButtress", new Vector3(offset.x, 0.48f, offset.z), new Vector3(0.38f, 0.68f, 0.8f), armor, false, new Vector3(0f, angle, 0f));
                }
            }
            else
            {
                CrownEngineVisuals.Primitive(PrimitiveType.Cylinder, transform, "TowerBase", new Vector3(0f, 0.38f, 0f), new Vector3(1.15f, 0.38f, 1.15f), armor);
                CrownEngineVisuals.Primitive(PrimitiveType.Cylinder, transform, "EnergyBearing", new Vector3(0f, 0.74f, 0f), new Vector3(0.74f, 0.3f, 0.74f), energy);

                rotatingRoot = new GameObject("RotatingWeapon").transform;
                rotatingRoot.SetParent(transform, false);
                rotatingRoot.localPosition = new Vector3(0f, 1.18f, 0f);
                CrownEngineVisuals.Primitive(PrimitiveType.Cylinder, rotatingRoot, "TurretBody", Vector3.zero, new Vector3(0.7f, 0.42f, 0.7f), armor);
                CrownEngineVisuals.Primitive(PrimitiveType.Cube, rotatingRoot, "ArmorCrown", new Vector3(0f, 0.38f, 0f), new Vector3(0.9f, 0.2f, 0.9f), armor, false, new Vector3(0f, 45f, 0f));
                CrownEngineVisuals.Primitive(PrimitiveType.Cylinder, rotatingRoot, "Cannon", new Vector3(0f, 0.12f, 0.88f), new Vector3(0.19f, 0.92f, 0.19f), armor, false, new Vector3(90f, 0f, 0f));
                GameObject muzzleObject = CrownEngineVisuals.Primitive(PrimitiveType.Sphere, rotatingRoot, "Muzzle", new Vector3(0f, 0.12f, 1.76f), Vector3.one * 0.25f, energy);
                muzzle = muzzleObject.transform;
            }
        }

        private void Update()
        {
            if (Game == null || !IsAlive || Game.MatchEnded) return;

            if (BuildingType == CrownBuildingType.Core)
            {
                if (rotatingRoot != null)
                {
                    rotatingRoot.Rotate(0f, (Team == CrownTeam.Blue ? 22f : -22f) * Time.deltaTime, 0f, Space.Self);
                    float pulse = 1f + Mathf.Sin(Time.time * 2.5f + rotationSeed) * 0.035f;
                    rotatingRoot.localScale = Vector3.one * pulse;
                }
                return;
            }

            if (Time.time >= nextScanTime)
            {
                nextScanTime = Time.time + 0.16f;
                currentTarget = Game.FindNearestEnemy(this, attackRange);
            }

            if (currentTarget == null || !currentTarget.IsAlive) return;

            Vector3 delta = currentTarget.transform.position - transform.position;
            if (rotatingRoot != null)
            {
                CrownEngineVisuals.FaceDirection(rotatingRoot, delta, 7f);
            }

            if (Time.time >= nextAttackTime)
            {
                nextAttackTime = Time.time + attackInterval;
                Material material = Team == CrownTeam.Blue ? Game.CyanMaterial : Game.OrangeMaterial;
                Vector3 origin = muzzle != null ? muzzle.position : transform.position + Vector3.up * 1.4f;
                Game.FireProjectile(origin, currentTarget, damage, 15f, material);
                Game.CreateImpactPulse(origin, material, 0.45f);
            }
        }

        public override void TakeDamage(float amount)
        {
            base.TakeDamage(amount);
            if (IsAlive && BuildingType == CrownBuildingType.Core && rotatingRoot != null)
            {
                float stress = 1f + (1f - Health01) * 0.16f;
                rotatingRoot.localScale = Vector3.one * stress;
            }
        }

        protected override void Die()
        {
            Game?.CreateImpactPulse(transform.position + Vector3.up, Team == CrownTeam.Blue ? Game.CyanMaterial : Game.OrangeMaterial, BuildingType == CrownBuildingType.Core ? 3.2f : 1.8f);
            Game?.OnBuildingDestroyed(this);

            if (BuildingType == CrownBuildingType.Tower)
            {
                transform.localEulerAngles += new Vector3(65f, 0f, 18f);
            }
            else
            {
                gameObject.SetActive(false);
            }
        }
    }
}
