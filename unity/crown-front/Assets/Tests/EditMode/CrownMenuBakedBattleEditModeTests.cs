using System;
using CrownFront.Cloud;
using NUnit.Framework;
using UnityEditor;
using UnityEngine;

namespace CrownFront.Tests.EditMode
{
    public sealed class CrownMenuBakedBattleEditModeTests
    {
        private const string ProfileKey = "crown_front.profile.v1";
        private string _profileBackup;

        [SetUp]
        public void SetUp()
        {
            _profileBackup = PlayerPrefs.GetString(ProfileKey, string.Empty);
            CrownUnitCatalog.ClearCacheForTests();
        }

        [TearDown]
        public void TearDown()
        {
            if (string.IsNullOrEmpty(_profileBackup)) PlayerPrefs.DeleteKey(ProfileKey);
            else PlayerPrefs.SetString(ProfileKey, _profileBackup);
            PlayerPrefs.Save();
        }

        [Test]
        public void ValidDeckRequiresFourUniqueExistingUnits()
        {
            string[] deck = CrownUnitCatalog.CreateDefaultDeck();
            Assert.That(CrownUnitCatalog.IsValidDeck(deck), Is.True);
            Assert.That(CrownUnitCatalog.AverageCost(deck), Is.EqualTo(3f).Within(0.001f));
        }

        [Test]
        public void InvalidIdsAreRejected()
        {
            Assert.That(CrownUnitCatalog.IsValidDeck(new[] { CrownUnitCatalog.AssaultId, CrownUnitCatalog.TankId, CrownUnitCatalog.RaiderId, "unit.missing" }), Is.False);
        }

        [Test]
        public void DuplicateUnitsAreRejected()
        {
            Assert.That(CrownUnitCatalog.IsValidDeck(new[] { CrownUnitCatalog.AssaultId, CrownUnitCatalog.TankId, CrownUnitCatalog.RaiderId, CrownUnitCatalog.AssaultId }), Is.False);
        }

        [Test]
        public void ProfileRoundTripsWithoutResettingOptionalProgress()
        {
            CrownPlayerProfile profile = new CrownPlayerProfile { playerName = "TEST PILOT", currentXp = 73, coins = 842 };
            CrownProfileStore.SaveProfile(profile);
            CrownPlayerProfile loaded = CrownProfileStore.LoadProfile();
            Assert.That(loaded.playerName, Is.EqualTo("TEST PILOT"));
            Assert.That(loaded.currentXp, Is.EqualTo(73));
            Assert.That(loaded.coins, Is.EqualTo(842));
            Assert.That(CrownUnitCatalog.IsValidDeck(loaded.selectedDeck), Is.True);
        }

        [Test]
        public void XpCalculationCanAdvanceMultipleLevels()
        {
            CrownPlayerProfile profile = new CrownPlayerProfile();
            int firstRequirement = profile.xpNeeded;
            profile.AddProgress(firstRequirement + CrownPlayerProfile.XpForLevel(2) + 15, 0);
            Assert.That(profile.playerLevel, Is.EqualTo(3));
            Assert.That(profile.currentXp, Is.EqualTo(15));
        }

        [Test]
        public void MatchRewardCanOnlyBeClaimedOnce()
        {
            CrownPlayerProfile profile = new CrownPlayerProfile();
            CrownMatchSummary summary = CrownMatchSummary.Create(true, 120f, 1250f, 2, 8, 2200f, 9);
            Assert.That(profile.HasClaimed(summary.resultId), Is.False);
            profile.AddProgress(summary.xpEarned, summary.coinsEarned);
            profile.MarkClaimed(summary.resultId);
            int coins = profile.coins;
            if (!profile.HasClaimed(summary.resultId)) profile.AddProgress(summary.xpEarned, summary.coinsEarned);
            Assert.That(profile.coins, Is.EqualTo(coins));
        }

        [Test]
        public void BakedLayersAreAlignedSprites()
        {
            foreach (string name in CrownBakedArenaRuntime.LayerNames)
            {
                string path = $"Assets/Resources/CrownBakedArena/{name}.png";
                Texture2D texture = AssetDatabase.LoadAssetAtPath<Texture2D>(path);
                TextureImporter importer = AssetImporter.GetAtPath(path) as TextureImporter;
                Assert.That(texture, Is.Not.Null, path);
                Assert.That(texture.width, Is.EqualTo(1080), path);
                Assert.That(texture.height, Is.EqualTo(1920), path);
                Assert.That(importer, Is.Not.Null, path);
                Assert.That(importer.textureType, Is.EqualTo(TextureImporterType.Sprite), path);
                Assert.That(importer.mipmapEnabled, Is.False, path);
            }
        }

        [Test]
        public void VersionIsConsistentWithPlayerSettings()
        {
            Assert.That(PlayerSettings.bundleVersion, Is.EqualTo(CrownBuildInfo.Version));
        }
    }
}
