using UnityEngine;

namespace CrownFront.Cloud
{
    public enum CrownAudioCue
    {
        UiSelect,
        Deploy,
        AssaultShot,
        TankShot,
        RaiderAttack,
        TowerShot,
        Impact,
        CorePulse,
        CoreDamage,
        CoreDestroyed,
        Victory,
        Defeat,
        TitanAmbient
    }

    public sealed class CrownAudioHooks : MonoBehaviour
    {
        private AudioSource _source;

        private void Awake()
        {
            _source = gameObject.AddComponent<AudioSource>();
            _source.playOnAwake = false;
            _source.spatialBlend = 0f;
            _source.volume = 0.42f;
        }

        public void Play(CrownAudioCue cue)
        {
            // Stable presentation hook. Production clips can be assigned later without changing combat timing.
            if (_source == null || _source.clip == null) return;
            _source.pitch = cue == CrownAudioCue.TankShot ? 0.82f : cue == CrownAudioCue.RaiderAttack ? 1.16f : 1f;
            _source.PlayOneShot(_source.clip);
        }
    }

    public sealed class CrownCameraPresentation : MonoBehaviour
    {
        private Camera _camera;
        private Vector3 _basePosition;
        private Quaternion _baseRotation;
        private float _baseFieldOfView;
        private float _startTime;
        private float _shakeUntil;
        private float _shakeStrength;
        private float _resultBlend;
        private bool _resultActive;

        public void Configure(Camera camera)
        {
            _camera = camera;
            _basePosition = camera.transform.position;
            _baseRotation = camera.transform.rotation;
            _baseFieldOfView = camera.fieldOfView;
            _startTime = Time.time;
        }

        public void Impact(float strength)
        {
            _shakeStrength = Mathf.Max(_shakeStrength, Mathf.Clamp(strength, 0.02f, 0.22f));
            _shakeUntil = Mathf.Max(_shakeUntil, Time.time + 0.22f);
        }

        public void Finish()
        {
            _resultActive = true;
        }

        private void LateUpdate()
        {
            if (_camera == null) return;
            float elapsed = Time.time - _startTime;
            float settle = Mathf.Exp(-elapsed * 2.4f);
            float breathe = Mathf.Sin(Time.time * 0.38f) * 0.018f;
            Vector3 offset = new Vector3(0f, 0.42f * settle + breathe, -0.65f * settle);

            if (Time.time < _shakeUntil)
            {
                float fade = Mathf.Clamp01((_shakeUntil - Time.time) / 0.22f);
                float frequency = Time.time * 47f;
                offset += new Vector3(Mathf.Sin(frequency), Mathf.Cos(frequency * 1.17f), 0f) * (_shakeStrength * fade);
            }
            else
            {
                _shakeStrength = 0f;
            }

            if (_resultActive) _resultBlend = Mathf.MoveTowards(_resultBlend, 1f, Time.unscaledDeltaTime * 0.55f);
            _camera.transform.position = _basePosition + _baseRotation * offset;
            _camera.transform.rotation = _baseRotation * Quaternion.Euler(breathe * 0.35f, 0f, breathe * 0.18f);
            _camera.fieldOfView = Mathf.Lerp(_baseFieldOfView, _baseFieldOfView - 2.2f, _resultBlend);
        }
    }

    public sealed class CrownUnitPresentation : MonoBehaviour
    {
        private CrownUnitKind _kind;
        private Transform _visualRoot;
        private Transform _torso;
        private Transform _weapon;
        private Transform _leftLeg;
        private Transform _rightLeg;
        private Transform _reactor;
        private Vector3 _visualBasePosition;
        private Vector3 _visualBaseScale;
        private Quaternion _torsoBaseRotation;
        private Quaternion _weaponBaseRotation;
        private float _phase;
        private float _attackTime = -10f;
        private float _hitTime = -10f;
        private float _deathTime = -10f;
        private bool _moving;
        private bool _dead;

