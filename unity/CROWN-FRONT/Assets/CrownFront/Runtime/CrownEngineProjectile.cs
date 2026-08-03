using UnityEngine;

namespace CrownFront
{
    public sealed class CrownEngineProjectile : MonoBehaviour
    {
        private CrownEngineBootstrap game;
        private CrownEngineEntity target;
        private float damage;
        private float speed;
        private float lifeRemaining;
        private Renderer projectileRenderer;
        private TrailRenderer trail;

        private void Awake()
        {
            projectileRenderer = GetComponent<Renderer>();
            if (projectileRenderer == null)
            {
                projectileRenderer = CrownEngineVisuals.Primitive(
                    PrimitiveType.Sphere,
                    transform,
                    "ProjectileVisual",
                    Vector3.zero,
                    Vector3.one * 0.22f,
                    null).GetComponent<Renderer>();
            }

            trail = gameObject.AddComponent<TrailRenderer>();
            trail.time = 0.16f;
            trail.startWidth = 0.13f;
            trail.endWidth = 0.015f;
            trail.minVertexDistance = 0.06f;
            trail.autodestruct = false;
            trail.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            trail.receiveShadows = false;
        }

        public void Launch(
            CrownEngineBootstrap owner,
            CrownEngineEntity targetEntity,
            Vector3 origin,
            float amount,
            float movementSpeed,
            Material material)
        {
            game = owner;
            target = targetEntity;
            damage = amount;
            speed = movementSpeed;
            lifeRemaining = 4f;
            transform.position = origin;

            if (projectileRenderer != null)
            {
                projectileRenderer.sharedMaterial = material;
            }

            if (trail != null)
            {
                trail.sharedMaterial = material;
                trail.Clear();
            }

            gameObject.SetActive(true);
        }

        private void Update()
        {
            lifeRemaining -= Time.deltaTime;
            if (lifeRemaining <= 0f || target == null || !target.IsAlive)
            {
                Recycle();
                return;
            }

            Vector3 destination = target.transform.position + Vector3.up * 0.75f;
            Vector3 delta = destination - transform.position;
            float step = speed * Time.deltaTime;

            if (delta.sqrMagnitude <= step * step + 0.025f)
            {
                target.TakeDamage(damage);
                game?.CreateImpactPulse(destination, projectileRenderer != null ? projectileRenderer.sharedMaterial : null, 0.7f);
                Recycle();
                return;
            }

            transform.position += delta.normalized * step;
            CrownEngineVisuals.FaceDirection(transform, delta, 18f);
        }

        private void Recycle()
        {
            if (!gameObject.activeSelf) return;
            target = null;
            if (trail != null) trail.Clear();
            gameObject.SetActive(false);
            game?.RecycleProjectile(this);
        }
    }
}
