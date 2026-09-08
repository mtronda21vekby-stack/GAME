using UnityEngine;

namespace CrownFront.Cloud
{
    [CreateAssetMenu(menuName = "CROWN FRONT/Unit Definition", fileName = "CrownUnitDefinition")]
    public sealed class CrownUnitDefinition : ScriptableObject
    {
        [SerializeField] private string id;
        [SerializeField] private CrownUnitKind kind;
        [SerializeField] private string displayName;
        [SerializeField] private string role;
        [SerializeField] private int energyCost;
        [SerializeField] private int startingLevel = 1;
        [TextArea] [SerializeField] private string description;

        public string Id => id;
        public CrownUnitKind Kind => kind;
        public string DisplayName => displayName;
        public string Role => role;
        public int EnergyCost => energyCost;
        public int StartingLevel => startingLevel;
        public string Description => description;

#if UNITY_EDITOR
        public void Configure(string stableId, CrownUnitKind unitKind, string unitName, string unitRole, int cost, string text)
        {
            id = stableId;
            kind = unitKind;
            displayName = unitName;
            role = unitRole;
            energyCost = cost;
            startingLevel = 1;
            description = text;
        }
#endif
    }
}
