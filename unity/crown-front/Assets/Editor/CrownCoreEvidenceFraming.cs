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
            bool hasReviewCore = false;
            for (int i = 0; i < buildings.Length; i++)
            {
                CrownBuilding building = buildings[i];
                if (building != null && building.IsCore && building.Team == CrownTeam.Blue)
                {
                    hasReviewCore = true;
                    break;
                }
            }
            if (!hasReviewCore) return;

            camera.transform.position = new Vector3(0f, 7.4f, -14.4f);
            camera.transform.LookAt(new Vector3(0f, 0.62f, -8.5f));
            camera.fieldOfView = 23.5f;
        }
    }
}
#endif
