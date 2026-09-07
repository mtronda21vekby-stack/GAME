#if UNITY_EDITOR
using CrownFront.Cloud;
using UnityEditor;
using UnityEngine;

namespace CrownFront.Editor
{
    [InitializeOnLoad]
    public static class CrownCoreEvidenceFraming
    {
        static CrownCoreEvidenceFraming()
        {
            Camera.onPreCull -= FrameCoreEvidence;
            Camera.onPreCull += FrameCoreEvidence;
        }

        private static void FrameCoreEvidence(Camera camera)
        {
            if (camera == null || camera != Camera.main) return;

            CrownQuaterniusFinalGrade grade =
                UnityEngine.Object.FindAnyObjectByType<CrownQuaterniusFinalGrade>();
            CrownFinalGradeCamera rig = camera.GetComponent<CrownFinalGradeCamera>();
            if (grade == null || rig == null || rig.enabled) return;

            CrownBuilding[] buildings =
                UnityEngine.Object.FindObjectsByType<CrownBuilding>(FindObjectsInactive.Include);
            CrownBuilding reviewCore = null;
            for (int i = 0; i < buildings.Length; i++)
            {
                CrownBuilding building = buildings[i];
                if (building != null && building.IsCore && building.Team == CrownTeam.Blue)
                {
                    reviewCore = building;
                    break;
                }
            }
            if (reviewCore == null) return;

            if (!CrownCoreStructuralCorrection.ApplyAll())
            {
                Debug.LogWarning("CROWN//FRONT Core structural correction was not ready before evidence render.");
                return;
            }

            HideCoreEvidenceNoise(reviewCore);

            Renderer[] renderers = reviewCore.GetComponentsInChildren<Renderer>(false);
            Bounds bounds = default;
            bool hasBounds = false;
            for (int i = 0; i < renderers.Length; i++)
            {
                Renderer renderer = renderers[i];
                if (renderer == null || !renderer.enabled || !renderer.gameObject.activeInHierarchy) continue;
                if (!hasBounds)
                {
                    bounds = renderer.bounds;
                    hasBounds = true;
                }
                else
                {
                    bounds.Encapsulate(renderer.bounds);
                }
            }

            Vector3 target = hasBounds
                ? bounds.center
                : reviewCore.transform.position + Vector3.up * 0.58f;

            camera.transform.position = target + new Vector3(0f, 1.10f, -4.70f);
            camera.transform.LookAt(target + Vector3.up * 0.02f);
            camera.fieldOfView = 28.5f;
        }

        private static void HideCoreEvidenceNoise(CrownBuilding reviewCore)
        {
            CrownUnit[] units =
                UnityEngine.Object.FindObjectsByType<CrownUnit>(FindObjectsInactive.Include);
            for (int i = 0; i < units.Length; i++)
            {
                if (units[i] != null) units[i].gameObject.SetActive(false);
            }

            CrownProjectile[] projectiles =
                UnityEngine.Object.FindObjectsByType<CrownProjectile>(FindObjectsInactive.Include);
            for (int i = 0; i < projectiles.Length; i++)
            {
                if (projectiles[i] != null) projectiles[i].gameObject.SetActive(false);
            }

            CrownImpact[] impacts =
                UnityEngine.Object.FindObjectsByType<CrownImpact>(FindObjectsInactive.Include);
            for (int i = 0; i < impacts.Length; i++)
            {
                if (impacts[i] != null) impacts[i].gameObject.SetActive(false);
            }

            CrownBuilding[] buildings =
                UnityEngine.Object.FindObjectsByType<CrownBuilding>(FindObjectsInactive.Include);
            for (int i = 0; i < buildings.Length; i++)
            {
                CrownBuilding building = buildings[i];
                if (building != null && building != reviewCore)
                {
                    building.gameObject.SetActive(false);
                }
            }

            CrownEngineGame game =
                UnityEngine.Object.FindAnyObjectByType<CrownEngineGame>();
            if (game == null) return;

            Transform[] transforms = game.GetComponentsInChildren<Transform>(true);
            for (int i = 0; i < transforms.Length; i++)
            {
                Transform current = transforms[i];
                if (current == null) continue;
                if (current.name == "Spinal Energy Channel" ||
                    current.name == "Embedded Energy Seam" ||
                    current.name == "Embedded Route Energy" ||
                    current.name == "Focused Reactor Core")
                {
                    current.gameObject.SetActive(false);
                }
            }

            Renderer[] sceneRenderers = game.GetComponentsInChildren<Renderer>(true);
            for (int i = 0; i < sceneRenderers.Length; i++)
            {
                Renderer renderer = sceneRenderers[i];
                if (renderer == null || !renderer.gameObject.activeInHierarchy) continue;
                if (renderer.transform.IsChildOf(reviewCore.transform)) continue;
                if (UsesExternalWhiteEnergy(renderer)) renderer.enabled = false;
            }
        }

        private static bool UsesExternalWhiteEnergy(Renderer renderer)
        {
            Material[] materials = renderer.sharedMaterials;
            for (int i = 0; i < materials.Length; i++)
            {
                Material material = materials[i];
                if (material == null) continue;
                string materialName = material.name;
                if (materialName.Contains("Crown Energy") ||
                    materialName.Contains("whiteHot") ||
                    materialName.Contains("whiteEnergy"))
                {
                    return true;
                }
            }
            return false;
        }
    }
}
#endif