        public void Configure(
            CrownUnitKind kind,
            Transform visualRoot,
            Transform torso,
            Transform weapon,
            Transform leftLeg,
            Transform rightLeg,
            Transform reactor)
        {
            _kind = kind;
            _visualRoot = visualRoot;
            _torso = torso;
            _weapon = weapon;
            _leftLeg = leftLeg;
            _rightLeg = rightLeg;
            _reactor = reactor;
            _visualBasePosition = visualRoot.localPosition;
            _visualBaseScale = visualRoot.localScale;
            _torsoBaseRotation = torso != null ? torso.localRotation : Quaternion.identity;
            _weaponBaseRotation = weapon != null ? weapon.localRotation : Quaternion.identity;
            _phase = Random.Range(0f, 10f);
        }

        public void SetMoving(bool moving) { _moving = moving; }
        public void PlayAttack() { _attackTime = Time.time; }
        public void PlayHit() { _hitTime = Time.time; }
        public void PlayDeath() { _dead = true; _deathTime = Time.time; }

        private void Update()
        {
            if (_visualRoot == null) return;
            float cadence = _kind == CrownUnitKind.Raider ? 10f : _kind == CrownUnitKind.Tank ? 4.2f : 6.8f;
            float stride = _moving ? Mathf.Sin(Time.time * cadence + _phase) : Mathf.Sin(Time.time * 1.5f + _phase) * 0.18f;
            float idle = Mathf.Sin(Time.time * 1.25f + _phase);
            float attack = Mathf.Clamp01(1f - (Time.time - _attackTime) / 0.22f);
            float hit = Mathf.Clamp01(1f - (Time.time - _hitTime) / 0.16f);

            if (_dead)
            {
                float death = Mathf.Clamp01((Time.time - _deathTime) / 0.55f);
                _visualRoot.localRotation = Quaternion.Euler(Mathf.Lerp(0f, 74f, death), 0f, Mathf.Sin(_phase) * 16f * death);
                _visualRoot.localScale = _visualBaseScale * Mathf.Lerp(1f, 0.08f, death * death);
                _visualRoot.localPosition = _visualBasePosition + Vector3.down * death * 0.42f;
                return;
            }

            float bounce = _moving ? Mathf.Abs(stride) * (_kind == CrownUnitKind.Tank ? 0.045f : 0.075f) : idle * 0.018f;
            _visualRoot.localPosition = _visualBasePosition + new Vector3(0f, bounce, attack * (_kind == CrownUnitKind.Raider ? 0.24f : 0.04f));
            _visualRoot.localScale = Vector3.Scale(_visualBaseScale, new Vector3(1f + hit * 0.08f, 1f - hit * 0.05f, 1f + hit * 0.08f));
            _visualRoot.localRotation = Quaternion.Euler(0f, 0f, _moving ? stride * 1.8f : idle * 0.7f);

            if (_torso != null)
            {
                float lean = _moving ? (_kind == CrownUnitKind.Raider ? 12f : _kind == CrownUnitKind.Tank ? 3f : 7f) : 0f;
                _torso.localRotation = _torsoBaseRotation * Quaternion.Euler(lean - attack * 7f, 0f, stride * 2.4f);
            }
            if (_weapon != null)
            {
                float recoil = Mathf.Sin(attack * Mathf.PI) * (_kind == CrownUnitKind.Tank ? 18f : 9f);
                _weapon.localRotation = _weaponBaseRotation * Quaternion.Euler(-recoil, 0f, 0f);
            }
            if (_leftLeg != null) _leftLeg.localRotation = Quaternion.Euler(stride * 18f, 0f, 0f);
            if (_rightLeg != null) _rightLeg.localRotation = Quaternion.Euler(-stride * 18f, 0f, 0f);
            if (_reactor != null) _reactor.Rotate(Vector3.forward, Time.deltaTime * (_kind == CrownUnitKind.Raider ? 150f : 55f), Space.Self);
        }
    }

    public sealed class CrownBuildingPresentation : MonoBehaviour
    {
        private bool _isCore;
        private Transform _visualRoot;
        private Transform _turret;
        private Transform _barrel;
        private Transform _muzzle;
        private Transform _energy;
        private Transform[] _rings;
        private Vector3 _barrelBasePosition;
        private Vector3 _visualBaseScale;
        private float _shotTime = -10f;
        private float _hitTime = -10f;
        private float _damage;
        private float _destroyTime = -10f;
        private bool _destroyed;

