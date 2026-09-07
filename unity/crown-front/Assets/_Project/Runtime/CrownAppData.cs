using System;
using System.Collections.Generic;
using UnityEngine;

namespace CrownFront.Cloud
{
    public enum CrownAppScreen
    {
        MainMenu,
        DeckBuilder,
        Collection,
        Battle,
        Results,
        Settings
    }

    public static class CrownBuildInfo
    {
        public const string Version = "0.4.0-menu-baked-review";
        public const string Environment = "Review";
    }

    public static class CrownUnitCatalog
    {
        public const string AssaultId = "unit.assault";
        public const string TankId = "unit.tank";
        public const string RaiderId = "unit.raider";
        public const string RangedId = "unit.ranged";

        private static readonly string[] DefaultIds = { AssaultId, TankId, RaiderId, RangedId };
        private static CrownUnitDefinition[] _cache;

        public static IReadOnlyList<CrownUnitDefinition> All
        {
            get
            {
                if (_cache == null || _cache.Length == 0)
                {
                    _cache = Resources.LoadAll<CrownUnitDefinition>("CrownUnits");
                    Array.Sort(_cache, (a, b) => Array.IndexOf(DefaultIds, a.Id).CompareTo(Array.IndexOf(DefaultIds, b.Id)));
                }
                return _cache;
            }
        }

        public static string[] CreateDefaultDeck()
        {
            return (string[])DefaultIds.Clone();
        }

        public static CrownUnitDefinition Find(string id)
        {
            IReadOnlyList<CrownUnitDefinition> all = All;
            for (int i = 0; i < all.Count; i++)
            {
                if (string.Equals(all[i].Id, id, StringComparison.Ordinal)) return all[i];
            }
            return null;
        }

        public static bool TryGetKind(string id, out CrownUnitKind kind)
        {
            CrownUnitDefinition definition = Find(id);
            kind = definition != null ? definition.Kind : CrownUnitKind.Assault;
            return definition != null;
        }

        public static bool IsValidDeck(IReadOnlyList<string> ids)
        {
            if (ids == null || ids.Count != 4) return false;
            HashSet<string> unique = new HashSet<string>(StringComparer.Ordinal);
            for (int i = 0; i < ids.Count; i++)
            {
                if (string.IsNullOrWhiteSpace(ids[i]) || Find(ids[i]) == null || !unique.Add(ids[i])) return false;
            }
            return true;
        }

        public static float AverageCost(IReadOnlyList<string> ids)
        {
            if (!IsValidDeck(ids)) return 0f;
            float total = 0f;
            for (int i = 0; i < ids.Count; i++) total += Find(ids[i]).EnergyCost;
            return total / ids.Count;
        }

        public static void ClearCacheForTests()
        {
            _cache = null;
        }
    }

    [Serializable]
    public sealed class CrownPlayerProfile
    {
        public int schemaVersion = 1;
        public string playerName = "COMMANDER";
        public int playerLevel = 1;
        public int currentXp;
        public int xpNeeded = 250;
        public int coins = 500;
        public int matchSequence;
        public string selectedCoreId = "core.blue.crown";
        public string[] selectedDeck = CrownUnitCatalog.CreateDefaultDeck();
        public string[] unlockedUnitIds = CrownUnitCatalog.CreateDefaultDeck();
        public string[] claimedResultIds = Array.Empty<string>();

        public bool IsUnlocked(string id)
        {
            if (unlockedUnitIds == null) return false;
            for (int i = 0; i < unlockedUnitIds.Length; i++)
            {
                if (string.Equals(unlockedUnitIds[i], id, StringComparison.Ordinal)) return true;
            }
            return false;
        }

        public bool HasClaimed(string resultId)
        {
            if (claimedResultIds == null || string.IsNullOrEmpty(resultId)) return false;
            for (int i = 0; i < claimedResultIds.Length; i++)
            {
                if (string.Equals(claimedResultIds[i], resultId, StringComparison.Ordinal)) return true;
            }
            return false;
        }

        public void MarkClaimed(string resultId)
        {
            if (HasClaimed(resultId)) return;
            List<string> values = claimedResultIds == null ? new List<string>() : new List<string>(claimedResultIds);
            values.Add(resultId);
            if (values.Count > 32) values.RemoveRange(0, values.Count - 32);
            claimedResultIds = values.ToArray();
        }

        public void AddProgress(int xp, int coinReward)
        {
            coins = Mathf.Max(0, coins + Mathf.Max(0, coinReward));
            currentXp += Mathf.Max(0, xp);
            while (currentXp >= xpNeeded)
            {
                currentXp -= xpNeeded;
                playerLevel++;
                xpNeeded = XpForLevel(playerLevel);
            }
        }

        public static int XpForLevel(int level)
        {
            return 200 + Mathf.Max(1, level) * 50;
        }

        public void RepairOptionalFields()
        {
            if (string.IsNullOrWhiteSpace(playerName)) playerName = "COMMANDER";
            playerLevel = Mathf.Max(1, playerLevel);
            xpNeeded = xpNeeded > 0 ? xpNeeded : XpForLevel(playerLevel);
            coins = Mathf.Max(0, coins);
            matchSequence = Mathf.Max(0, matchSequence);
            if (string.IsNullOrWhiteSpace(selectedCoreId)) selectedCoreId = "core.blue.crown";
            if (!CrownUnitCatalog.IsValidDeck(selectedDeck)) selectedDeck = CrownUnitCatalog.CreateDefaultDeck();
            List<string> unlocked = unlockedUnitIds == null ? new List<string>() : new List<string>(unlockedUnitIds);
            string[] required = CrownUnitCatalog.CreateDefaultDeck();
            for (int i = 0; i < required.Length; i++) if (!unlocked.Contains(required[i])) unlocked.Add(required[i]);
            unlockedUnitIds = unlocked.ToArray();
            if (claimedResultIds == null) claimedResultIds = Array.Empty<string>();
            schemaVersion = Mathf.Max(1, schemaVersion);
        }
    }

