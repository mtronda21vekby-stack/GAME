using System;
using UnityEngine;
using UnityEngine.Rendering;

namespace CrownFront.Cloud
{
    [DefaultExecutionOrder(3200)]
    public sealed class CrownCoreStructuralCorrection : MonoBehaviour
    {
        private bool _applied;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void InstallAtRuntime()
        {
            CrownEngineGame game = FindAnyObjectByType<CrownEngineGame>();
            if (game == null || game.GetComponent<CrownCoreStructuralCorrection>() != null) return;
            game.gameObject.AddComponent<CrownCoreStructuralCorrection>();
        }

        private void Start() => TryApply();

        private void LateUpdate()
        {
            if (!_applied) TryApply();
        }

        private void TryApply()
        {
            _applied = ApplyAll();
        }

        public static bool ApplyAll()
        {
            CrownBuilding[] buildings = FindObjectsByType<CrownBuilding>(FindObjectsInactive.Include);
            bool corrected = false;
            for (int i = 0; i < buildings.Length; i++)
            {
                CrownBuilding building = buildings[i];
                if (building == null || !building.IsCore) continue;
                corrected |= CorrectCore(building);
            }
            return corrected;
        }

        private static bool CorrectCore(CrownBuilding building)
        {
            Transform finalCore = FindDeep(building.transform, "FINAL GRADE // CORE");
            if (finalCore == null) return false;

            Transform legacyCore = FindDeep(building.transform, "[PRESENTATION] Crown Reactor");
            if (legacyCore != null) legacyCore.gameObject.SetActive(false);

            Transform qCore = FindDeep(building.transform, "QUATERNIUS ART // CORE");
            if (qCore != null)
            {
                SetActiveNamed(qCore, "Embedded Reactor Base", false);
                SetActiveNamed(qCore, "Reactor Containment Dome", false);
                SetActiveNamed(qCore, "Reactor Stabilizers", false);

                Transform lens = FindDeep(qCore, "Living Crown Lens");
                if (lens != null)
                {
                    lens.localScale = Vector3.one * 0.045f;
                    lens.localPosition = new Vector3(0f, 0.66f, 0f);
                }
            }

            Transform corePolish = FindDeep(building.transform, "HYBRID POLISH // CORE");
            if (corePolish != null)
            {
                SetActiveNamed(corePolish, "Outer Magnetic Ring", false);
                SetActiveNamed(corePolish, "Inner Magnetic Ring", false);
                SetActiveNamed(corePolish, "Focused Reactor Core", false);
            }

            if (FindDeep(building.transform, "CORE STRUCTURAL CORRECTION") != null) return true;

            Material graphite = MaterialFrom(FindDeep(finalCore, "Embedded Core Socket"));
            Material steel = MaterialFrom(corePolish != null ? FindDeep(corePolish, "Outer Magnetic Ring") : null);
            Material energy = MaterialFrom(FindDeep(finalCore, "Core Stabilizer Energy"));
            Material white = MaterialFrom(corePolish != null ? FindDeep(corePolish, "Focused Reactor Core") : null);
            if (graphite == null || steel == null || energy == null || white == null) return false;

            Mesh plate = CrownAuthoredMeshFactory.CreateTaperedBox("CoreCorrection_Plate", 0.68f, 0.78f, 0.86f);
            Mesh blade = CrownAuthoredMeshFactory.CreateBlade("CoreCorrection_Blade");
            Transform correction = Group("CORE STRUCTURAL CORRECTION", building.transform);
            Part("Reactor Pedestal", correction, plate, new Vector3(0f, 0.24f, 0f), new Vector3(0.72f, 0.34f, 0.72f), steel);
            Part("Reactor Pedestal Shadow", correction, plate, new Vector3(0f, 0.06f, 0f), new Vector3(1.06f, 0.09f, 1.06f), graphite);
            Part("Reactor Crown Cap", correction, blade, new Vector3(0f, 0.59f, 0f), new Vector3(0.12f, 0.18f, 0.12f), white);

            for (int i = 0; i < 3; i++)
            {
                float angle = i * 120f;
                float radians = angle * Mathf.Deg2Rad;
                Vector3 bracePosition = new Vector3(Mathf.Sin(radians) * 0.76f, 0.34f, Mathf.Cos(radians) * 0.76f);
                Vector3 guardPosition = new Vector3(Mathf.Sin(radians) * 0.48f, 0.55f, Mathf.Cos(radians) * 0.48f);
                Part("Pedestal Energy Brace", correction, blade, bracePosition, new Vector3(0.05f, 0.18f, 0.065f), energy, new Vector3(0f, angle, 0f));
                Part("Reactor Crown Guard", correction, blade, guardPosition, new Vector3(0.14f, 0.34f, 0.18f), steel, new Vector3(0f, angle, 0f));
                Part("Crown Guard Energy", correction, blade, guardPosition + Vector3.up * 0.03f, new Vector3(0.04f, 0.17f, 0.055f), energy, new Vector3(0f, angle, 0f));
            }
            return true;
        }

        private static Material MaterialFrom(Transform root)
        {
            if (root == null) return null;
            Renderer renderer = root.GetComponentInChildren<Renderer>(true);
            return renderer != null ? renderer.sharedMaterial : null;
        }

        private static void SetActiveNamed(Transform root, string name, bool active)
        {
            Transform[] transforms = root.GetComponentsInChildren<Transform>(true);
            for (int i = 0; i < transforms.Length; i++)
            {
                if (string.Equals(transforms[i].name, name, StringComparison.Ordinal)) transforms[i].gameObject.SetActive(active);
            }
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

        private static Transform FindDeep(Transform root, string name)
        {
            Transform[] transforms = root.GetComponentsInChildren<Transform>(true);
            for (int i = 0; i < transforms.Length; i++)
            {
                if (string.Equals(transforms[i].name, name, StringComparison.Ordinal)) return transforms[i];
            }
            return null;
        }
    }
}
