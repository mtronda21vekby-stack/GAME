using System.Collections;
using CrownFront.Cloud;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;

namespace CrownFront.Tests.PlayMode
{
    public sealed class CrownMenuBakedBattlePlayModeTests
    {
        private GameObject _root;
        private CrownAppFlowController _flow;

        [UnitySetUp]
        public IEnumerator SetUp()
        {
            _root = new GameObject("TEST CROWN APP");
            _root.SetActive(false);
            _flow = _root.AddComponent<CrownAppFlowController>();
            GameObject gameplay = new GameObject("CrownEngineGame");
            gameplay.transform.SetParent(_root.transform, false);
            gameplay.AddComponent<CrownEngineGame>();
            _root.SetActive(true);
            yield return null;
        }

        [UnityTearDown]
        public IEnumerator TearDown()
        {
            if (_root != null) Object.Destroy(_root);
            UnityEngine.EventSystems.EventSystem eventSystem = Object.FindAnyObjectByType<UnityEngine.EventSystems.EventSystem>();
            if (eventSystem != null) Object.Destroy(eventSystem.gameObject);
            yield return null;
        }

        [UnityTest]
        public IEnumerator MainMenuAndDeckBuilderOpenAndDeckSaves()
        {
            Assert.That(_flow.CurrentScreen, Is.EqualTo(CrownAppScreen.MainMenu));
            _flow.ShowDeckBuilder();
            Assert.That(_flow.CurrentScreen, Is.EqualTo(CrownAppScreen.DeckBuilder));
            Assert.That(_flow.SaveDeck(CrownUnitCatalog.CreateDefaultDeck()), Is.True);
            yield return null;
        }

        [UnityTest]
        public IEnumerator StartBattleUsesSelectedDeckAndOpensResults()
        {
            _flow.StartBattle();
            yield return null;
            yield return null;
            yield return null;
            yield return null;
            Assert.That(_flow.CurrentScreen, Is.EqualTo(CrownAppScreen.Battle));
            Assert.That(_flow.Game.SessionActive, Is.True);
            Assert.That(_flow.Game.Units.Count, Is.EqualTo(2));
            _flow.CompleteMatchForReview(true);
            Assert.That(_flow.CurrentScreen, Is.EqualTo(CrownAppScreen.Results));
            Assert.That(_flow.LastSummary.victory, Is.True);
        }

        [UnityTest]
        public IEnumerator ReturnToMenuAndPlayAgainDoNotDuplicateRoots()
        {
            _flow.ShowBattleForReview();
            _flow.CompleteMatchForReview(false);
            _flow.ShowMainMenu();
            Assert.That(_flow.CurrentScreen, Is.EqualTo(CrownAppScreen.MainMenu));
            _flow.ShowBattleForReview();
            _flow.CompleteMatchForReview(true);
            _flow.PlayAgain();
            yield return null;
            yield return null;
            yield return null;
            yield return null;
            Assert.That(_flow.GameplayRootCount, Is.EqualTo(1));
            Assert.That(_flow.CurrentScreen, Is.EqualTo(CrownAppScreen.Battle));
        }

        [UnityTest]
        public IEnumerator SettingsPersist()
        {
            _flow.SetFpsCap(30);
            _flow.SetQuality(0);
            _flow.SetVibration(false);
            CrownUserSettings loaded = CrownProfileStore.LoadSettings();
            Assert.That(loaded.fpsCap, Is.EqualTo(30));
            Assert.That(loaded.quality, Is.EqualTo(0));
            Assert.That(loaded.vibration, Is.False);
            yield return null;
        }
    }
}
