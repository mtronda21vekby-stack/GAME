using UnityEngine;

namespace CrownFront
{
    public enum CrownTeam
    {
        Blue,
        Red
    }

    public abstract class CrownEngineEntity : MonoBehaviour
    {
        public CrownTeam Team { get; protected set; }
        public float MaxHealth { get; protected set; }
        public float Health { get; protected set; }
        public bool IsAlive => Health > 0f;
        public float Health01 => MaxHealth <= 0f ? 0f : Mathf.Clamp01(Health / MaxHealth);

        protected CrownEngineBootstrap Game { get; private set; }
        protected Renderer[] VisualRenderers { get; private set; }

        protected void InitializeEntity(CrownEngineBootstrap game, CrownTeam team, float maxHealth)
        {
            Game = game;
            Team = team;
            MaxHealth = Mathf.Max(1f, maxHealth);
            Health = MaxHealth;
            VisualRenderers = GetComponentsInChildren<Renderer>(true);
        }

        public virtual void TakeDamage(float amount)
        {
            if (!IsAlive || amount <= 0f)
            {
                return;
            }

            Health = Mathf.Max(0f, Health - amount);
            Game?.CreateImpactPulse(transform.position + Vector3.up * 0.7f, Team == CrownTeam.Blue ? Game.OrangeMaterial : Game.CyanMaterial, 0.55f);

            if (Health <= 0f)
            {
                Die();
            }
        }

        protected abstract void Die();
    }
}
