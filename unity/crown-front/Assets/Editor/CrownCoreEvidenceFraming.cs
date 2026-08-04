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

            CrownQuaterniusFinalGrade grade = Object.FindAnyObjectByType<CrownQuaterniusFinalGrade>();
            CrownFinalGradeCamera rig = camera.GetComponent<CrownFinalGradeCamera>();
            if (grade == null || rig == null || rig.enabled) return;

            CrownBuilding[] buildings = Object.FindObjectsByType<CrownBuilding>(FindObjectsInactive.Include);
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

            // Match evidence to the runtime presentation before calculating framing.
            // ApplyAll is idempotent and cannot duplicate the correction geometry.
            if (!CrownCoreStructuralCorrection.ApplyAll())
            {
                Debug.LogWarning("CROWN//FRONT Core structural correction was not ready before evidence render.");
                return;
            }

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
                : reviewCore.transform.position + Vector3.up * 0.82f;

            camera.transform.position = target + new Vector3(0f, 3.2f, -8.2f);
            camera.transform.LookAt(target + Vector3.up * 0.03f);
            camera.fieldOfView = 29.5f;
        }
    }
}
#endif