        public void Configure(bool isCore, Transform visualRoot, Transform turret, Transform barrel, Transform muzzle, Transform energy, Transform[] rings)
        {
            _isCore = isCore;
            _visualRoot = visualRoot;
            _turret = turret;
            _barrel = barrel;
            _muzzle = muzzle;
            _energy = energy;
            _rings = rings ?? new Transform[0];
            _visualBaseScale = visualRoot != null ? visualRoot.localScale : Vector3.one;
            _barrelBasePosition = barrel != null ? barrel.localPosition : Vector3.zero;
        }

        public void Track(Vector3 target)
        {
            if (_turret == null || _destroyed) return;
            Vector3 direction = target - _turret.position;
            direction.y = 0f;
            if (direction.sqrMagnitude > 0.01f)
            {
                Quaternion desired = Quaternion.LookRotation(direction);
                _turret.rotation = Quaternion.Slerp(_turret.rotation, desired, Time.deltaTime * 8f);
            }
        }

        public void PlayShot() { _shotTime = Time.time; }

        public void PlayHit(float damage01)
        {
            _damage = Mathf.Clamp01(damage01);
            _hitTime = Time.time;
        }

        public void PlayDestroyed()
        {
            _destroyed = true;
            _destroyTime = Time.time;
        }

        private void Update()
        {
            if (_visualRoot == null) return;
            float shot = Mathf.Clamp01(1f - (Time.time - _shotTime) / 0.18f);
            float hit = Mathf.Clamp01(1f - (Time.time - _hitTime) / 0.18f);
            if (_barrel != null) _barrel.localPosition = _barrelBasePosition - Vector3.forward * shot * (_isCore ? 0f : 0.28f);
            if (_muzzle != null) _muzzle.localScale = Vector3.one * Mathf.Sin(shot * Mathf.PI) * 0.72f;
            if (_energy != null)
            {
                float pulse = 1f + Mathf.Sin(Time.time * (_damage > 0.72f ? 7f : 2.5f)) * (0.05f + _damage * 0.05f);
                _energy.localScale = Vector3.one * pulse * (1f + hit * 0.16f);
            }

            for (int i = 0; i < _rings.Length; i++)
            {
                Transform ring = _rings[i];
                if (ring == null) continue;
                float direction = (i & 1) == 0 ? 1f : -1f;
                ring.Rotate(i % 3 == 0 ? Vector3.up : Vector3.forward, direction * Time.deltaTime * (22f + i * 11f + _damage * 24f), Space.Self);
            }

            if (_destroyed)
            {
                float death = Mathf.Clamp01((Time.time - _destroyTime) / (_isCore ? 1.1f : 0.7f));
                _visualRoot.localRotation = Quaternion.Euler(death * 16f, death * 34f, death * 9f);
                _visualRoot.localScale = _visualBaseScale * Mathf.Lerp(1f, 0.12f, death * death);
            }
            else
            {
                _visualRoot.localScale = Vector3.Scale(_visualBaseScale, new Vector3(1f + hit * 0.025f, 1f - hit * 0.035f, 1f + hit * 0.025f));
            }
        }
    }

    public sealed class CrownAmbientMotion : MonoBehaviour
    {
        public Vector3 Axis = Vector3.up;
        public float DegreesPerSecond = 16f;
        public float BobAmount = 0.04f;
        public float BobSpeed = 0.8f;
        private Vector3 _basePosition;
        private float _phase;

        private void Awake()
        {
            _basePosition = transform.localPosition;
            _phase = Random.Range(0f, 10f);
        }

        private void Update()
        {
            transform.Rotate(Axis, DegreesPerSecond * Time.deltaTime, Space.Self);
            transform.localPosition = _basePosition + Vector3.up * Mathf.Sin(Time.time * BobSpeed + _phase) * BobAmount;
        }
    }
}
