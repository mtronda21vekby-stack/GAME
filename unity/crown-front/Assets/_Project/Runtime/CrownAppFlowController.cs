using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace CrownFront.Cloud
{
    [DefaultExecutionOrder(-100)]
    public sealed class CrownAppFlowController : MonoBehaviour
    {
        private static CrownAppFlowController _instance;
        private CrownEngineGame _game;
        private CrownAppUI _ui;
        private CrownPlayerProfile _profile;
        private CrownUserSettings _settings;
        private CrownMatchSummary _lastSummary;
        private bool _transitioning;
        private bool _rewardApplied;
        private CrownAppScreen _currentScreen;

        public CrownAppScreen CurrentScreen => _currentScreen;
        public CrownPlayerProfile Profile => _profile;
        public CrownUserSettings Settings => _settings;
        public CrownMatchSummary LastSummary => _lastSummary;
        public CrownEngineGame Game => _game;
        public int GameplayRootCount => FindObjectsByType<CrownEngineGame>(FindObjectsInactive.Include).Length;

        private void Awake()
        {
            if (_instance != null && _instance != this)
            {
                Destroy(gameObject);
                return;
            }

            _instance = this;
            Screen.orientation = ScreenOrientation.Portrait;
            Input.multiTouchEnabled = true;
            _profile = CrownProfileStore.LoadProfile();
            _settings = CrownProfileStore.LoadSettings();
            _settings.Apply();
            _game = GetComponentInChildren<CrownEngineGame>(true);
            if (_game == null) throw new InvalidOperationException("CrownAppFlowController requires exactly one CrownEngineGame child.");
            _game.MatchEnded += HandleMatchEnded;
            _ui = gameObject.AddComponent<CrownAppUI>();
            _ui.Build(this);
        }

        private void Start()
        {
            ShowMainMenu();
        }

        private void OnDestroy()
        {
            if (_game != null) _game.MatchEnded -= HandleMatchEnded;
            if (_instance == this) _instance = null;
        }

        private void OnApplicationPause(bool paused)
        {
            if (_currentScreen != CrownAppScreen.Battle) return;
            _game.SetSessionPaused(paused);
            _ui.SetResumeShield(paused);
        }

        private void OnApplicationFocus(bool focused)
        {
            if (_currentScreen == CrownAppScreen.Battle && focused)
            {
                _game.SetSessionPaused(false);
                _ui.SetResumeShield(false);
            }
        }

        public void ShowMainMenu()
        {
            if (_transitioning) return;
            _game.EndSession();
            _currentScreen = CrownAppScreen.MainMenu;
            _ui.Show(_currentScreen, _profile, _settings, _lastSummary);
        }

        public void ShowDeckBuilder()
        {
            if (_transitioning || _currentScreen == CrownAppScreen.Battle) return;
            _currentScreen = CrownAppScreen.DeckBuilder;
            _ui.Show(_currentScreen, _profile, _settings, _lastSummary);
        }

        public void ShowCollection()
        {
            if (_transitioning || _currentScreen == CrownAppScreen.Battle) return;
            _currentScreen = CrownAppScreen.Collection;
            _ui.Show(_currentScreen, _profile, _settings, _lastSummary);
        }

        public void ShowSettings()
        {
            if (_transitioning || _currentScreen == CrownAppScreen.Battle) return;
            _currentScreen = CrownAppScreen.Settings;
            _ui.Show(_currentScreen, _profile, _settings, _lastSummary);
        }

        public bool SaveDeck(IReadOnlyList<string> ids)
        {
            if (!CrownUnitCatalog.IsValidDeck(ids))
            {
                _ui.ShowToast("НУЖНЫ ЧЕТЫРЕ УНИКАЛЬНЫХ ОТРЯДА");
                return false;
            }

            for (int i = 0; i < ids.Count; i++)
            {
                if (!_profile.IsUnlocked(ids[i]))
                {
                    _ui.ShowToast("ЗАБЛОКИРОВАННЫЙ ОТРЯД НЕЛЬЗЯ ДОБАВИТЬ");
                    return false;
                }
            }

            _profile.selectedDeck = new string[ids.Count];
            for (int i = 0; i < ids.Count; i++) _profile.selectedDeck[i] = ids[i];
            CrownProfileStore.SaveProfile(_profile);
            _ui.ShowToast("КОЛОДА СОХРАНЕНА");
            return true;
        }

        public void StartBattle()
        {
            if (_transitioning) return;
            if (!CrownUnitCatalog.IsValidDeck(_profile.selectedDeck))
            {
                _ui.ShowToast("СОБЕРИТЕ ПОЛНУЮ КОЛОДУ");
                ShowDeckBuilder();
                return;
            }
            if (string.IsNullOrWhiteSpace(_profile.selectedCoreId))
            {
                _ui.ShowToast("ВЫБЕРИТЕ CORE");
                return;
            }
            StartCoroutine(StartBattleRoutine());
        }

        private IEnumerator StartBattleRoutine()
        {
            _transitioning = true;
            _profile.matchSequence++;
            CrownProfileStore.SaveProfile(_profile);
            _ui.ShowLoading("СИНХРОНИЗАЦИЯ CROWN ENGINE", 0.18f);
            yield return null;
            _ui.ShowLoading("ПОДГОТОВКА ПАЛУБЫ", 0.52f);
            yield return null;
            _ui.ShowLoading("ОТРЯДЫ ГОТОВЫ", 0.86f);
            yield return null;

            CrownUnitKind[] deck = new CrownUnitKind[4];
            for (int i = 0; i < deck.Length; i++)
            {
                if (!CrownUnitCatalog.TryGetKind(_profile.selectedDeck[i], out deck[i]))
                {
                    _transitioning = false;
                    _ui.HideLoading();
                    ShowDeckBuilder();
                    yield break;
                }
            }

            _lastSummary = null;
            _rewardApplied = false;
            _game.StartMatch(deck, _profile.matchSequence);
            _currentScreen = CrownAppScreen.Battle;
            _ui.HideLoading();
            _ui.Show(_currentScreen, _profile, _settings, null);
            _transitioning = false;
        }

        private void HandleMatchEnded(CrownMatchSummary summary)
        {
            _lastSummary = summary;
            if (!_rewardApplied && !_profile.HasClaimed(summary.resultId))
            {
                _profile.AddProgress(summary.xpEarned, summary.coinsEarned);
                _profile.MarkClaimed(summary.resultId);
                CrownProfileStore.SaveProfile(_profile);
                _rewardApplied = true;
            }
            _currentScreen = CrownAppScreen.Results;
            _ui.Show(_currentScreen, _profile, _settings, _lastSummary);
        }

        public void PlayAgain()
        {
            if (_currentScreen != CrownAppScreen.Results || _transitioning) return;
            StartBattle();
        }

        public void SelectBattleUnit(CrownUnitKind kind)
        {
            if (_currentScreen != CrownAppScreen.Battle) return;
            _game.SelectUnit(kind);
            _ui.RefreshBattleHud(_game);
        }

        public void SaveAndApplySettings()
        {
            _settings.Apply();
            CrownProfileStore.SaveSettings(_settings);
            _ui.RefreshSettings(_settings);
        }

        public void ResetTutorial()
        {
            _settings.tutorialComplete = false;
            CrownProfileStore.SaveSettings(_settings);
            _ui.ShowToast("ОБУЧЕНИЕ БУДЕТ ПОКАЗАНО СНОВА");
        }

        public void ResetProgressConfirmed()
        {
            CrownProfileStore.ResetAll();
            _profile = CrownProfileStore.LoadProfile();
            _settings = CrownProfileStore.LoadSettings();
            _settings.Apply();
            _ui.ShowToast("ЛОКАЛЬНЫЙ ПРОГРЕСС СБРОШЕН");
            ShowMainMenu();
        }

        public void SetMasterVolume(float value) { _settings.masterVolume = value; SaveAndApplySettings(); }
        public void SetMusicVolume(float value) { _settings.musicVolume = value; SaveAndApplySettings(); }
        public void SetSfxVolume(float value) { _settings.sfxVolume = value; SaveAndApplySettings(); }
        public void SetVibration(bool value) { _settings.vibration = value; SaveAndApplySettings(); }
        public void SetVfxIntensity(int value) { _settings.vfxIntensity = value; SaveAndApplySettings(); }
        public void SetQuality(int value) { _settings.quality = value; SaveAndApplySettings(); }
        public void SetFpsCap(int value) { _settings.fpsCap = value; SaveAndApplySettings(); }

#if UNITY_EDITOR
        public void ShowBattleForReview()
        {
            CrownUnitKind[] deck = new CrownUnitKind[4];
            for (int i = 0; i < deck.Length; i++) CrownUnitCatalog.TryGetKind(_profile.selectedDeck[i], out deck[i]);
            _profile.matchSequence++;
            _game.StartMatch(deck, _profile.matchSequence);
            _currentScreen = CrownAppScreen.Battle;
            _ui.Show(_currentScreen, _profile, _settings, null);
        }

        public void CompleteMatchForReview(bool victory)
        {
            if (_currentScreen != CrownAppScreen.Battle) return;
            _game.CompleteMatchForReview(victory);
        }
#endif
    }
}