    [Serializable]
    public sealed class CrownUserSettings
    {
        public float masterVolume = 0.8f;
        public float musicVolume = 0.65f;
        public float sfxVolume = 0.8f;
        public bool vibration = true;
        public int vfxIntensity = 2;
        public int quality = 1;
        public int fpsCap = 60;
        public bool tutorialComplete;

        public void Clamp()
        {
            masterVolume = Mathf.Clamp01(masterVolume);
            musicVolume = Mathf.Clamp01(musicVolume);
            sfxVolume = Mathf.Clamp01(sfxVolume);
            vfxIntensity = Mathf.Clamp(vfxIntensity, 0, 2);
            quality = Mathf.Clamp(quality, 0, 2);
            fpsCap = fpsCap <= 30 ? 30 : 60;
        }

        public void Apply()
        {
            Clamp();
            AudioListener.volume = masterVolume;
            Application.targetFrameRate = fpsCap;
            QualitySettings.antiAliasing = quality == 2 ? 2 : 0;
            QualitySettings.shadowDistance = quality == 0 ? 14f : quality == 1 ? 24f : 34f;
            CrownRuntimePreferences.VfxIntensity = vfxIntensity;
            CrownRuntimePreferences.Vibration = vibration;
            CrownRuntimePreferences.MusicVolume = musicVolume;
            CrownRuntimePreferences.SfxVolume = sfxVolume;
        }
    }

    public static class CrownRuntimePreferences
    {
        public static int VfxIntensity { get; set; } = 2;
        public static bool Vibration { get; set; } = true;
        public static float MusicVolume { get; set; } = 0.65f;
        public static float SfxVolume { get; set; } = 0.8f;

        public static void HapticPulse()
        {
#if UNITY_ANDROID || UNITY_IOS
            if (Vibration && Application.isMobilePlatform) Handheld.Vibrate();
#endif
        }
    }

    public static class CrownProfileStore
    {
        private const string ProfileKey = "crown_front.profile.v1";
        private const string SettingsKey = "crown_front.settings.v1";

        public static CrownPlayerProfile LoadProfile()
        {
            CrownPlayerProfile profile = null;
            string json = PlayerPrefs.GetString(ProfileKey, string.Empty);
            if (!string.IsNullOrEmpty(json))
            {
                try { profile = JsonUtility.FromJson<CrownPlayerProfile>(json); }
                catch (Exception exception) { Debug.LogWarning($"CROWN//FRONT profile recovery: {exception.Message}"); }
            }
            profile ??= new CrownPlayerProfile();
            profile.RepairOptionalFields();
            return profile;
        }

        public static void SaveProfile(CrownPlayerProfile profile)
        {
            if (profile == null) throw new ArgumentNullException(nameof(profile));
            profile.RepairOptionalFields();
            PlayerPrefs.SetString(ProfileKey, JsonUtility.ToJson(profile));
            PlayerPrefs.Save();
        }

        public static CrownUserSettings LoadSettings()
        {
            CrownUserSettings settings = null;
            string json = PlayerPrefs.GetString(SettingsKey, string.Empty);
            if (!string.IsNullOrEmpty(json))
            {
                try { settings = JsonUtility.FromJson<CrownUserSettings>(json); }
                catch (Exception exception) { Debug.LogWarning($"CROWN//FRONT settings recovery: {exception.Message}"); }
            }
            settings ??= new CrownUserSettings();
            settings.Clamp();
            return settings;
        }

        public static void SaveSettings(CrownUserSettings settings)
        {
            if (settings == null) throw new ArgumentNullException(nameof(settings));
            settings.Clamp();
            PlayerPrefs.SetString(SettingsKey, JsonUtility.ToJson(settings));
            PlayerPrefs.Save();
        }

        public static void ResetAll()
        {
            PlayerPrefs.DeleteKey(ProfileKey);
            PlayerPrefs.DeleteKey(SettingsKey);
            PlayerPrefs.Save();
        }
    }

    [Serializable]
    public sealed class CrownMatchSummary
    {
        public string resultId;
        public bool victory;
        public float duration;
        public float survivingCoreHealth;
        public int towersDestroyed;
        public int unitsDeployed;
        public float damageDealt;
        public int xpEarned;
        public int coinsEarned;

        public static CrownMatchSummary Create(bool victory, float duration, float coreHealth, int towers, int units, float damage, int sequence)
        {
            return new CrownMatchSummary
            {
                resultId = $"local-{sequence}-{Mathf.RoundToInt(duration * 1000f)}-{(victory ? 1 : 0)}",
                victory = victory,
                duration = Mathf.Max(0f, duration),
                survivingCoreHealth = Mathf.Max(0f, coreHealth),
                towersDestroyed = Mathf.Max(0, towers),
                unitsDeployed = Mathf.Max(0, units),
                damageDealt = Mathf.Max(0f, damage),
                xpEarned = victory ? 120 : 55,
                coinsEarned = victory ? 85 : 35
            };
        }
    }
}
