using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace CrownFront.Cloud
{
    public sealed class CrownAppUI : MonoBehaviour
    {
        private static readonly Color Ink = new Color(0.012f, 0.022f, 0.038f, 0.97f);
        private static readonly Color Glass = new Color(0.025f, 0.055f, 0.082f, 0.92f);
        private static readonly Color Steel = new Color(0.13f, 0.19f, 0.24f, 0.96f);
        private static readonly Color Cyan = new Color(0.02f, 0.78f, 1f, 1f);
        private static readonly Color White = new Color(0.86f, 0.93f, 0.98f, 1f);
        private static readonly Color Muted = new Color(0.43f, 0.55f, 0.63f, 1f);
        private static readonly Color Orange = new Color(1f, 0.25f, 0.025f, 1f);

        private CrownAppFlowController _flow;
        private Canvas _canvas;
        private RectTransform _safeArea;
        private readonly Dictionary<CrownAppScreen, GameObject> _screens = new Dictionary<CrownAppScreen, GameObject>();
        private readonly List<string> _workingDeck = new List<string>(4);
        private readonly List<Button> _battleCards = new List<Button>(4);
        private readonly List<Text> _battleCardLabels = new List<Text>(4);
        private GameObject _loading;
        private Text _loadingLabel;
        private Slider _loadingProgress;
        private GameObject _toast;
        private Text _toastText;
        private float _toastUntil;
        private GameObject _resumeShield;
        private Text _battleBlueHp;
        private Text _battleRedHp;
        private Text _battleTimer;
        private Text _battleEnergy;
        private Text _settingsSummary;
        private Text _deckAverage;
        private RectTransform _deckGrid;
        private RectTransform _deckSlots;
        private float _nextBattleRefresh;

        public Canvas RootCanvas => _canvas;

        public void Build(CrownAppFlowController flow)
        {
            _flow = flow;
            EnsureEventSystem();

            GameObject canvasObject = new GameObject("CrownApplicationCanvas", typeof(RectTransform), typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            canvasObject.transform.SetParent(transform, false);
            _canvas = canvasObject.GetComponent<Canvas>();
            _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            _canvas.sortingOrder = 50;
            CanvasScaler scaler = canvasObject.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1080f, 1920f);
            scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
            scaler.matchWidthOrHeight = 0.5f;

            GameObject safeObject = new GameObject("SafeAreaRoot", typeof(RectTransform), typeof(CrownSafeArea));
            safeObject.transform.SetParent(canvasObject.transform, false);
            _safeArea = safeObject.GetComponent<RectTransform>();
            Stretch(_safeArea);

            BuildMainMenu();
            BuildDeckBuilder();
            BuildCollection();
            BuildSettings();
            BuildBattleHud();
            BuildResults();
            BuildOverlays(canvasObject.transform);
        }

        private void Update()
        {
            if (_toast != null && _toast.activeSelf && Time.unscaledTime >= _toastUntil) _toast.SetActive(false);
            if (_flow != null && _flow.CurrentScreen == CrownAppScreen.Battle && Time.unscaledTime >= _nextBattleRefresh)
            {
                _nextBattleRefresh = Time.unscaledTime + 0.1f;
                RefreshBattleHud(_flow.Game);
            }
        }

        public void Show(CrownAppScreen screen, CrownPlayerProfile profile, CrownUserSettings settings, CrownMatchSummary summary)
        {
            foreach (KeyValuePair<CrownAppScreen, GameObject> pair in _screens) pair.Value.SetActive(pair.Key == screen);
            switch (screen)
            {
                case CrownAppScreen.MainMenu: RefreshMainMenu(profile); break;
                case CrownAppScreen.DeckBuilder: RefreshDeckBuilder(profile); break;
                case CrownAppScreen.Collection: RefreshCollection(profile); break;
                case CrownAppScreen.Settings: RefreshSettings(settings); break;
                case CrownAppScreen.Battle: RefreshBattleCards(profile); RefreshBattleHud(_flow.Game); break;
                case CrownAppScreen.Results: RefreshResults(summary); break;
            }
        }

        private void BuildMainMenu()
        {
            GameObject screen = Screen("MainMenuCanvas", CrownAppScreen.MainMenu, Ink);
            RectTransform top = Panel(screen.transform, "TopBar", new Vector2(0.035f, 0.855f), new Vector2(0.965f, 0.985f), Glass);
            Label(top, "PlayerProfile", "COMMANDER", new Vector2(0.035f, 0.5f), new Vector2(0.42f, 0.92f), 32, TextAnchor.MiddleLeft, White, FontStyle.Bold);
            Label(top, "PlayerLevel", "LEVEL 1", new Vector2(0.035f, 0.12f), new Vector2(0.25f, 0.5f), 22, TextAnchor.MiddleLeft, Cyan);
            RectTransform xpBack = Panel(top, "ExperienceBar", new Vector2(0.26f, 0.18f), new Vector2(0.66f, 0.36f), Steel);
            Panel(xpBack, "ExperienceFill", Vector2.zero, new Vector2(0.35f, 1f), Cyan);
            Label(top, "Coins", "◈ 500", new Vector2(0.68f, 0.18f), new Vector2(0.86f, 0.65f), 26, TextAnchor.MiddleRight, White, FontStyle.Bold);
            Button(top, "SettingsButton", "SET", new Vector2(0.875f, 0.18f), new Vector2(0.965f, 0.78f), _flow.ShowSettings, Steel, 16);

            RectTransform hero = Panel(screen.transform, "HeroArenaPreview", new Vector2(0.035f, 0.46f), new Vector2(0.965f, 0.84f), new Color(0.006f, 0.014f, 0.026f, 1f));
            AddArenaPreview(hero);
            Label(hero, "Title", "CROWN//FRONT", new Vector2(0.05f, 0.76f), new Vector2(0.95f, 0.94f), 58, TextAnchor.MiddleCenter, White, FontStyle.Bold);
            Label(hero, "Tagline", "BATTLE ON THE LIVING CROWN ENGINE", new Vector2(0.08f, 0.67f), new Vector2(0.92f, 0.76f), 20, TextAnchor.MiddleCenter, Cyan);
            Label(hero, "Version", CrownBuildInfo.Version, new Vector2(0.05f, 0.04f), new Vector2(0.95f, 0.12f), 17, TextAnchor.MiddleRight, Muted);

            RectTransform deck = Panel(screen.transform, "CurrentDeckPanel", new Vector2(0.035f, 0.27f), new Vector2(0.72f, 0.445f), Glass);
            Label(deck, "DeckTitle", "ТЕКУЩАЯ КОЛОДА", new Vector2(0.04f, 0.73f), new Vector2(0.96f, 0.95f), 22, TextAnchor.MiddleLeft, Cyan, FontStyle.Bold);
            for (int i = 0; i < 4; i++)
            {
                float x0 = 0.035f + i * 0.242f;
                RectTransform slot = Panel(deck, $"DeckSlot{i + 1}", new Vector2(x0, 0.12f), new Vector2(x0 + 0.205f, 0.69f), Steel);
                Label(slot, "Label", "UNIT", Vector2.zero, Vector2.one, 16, TextAnchor.MiddleCenter, White, FontStyle.Bold);
            }

            RectTransform core = Panel(screen.transform, "SelectedCorePanel", new Vector2(0.735f, 0.27f), new Vector2(0.965f, 0.445f), Glass);
            Label(core, "CoreTitle", "ACTIVE CORE", new Vector2(0.05f, 0.74f), new Vector2(0.95f, 0.95f), 18, TextAnchor.MiddleCenter, Cyan, FontStyle.Bold);
            Label(core, "CoreGlyph", "♛", new Vector2(0.1f, 0.25f), new Vector2(0.9f, 0.75f), 54, TextAnchor.MiddleCenter, White);
            Label(core, "CoreId", "CROWN CORE", new Vector2(0.05f, 0.07f), new Vector2(0.95f, 0.26f), 16, TextAnchor.MiddleCenter, Muted);

            Button(screen.transform, "PlayButton", "В БОЙ", new Vector2(0.12f, 0.14f), new Vector2(0.88f, 0.255f), _flow.StartBattle, Cyan, 42);
            BuildBottomNavigation(screen.transform, CrownAppScreen.MainMenu);
        }

        private void BuildDeckBuilder()
        {
            GameObject screen = Screen("DeckBuilderCanvas", CrownAppScreen.DeckBuilder, Ink);
            RectTransform header = Panel(screen.transform, "Header", new Vector2(0.035f, 0.88f), new Vector2(0.965f, 0.985f), Glass);
            Button(header, "BackButton", "‹", new Vector2(0.02f, 0.16f), new Vector2(0.14f, 0.84f), _flow.ShowMainMenu, Steel, 42);
            Label(header, "Title", "КОЛОДА // 4 ОТРЯДА", new Vector2(0.17f, 0.15f), new Vector2(0.98f, 0.85f), 30, TextAnchor.MiddleLeft, White, FontStyle.Bold);

            _deckGrid = Panel(screen.transform, "AvailableUnitsGrid", new Vector2(0.035f, 0.41f), new Vector2(0.965f, 0.86f), new Color(0.012f, 0.03f, 0.05f, 0.72f));
            Label(_deckGrid, "GridTitle", "ДОСТУПНЫЕ ЮНИТЫ", new Vector2(0.035f, 0.88f), new Vector2(0.96f, 0.98f), 21, TextAnchor.MiddleLeft, Cyan, FontStyle.Bold);

            _deckSlots = Panel(screen.transform, "CurrentDeckSlots", new Vector2(0.035f, 0.23f), new Vector2(0.965f, 0.39f), Glass);
            Label(_deckSlots, "SlotsTitle", "ВЫБРАНО", new Vector2(0.035f, 0.76f), new Vector2(0.5f, 0.98f), 20, TextAnchor.MiddleLeft, Cyan, FontStyle.Bold);
            _deckAverage = Label(_deckSlots, "AverageEnergyCost", "СРЕДНЯЯ ЭНЕРГИЯ —", new Vector2(0.45f, 0.76f), new Vector2(0.965f, 0.98f), 19, TextAnchor.MiddleRight, White);

            Button(screen.transform, "SaveDeckButton", "СОХРАНИТЬ КОЛОДУ", new Vector2(0.15f, 0.105f), new Vector2(0.85f, 0.205f), SaveWorkingDeck, Cyan, 30);
            BuildBottomNavigation(screen.transform, CrownAppScreen.DeckBuilder);
        }

        private void BuildCollection()
        {
            GameObject screen = Screen("CollectionCanvas", CrownAppScreen.Collection, Ink);
            RectTransform header = Panel(screen.transform, "Header", new Vector2(0.035f, 0.88f), new Vector2(0.965f, 0.985f), Glass);
            Button(header, "BackButton", "‹", new Vector2(0.02f, 0.16f), new Vector2(0.14f, 0.84f), _flow.ShowMainMenu, Steel, 42);
            Label(header, "Title", "ЮНИТЫ", new Vector2(0.17f, 0.15f), new Vector2(0.98f, 0.85f), 32, TextAnchor.MiddleLeft, White, FontStyle.Bold);
            Panel(screen.transform, "UnitCollection", new Vector2(0.035f, 0.12f), new Vector2(0.965f, 0.86f), new Color(0.012f, 0.03f, 0.05f, 0.78f));
            BuildBottomNavigation(screen.transform, CrownAppScreen.Collection);
        }

        private void BuildSettings()
        {
            GameObject screen = Screen("SettingsCanvas", CrownAppScreen.Settings, Ink);
            RectTransform header = Panel(screen.transform, "Header", new Vector2(0.035f, 0.88f), new Vector2(0.965f, 0.985f), Glass);
            Button(header, "BackButton", "‹", new Vector2(0.02f, 0.16f), new Vector2(0.14f, 0.84f), _flow.ShowMainMenu, Steel, 42);
            Label(header, "Title", "НАСТРОЙКИ", new Vector2(0.17f, 0.15f), new Vector2(0.98f, 0.85f), 32, TextAnchor.MiddleLeft, White, FontStyle.Bold);
            RectTransform body = Panel(screen.transform, "SettingsPanel", new Vector2(0.06f, 0.18f), new Vector2(0.94f, 0.85f), Glass);
            BuildSlider(body, "Master Volume", 0.82f, value => _flow.SetMasterVolume(value));
            BuildSlider(body, "Music Volume", 0.69f, value => _flow.SetMusicVolume(value));
            BuildSlider(body, "SFX Volume", 0.56f, value => _flow.SetSfxVolume(value));
            BuildToggle(body, "Vibration", 0.43f, value => _flow.SetVibration(value));
            Button(body, "VfxButton", "VFX INTENSITY", new Vector2(0.06f, 0.31f), new Vector2(0.94f, 0.39f), CycleVfx, Steel, 22);
            Button(body, "QualityButton", "QUALITY", new Vector2(0.06f, 0.21f), new Vector2(0.94f, 0.29f), CycleQuality, Steel, 22);
            Button(body, "FpsButton", "FPS CAP", new Vector2(0.06f, 0.11f), new Vector2(0.48f, 0.19f), CycleFps, Steel, 21);
            Button(body, "ResetTutorial", "RESET TUTORIAL", new Vector2(0.52f, 0.11f), new Vector2(0.94f, 0.19f), _flow.ResetTutorial, Steel, 18);
            Button(body, "ResetProgress", "СБРОСИТЬ ПРОГРЕСС", new Vector2(0.06f, 0.015f), new Vector2(0.94f, 0.085f), ConfirmReset, new Color(0.34f, 0.07f, 0.06f, 1f), 20);
            _settingsSummary = Label(body, "SettingsSummary", string.Empty, new Vector2(0.06f, 0.9f), new Vector2(0.94f, 0.98f), 18, TextAnchor.MiddleCenter, Cyan);
            BuildBottomNavigation(screen.transform, CrownAppScreen.Settings);
        }

        private void BuildBattleHud()
        {
            GameObject screen = Screen("BattleCanvas", CrownAppScreen.Battle, Color.clear);
            Image background = screen.GetComponent<Image>();
            background.raycastTarget = false;
            RectTransform top = Panel(screen.transform, "UpperHud", new Vector2(0.025f, 0.885f), new Vector2(0.975f, 0.985f), new Color(0.008f, 0.02f, 0.035f, 0.88f));
            _battleBlueHp = Label(top, "BlueCoreHp", "BLUE 3200", new Vector2(0.03f, 0.13f), new Vector2(0.34f, 0.87f), 23, TextAnchor.MiddleLeft, Cyan, FontStyle.Bold);
            _battleTimer = Label(top, "Timer", "03:00", new Vector2(0.37f, 0.13f), new Vector2(0.63f, 0.87f), 31, TextAnchor.MiddleCenter, White, FontStyle.Bold);
            _battleRedHp = Label(top, "RedCoreHp", "RED 3200", new Vector2(0.66f, 0.13f), new Vector2(0.91f, 0.87f), 23, TextAnchor.MiddleRight, Orange, FontStyle.Bold);
            Button(top, "Pause", "Ⅱ", new Vector2(0.92f, 0.15f), new Vector2(0.985f, 0.85f), ToggleBattlePause, Steel, 20);

            RectTransform bottom = Panel(screen.transform, "LowerHud", new Vector2(0.025f, 0.015f), new Vector2(0.975f, 0.16f), new Color(0.008f, 0.02f, 0.035f, 0.92f));
            _battleEnergy = Label(bottom, "Energy", "ENERGY 6/10", new Vector2(0.025f, 0.72f), new Vector2(0.3f, 0.98f), 19, TextAnchor.MiddleLeft, Cyan, FontStyle.Bold);
            Label(bottom, "Hint", "ВЫБЕРИТЕ ОТРЯД • НАЖМИТЕ НА ЛИНИЮ", new Vector2(0.31f, 0.74f), new Vector2(0.98f, 0.98f), 16, TextAnchor.MiddleRight, Muted);
            for (int i = 0; i < 4; i++)
            {
                int index = i;
                float x0 = 0.02f + i * 0.245f;
                Button card = Button(bottom, $"DeckCard{i + 1}", "UNIT", new Vector2(x0, 0.06f), new Vector2(x0 + 0.225f, 0.68f), () => SelectBattleCard(index), Steel, 16);
                _battleCards.Add(card);
                _battleCardLabels.Add(card.GetComponentInChildren<Text>());
            }

            _resumeShield = Panel(screen.transform, "ResumeShield", Vector2.zero, Vector2.one, new Color(0f, 0f, 0f, 0.82f)).gameObject;
            Label(_resumeShield.transform, "ResumeText", "ПАУЗА\nВОЗВРАЩЕНИЕ В CROWN ENGINE…", new Vector2(0.1f, 0.42f), new Vector2(0.9f, 0.58f), 30, TextAnchor.MiddleCenter, White, FontStyle.Bold);
            _resumeShield.SetActive(false);
        }

        private void BuildResults()
        {
            GameObject screen = Screen("ResultsCanvas", CrownAppScreen.Results, new Color(0.006f, 0.014f, 0.024f, 0.98f));
            RectTransform panel = Panel(screen.transform, "ResultPanel", new Vector2(0.08f, 0.18f), new Vector2(0.92f, 0.84f), Glass);
            Label(panel, "ResultTitle", "VICTORY", new Vector2(0.05f, 0.76f), new Vector2(0.95f, 0.95f), 58, TextAnchor.MiddleCenter, Cyan, FontStyle.Bold);
            Label(panel, "ResultStats", string.Empty, new Vector2(0.08f, 0.31f), new Vector2(0.92f, 0.75f), 23, TextAnchor.MiddleLeft, White);
            Label(panel, "Rewards", string.Empty, new Vector2(0.08f, 0.22f), new Vector2(0.92f, 0.32f), 25, TextAnchor.MiddleCenter, Cyan, FontStyle.Bold);
            Button(panel, "PlayAgain", "СЫГРАТЬ ЕЩЁ", new Vector2(0.08f, 0.105f), new Vector2(0.92f, 0.205f), _flow.PlayAgain, Cyan, 27);
            Button(panel, "MainMenu", "В ГЛАВНОЕ МЕНЮ", new Vector2(0.08f, 0.015f), new Vector2(0.92f, 0.09f), _flow.ShowMainMenu, Steel, 22);
            Label(screen.transform, "Version", CrownBuildInfo.Version, new Vector2(0.05f, 0.04f), new Vector2(0.95f, 0.08f), 16, TextAnchor.MiddleCenter, Muted);
        }

        private void BuildOverlays(Transform canvas)
        {
            _loading = Panel(canvas, "LoadingPanel", Vector2.zero, Vector2.one, new Color(0.003f, 0.009f, 0.018f, 0.99f)).gameObject;
            Label(_loading.transform, "Logo", "CROWN//FRONT", new Vector2(0.1f, 0.56f), new Vector2(0.9f, 0.68f), 52, TextAnchor.MiddleCenter, White, FontStyle.Bold);
            _loadingLabel = Label(_loading.transform, "LoadingStatus", "ПОДГОТОВКА", new Vector2(0.1f, 0.45f), new Vector2(0.9f, 0.53f), 22, TextAnchor.MiddleCenter, Cyan);
            _loadingProgress = CreateSlider(_loading.transform, "LoadingProgress", new Vector2(0.18f, 0.4f), new Vector2(0.82f, 0.43f));
            Label(_loading.transform, "Tip", "СИЛЬНАЯ КОЛОДА СОЧЕТАЕТ СКОРОСТЬ, ДАЛЬНОСТЬ И БРОНЮ", new Vector2(0.1f, 0.27f), new Vector2(0.9f, 0.36f), 17, TextAnchor.MiddleCenter, Muted);
            _loading.SetActive(false);

            _toast = Panel(canvas, "Toast", new Vector2(0.12f, 0.78f), new Vector2(0.88f, 0.84f), new Color(0.015f, 0.12f, 0.17f, 0.97f)).gameObject;
            _toastText = Label(_toast.transform, "ToastText", string.Empty, Vector2.zero, Vector2.one, 20, TextAnchor.MiddleCenter, White, FontStyle.Bold);
            _toast.SetActive(false);
        }

        private void RefreshMainMenu(CrownPlayerProfile profile)
        {
            Transform screen = _screens[CrownAppScreen.MainMenu].transform;
            FindText(screen, "PlayerProfile").text = profile.playerName.ToUpperInvariant();
            FindText(screen, "PlayerLevel").text = $"LEVEL {profile.playerLevel}";
            FindText(screen, "Coins").text = $"◈ {profile.coins}";
            RectTransform fill = screen.Find("TopBar/ExperienceBar/ExperienceFill") as RectTransform;
            if (fill != null) fill.anchorMax = new Vector2(Mathf.Clamp01(profile.currentXp / (float)Mathf.Max(1, profile.xpNeeded)), 1f);
            for (int i = 0; i < 4; i++)
            {
                CrownUnitDefinition definition = profile.selectedDeck != null && i < profile.selectedDeck.Length ? CrownUnitCatalog.Find(profile.selectedDeck[i]) : null;
                FindText(screen, $"DeckSlot{i + 1}").text = definition != null ? $"{definition.DisplayName}\n{definition.EnergyCost}⚡" : "EMPTY";
            }
        }

        private void RefreshDeckBuilder(CrownPlayerProfile profile)
        {
            _workingDeck.Clear();
            if (profile.selectedDeck != null) _workingDeck.AddRange(profile.selectedDeck);
            RebuildDeckUi(profile);
        }

        private void RebuildDeckUi(CrownPlayerProfile profile)
        {
            ClearDynamic(_deckGrid, "UnitCard");
            ClearDynamic(_deckSlots, "WorkingSlot");
            IReadOnlyList<CrownUnitDefinition> all = CrownUnitCatalog.All;
            for (int i = 0; i < all.Count; i++)
            {
                CrownUnitDefinition definition = all[i];
                int col = i % 2;
                int row = i / 2;
                float x0 = 0.035f + col * 0.485f;
                float y1 = 0.84f - row * 0.36f;
                float y0 = y1 - 0.31f;
                bool selected = _workingDeck.Contains(definition.Id);
                bool unlocked = profile.IsUnlocked(definition.Id);
                Button card = Button(_deckGrid, $"UnitCard_{definition.Id}", $"{definition.DisplayName}\n{definition.Role}  •  {definition.EnergyCost}⚡\nLV {definition.StartingLevel}", new Vector2(x0, y0), new Vector2(x0 + 0.445f, y1), () => ToggleDeckUnit(definition.Id), selected ? Cyan : unlocked ? Steel : new Color(0.12f, 0.13f, 0.14f, 1f), 18);
                card.interactable = unlocked;
                AddCardSilhouette(card.transform, definition.Kind);
            }
            for (int i = 0; i < 4; i++)
            {
                float x0 = 0.035f + i * 0.242f;
                CrownUnitDefinition definition = i < _workingDeck.Count ? CrownUnitCatalog.Find(_workingDeck[i]) : null;
                RectTransform slot = Panel(_deckSlots, $"WorkingSlot{i + 1}", new Vector2(x0, 0.1f), new Vector2(x0 + 0.205f, 0.7f), definition == null ? new Color(0.08f, 0.1f, 0.12f, 0.7f) : Steel);
                Label(slot, "Label", definition != null ? definition.DisplayName : "+", Vector2.zero, Vector2.one, 15, TextAnchor.MiddleCenter, definition != null ? White : Muted, FontStyle.Bold);
            }
            _deckAverage.text = CrownUnitCatalog.IsValidDeck(_workingDeck) ? $"СРЕДНЯЯ ЭНЕРГИЯ {CrownUnitCatalog.AverageCost(_workingDeck):0.0}" : $"ВЫБРАНО {_workingDeck.Count}/4";
        }

        private void ToggleDeckUnit(string id)
        {
            if (_workingDeck.Contains(id)) _workingDeck.Remove(id);
            else if (_workingDeck.Count < 4) _workingDeck.Add(id);
            else { ShowToast("СНАЧАЛА УБЕРИТЕ ОТРЯД ИЗ КОЛОДЫ"); return; }
            RebuildDeckUi(_flow.Profile);
        }

        private void SaveWorkingDeck()
        {
            if (_flow.SaveDeck(_workingDeck)) _flow.ShowMainMenu();
        }

        private void RefreshCollection(CrownPlayerProfile profile)
        {
            RectTransform collection = _screens[CrownAppScreen.Collection].transform.Find("UnitCollection") as RectTransform;
            ClearDynamic(collection, "CollectionCard");
            IReadOnlyList<CrownUnitDefinition> all = CrownUnitCatalog.All;
            for (int i = 0; i < all.Count; i++)
            {
                CrownUnitDefinition unit = all[i];
                float y1 = 0.94f - i * 0.22f;
                RectTransform card = Panel(collection, $"CollectionCard_{unit.Id}", new Vector2(0.04f, y1 - 0.19f), new Vector2(0.96f, y1), Steel);
                AddCardSilhouette(card, unit.Kind);
                string state = profile.IsUnlocked(unit.Id) ? "UNLOCKED" : "LOCKED";
                Label(card, "Name", $"{unit.DisplayName}  //  {unit.Role}", new Vector2(0.22f, 0.56f), new Vector2(0.95f, 0.9f), 21, TextAnchor.MiddleLeft, White, FontStyle.Bold);
                Label(card, "Details", $"{unit.Description}\nCOST {unit.EnergyCost}  •  LEVEL {unit.StartingLevel}  •  {state}", new Vector2(0.22f, 0.08f), new Vector2(0.95f, 0.58f), 15, TextAnchor.MiddleLeft, profile.IsUnlocked(unit.Id) ? Muted : Orange);
            }
        }

        public void RefreshSettings(CrownUserSettings settings)
        {
            if (_settingsSummary == null) return;
            string quality = settings.quality == 0 ? "LOW" : settings.quality == 1 ? "MEDIUM" : "HIGH";
            string vfx = settings.vfxIntensity == 0 ? "LOW" : settings.vfxIntensity == 1 ? "MEDIUM" : "HIGH";
            _settingsSummary.text = $"QUALITY {quality}  •  {settings.fpsCap} FPS  •  VFX {vfx}";
            SetSliderValue(CrownAppScreen.Settings, "Master Volume", settings.masterVolume);
            SetSliderValue(CrownAppScreen.Settings, "Music Volume", settings.musicVolume);
            SetSliderValue(CrownAppScreen.Settings, "SFX Volume", settings.sfxVolume);
            Toggle toggle = _screens[CrownAppScreen.Settings].transform.Find("SettingsPanel/Vibration/Toggle")?.GetComponent<Toggle>();
            if (toggle != null) toggle.SetIsOnWithoutNotify(settings.vibration);
        }

        private void RefreshBattleCards(CrownPlayerProfile profile)
        {
            for (int i = 0; i < _battleCards.Count; i++)
            {
                CrownUnitDefinition definition = profile.selectedDeck != null && i < profile.selectedDeck.Length ? CrownUnitCatalog.Find(profile.selectedDeck[i]) : null;
                _battleCardLabels[i].text = definition != null ? $"{definition.DisplayName}\n{definition.EnergyCost}⚡" : "EMPTY";
                _battleCards[i].interactable = definition != null;
            }
        }

        public void RefreshBattleHud(CrownEngineGame game)
        {
            if (game == null || _battleTimer == null) return;
            _battleBlueHp.text = $"BLUE {Mathf.CeilToInt(game.BlueCoreHealth)}";
            _battleRedHp.text = $"RED {Mathf.CeilToInt(game.RedCoreHealth)}";
            int seconds = Mathf.CeilToInt(game.TimeLeft);
            _battleTimer.text = $"{seconds / 60:00}:{seconds % 60:00}";
            _battleEnergy.text = $"ENERGY {Mathf.FloorToInt(game.Energy)}/10";
            for (int i = 0; i < _battleCards.Count; i++)
            {
                CrownUnitDefinition definition = _flow.Profile.selectedDeck != null && i < _flow.Profile.selectedDeck.Length ? CrownUnitCatalog.Find(_flow.Profile.selectedDeck[i]) : null;
                if (definition == null) continue;
                bool selected = game.SelectedUnit == definition.Kind;
                bool available = game.Energy >= definition.EnergyCost;
                ColorBlock colors = _battleCards[i].colors;
                colors.normalColor = selected ? Cyan : available ? Steel : new Color(0.09f, 0.1f, 0.11f, 0.9f);
                colors.disabledColor = new Color(0.07f, 0.075f, 0.08f, 0.75f);
                _battleCards[i].colors = colors;
                _battleCards[i].interactable = available;
            }
        }

        private void RefreshResults(CrownMatchSummary summary)
        {
            if (summary == null) return;
            Transform panel = _screens[CrownAppScreen.Results].transform.Find("ResultPanel");
            Text title = FindText(panel, "ResultTitle");
            title.text = summary.victory ? "VICTORY" : "DEFEAT";
            title.color = summary.victory ? Cyan : Orange;
            int seconds = Mathf.RoundToInt(summary.duration);
            FindText(panel, "ResultStats").text =
                $"ВРЕМЯ                 {seconds / 60:00}:{seconds % 60:00}\n" +
                $"CORE HP               {Mathf.CeilToInt(summary.survivingCoreHealth)}\n" +
                $"БАШНИ УНИЧТОЖЕНЫ      {summary.towersDestroyed}\n" +
                $"ОТРЯДЫ РАЗВЁРНУТЫ     {summary.unitsDeployed}\n" +
                $"УРОН                   {Mathf.RoundToInt(summary.damageDealt)}";
            FindText(panel, "Rewards").text = $"+{summary.xpEarned} XP    +{summary.coinsEarned} ◈";
        }

        public void ShowLoading(string status, float progress)
        {
            _loading.SetActive(true);
            _loading.transform.SetAsLastSibling();
            _loadingLabel.text = status;
            _loadingProgress.value = Mathf.Clamp01(progress);
        }

        public void HideLoading() { if (_loading != null) _loading.SetActive(false); }
        public void SetResumeShield(bool visible) { if (_resumeShield != null) _resumeShield.SetActive(visible); }

        public void ShowToast(string text)
        {
            if (_toast == null) return;
            _toastText.text = text;
            _toast.SetActive(true);
            _toast.transform.SetAsLastSibling();
            _toastUntil = Time.unscaledTime + 2.2f;
        }

        private void SelectBattleCard(int index)
        {
            if (_flow.Profile.selectedDeck == null || index >= _flow.Profile.selectedDeck.Length) return;
            CrownUnitDefinition definition = CrownUnitCatalog.Find(_flow.Profile.selectedDeck[index]);
            if (definition != null) _flow.SelectBattleUnit(definition.Kind);
        }

        private void ToggleBattlePause()
        {
            bool pause = !_flow.Game.SessionPaused;
            _flow.Game.SetSessionPaused(pause);
            SetResumeShield(pause);
        }

        private void CycleVfx() { _flow.SetVfxIntensity((_flow.Settings.vfxIntensity + 1) % 3); }
        private void CycleQuality() { _flow.SetQuality((_flow.Settings.quality + 1) % 3); }
        private void CycleFps() { _flow.SetFpsCap(_flow.Settings.fpsCap == 30 ? 60 : 30); }
        private void ConfirmReset() { ShowToast("НАЖМИТЕ СНОВА ДЛЯ ПОДТВЕРЖДЕНИЯ"); Invoke(nameof(EnableResetConfirmation), 0.05f); }
        private void EnableResetConfirmation()
        {
            Button button = _screens[CrownAppScreen.Settings].transform.Find("SettingsPanel/ResetProgress")?.GetComponent<Button>();
            if (button == null) return;
            button.onClick.RemoveAllListeners();
            button.onClick.AddListener(_flow.ResetProgressConfirmed);
            Text label = button.GetComponentInChildren<Text>();
            if (label != null) label.text = "ПОДТВЕРДИТЬ СБРОС";
        }

        private void BuildBottomNavigation(Transform screen, CrownAppScreen selected)
        {
            RectTransform nav = Panel(screen, "BottomNavigation", new Vector2(0.035f, 0.015f), new Vector2(0.965f, 0.09f), Glass);
            AddNavButton(nav, "Главная", 0, _flow.ShowMainMenu, selected == CrownAppScreen.MainMenu);
            AddNavButton(nav, "Юниты", 1, _flow.ShowCollection, selected == CrownAppScreen.Collection);
            AddNavButton(nav, "Колода", 2, _flow.ShowDeckBuilder, selected == CrownAppScreen.DeckBuilder);
            AddNavButton(nav, "Настройки", 3, _flow.ShowSettings, selected == CrownAppScreen.Settings);
        }

        private void AddNavButton(Transform parent, string text, int index, UnityEngine.Events.UnityAction action, bool selected)
        {
            float x0 = index * 0.25f + 0.01f;
            Button(parent, $"Nav{text}", text.ToUpperInvariant(), new Vector2(x0, 0.08f), new Vector2(x0 + 0.23f, 0.92f), action, selected ? Cyan : Steel, 16);
        }

        private void AddArenaPreview(Transform parent)
        {
            string[] previewLayers = { "Arena_Background", "Arena_TitanHull", "Arena_CombatDeck", "Arena_LightOverlay" };
            for (int i = 0; i < previewLayers.Length; i++)
            {
                Sprite sprite = Resources.Load<Sprite>($"CrownBakedArena/{previewLayers[i]}");
                GameObject imageObject = new GameObject($"BakedArenaPreview_{previewLayers[i]}", typeof(RectTransform), typeof(Image));
                imageObject.transform.SetParent(parent, false);
                RectTransform rect = imageObject.GetComponent<RectTransform>();
                Stretch(rect);
                rect.offsetMin = new Vector2(8f, 8f);
                rect.offsetMax = new Vector2(-8f, -8f);
                Image image = imageObject.GetComponent<Image>();
                image.sprite = sprite;
                image.color = sprite != null ? Color.white : new Color(0.03f, 0.12f, 0.18f, 1f);
                image.preserveAspect = true;
                image.raycastTarget = false;
            }
        }

        private void AddCardSilhouette(Transform parent, CrownUnitKind kind)
        {
            RectTransform root = Panel(parent, "Silhouette", new Vector2(0.03f, 0.12f), new Vector2(0.2f, 0.88f), new Color(0.01f, 0.025f, 0.04f, 0.92f));
            float width = kind == CrownUnitKind.Tank ? 0.74f : kind == CrownUnitKind.Raider ? 0.38f : 0.52f;
            Panel(root, "Body", new Vector2(0.5f - width * 0.5f, 0.22f), new Vector2(0.5f + width * 0.5f, 0.67f), White);
            Panel(root, "Head", new Vector2(0.35f, 0.67f), new Vector2(0.65f, 0.87f), kind == CrownUnitKind.Ranged ? Orange : Cyan);
            if (kind == CrownUnitKind.Raider)
            {
                Panel(root, "Blade", new Vector2(0.62f, 0.26f), new Vector2(0.78f, 0.82f), Cyan).localRotation = Quaternion.Euler(0f, 0f, -24f);
            }
            else
            {
                Panel(root, "Weapon", new Vector2(0.58f, 0.36f), new Vector2(kind == CrownUnitKind.Tank ? 0.98f : 0.9f, 0.48f), kind == CrownUnitKind.Ranged ? Orange : Cyan);
            }
        }

        private void BuildSlider(Transform parent, string name, float y, UnityEngine.Events.UnityAction<float> callback)
        {
            RectTransform row = Panel(parent, name, new Vector2(0.06f, y), new Vector2(0.94f, y + 0.1f), new Color(0.02f, 0.045f, 0.065f, 0.8f));
            Label(row, "Label", name.ToUpperInvariant(), new Vector2(0.03f, 0.1f), new Vector2(0.43f, 0.9f), 18, TextAnchor.MiddleLeft, White);
            Slider slider = CreateSlider(row, "Slider", new Vector2(0.46f, 0.25f), new Vector2(0.96f, 0.75f));
            slider.onValueChanged.AddListener(callback);
        }

        private void BuildToggle(Transform parent, string name, float y, UnityEngine.Events.UnityAction<bool> callback)
        {
            RectTransform row = Panel(parent, name, new Vector2(0.06f, y), new Vector2(0.94f, y + 0.1f), new Color(0.02f, 0.045f, 0.065f, 0.8f));
            Label(row, "Label", name.ToUpperInvariant(), new Vector2(0.03f, 0.1f), new Vector2(0.73f, 0.9f), 18, TextAnchor.MiddleLeft, White);
            GameObject toggleObject = new GameObject("Toggle", typeof(RectTransform), typeof(Image), typeof(Toggle));
            toggleObject.transform.SetParent(row, false);
            RectTransform rect = toggleObject.GetComponent<RectTransform>();
            rect.anchorMin = new Vector2(0.82f, 0.2f); rect.anchorMax = new Vector2(0.95f, 0.8f); rect.offsetMin = rect.offsetMax = Vector2.zero;
            Image background = toggleObject.GetComponent<Image>(); background.color = Steel;
            GameObject checkObject = new GameObject("Checkmark", typeof(RectTransform), typeof(Image));
            checkObject.transform.SetParent(toggleObject.transform, false);
            Stretch(checkObject.GetComponent<RectTransform>()); checkObject.GetComponent<RectTransform>().offsetMin = new Vector2(7f, 7f); checkObject.GetComponent<RectTransform>().offsetMax = new Vector2(-7f, -7f);
            Image check = checkObject.GetComponent<Image>(); check.color = Cyan;
            Toggle toggle = toggleObject.GetComponent<Toggle>(); toggle.targetGraphic = background; toggle.graphic = check; toggle.onValueChanged.AddListener(callback);
        }

        private Slider CreateSlider(Transform parent, string name, Vector2 min, Vector2 max)
        {
            GameObject sliderObject = new GameObject(name, typeof(RectTransform), typeof(Slider));
            sliderObject.transform.SetParent(parent, false);
            RectTransform rect = sliderObject.GetComponent<RectTransform>(); rect.anchorMin = min; rect.anchorMax = max; rect.offsetMin = rect.offsetMax = Vector2.zero;
            RectTransform background = Panel(sliderObject.transform, "Background", new Vector2(0f, 0.35f), new Vector2(1f, 0.65f), Steel);
            RectTransform fillArea = Panel(sliderObject.transform, "Fill Area", new Vector2(0f, 0.35f), new Vector2(1f, 0.65f), Color.clear);
            RectTransform fill = Panel(fillArea, "Fill", Vector2.zero, Vector2.one, Cyan);
            Slider slider = sliderObject.GetComponent<Slider>(); slider.fillRect = fill; slider.targetGraphic = background.GetComponent<Image>(); slider.minValue = 0f; slider.maxValue = 1f;
            return slider;
        }

        private void SetSliderValue(CrownAppScreen screen, string row, float value)
        {
            Slider slider = _screens[screen].transform.Find($"SettingsPanel/{row}/Slider")?.GetComponent<Slider>();
            if (slider != null) slider.SetValueWithoutNotify(value);
        }

        private GameObject Screen(string name, CrownAppScreen screen, Color color)
        {
            GameObject go = new GameObject(name, typeof(RectTransform), typeof(Image));
            go.transform.SetParent(_safeArea, false);
            Stretch(go.GetComponent<RectTransform>());
            Image image = go.GetComponent<Image>(); image.color = color; image.raycastTarget = color.a > 0.01f;
            _screens[screen] = go;
            go.SetActive(false);
            return go;
        }

        private static RectTransform Panel(Transform parent, string name, Vector2 min, Vector2 max, Color color)
        {
            GameObject go = new GameObject(name, typeof(RectTransform), typeof(Image));
            go.transform.SetParent(parent, false);
            RectTransform rect = go.GetComponent<RectTransform>(); rect.anchorMin = min; rect.anchorMax = max; rect.offsetMin = rect.offsetMax = Vector2.zero;
            Image image = go.GetComponent<Image>(); image.color = color; image.raycastTarget = color.a > 0.01f;
            return rect;
        }

        private static Text Label(Transform parent, string name, string text, Vector2 min, Vector2 max, int size, TextAnchor anchor, Color color, FontStyle style = FontStyle.Normal)
        {
            GameObject go = new GameObject(name, typeof(RectTransform), typeof(Text));
            go.transform.SetParent(parent, false);
            RectTransform rect = go.GetComponent<RectTransform>(); rect.anchorMin = min; rect.anchorMax = max; rect.offsetMin = rect.offsetMax = Vector2.zero;
            Text label = go.GetComponent<Text>(); label.text = text; label.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf"); label.fontSize = size; label.alignment = anchor; label.color = color; label.fontStyle = style; label.resizeTextForBestFit = false; label.raycastTarget = false;
            return label;
        }

        private static Button Button(Transform parent, string name, string text, Vector2 min, Vector2 max, UnityEngine.Events.UnityAction action, Color color, int size)
        {
            GameObject go = new GameObject(name, typeof(RectTransform), typeof(Image), typeof(Button));
            go.transform.SetParent(parent, false);
            RectTransform rect = go.GetComponent<RectTransform>(); rect.anchorMin = min; rect.anchorMax = max; rect.offsetMin = rect.offsetMax = Vector2.zero;
            Image image = go.GetComponent<Image>(); image.color = color;
            Button button = go.GetComponent<Button>();
            ColorBlock colors = button.colors; colors.normalColor = color; colors.highlightedColor = Color.Lerp(color, Color.white, 0.18f); colors.pressedColor = Color.Lerp(color, Color.black, 0.22f); colors.selectedColor = colors.highlightedColor; colors.disabledColor = new Color(0.08f, 0.09f, 0.1f, 0.7f); button.colors = colors;
            if (action != null) button.onClick.AddListener(action);
            Label(go.transform, "Label", text, new Vector2(0.04f, 0.04f), new Vector2(0.96f, 0.96f), size, TextAnchor.MiddleCenter, color.grayscale > 0.55f ? new Color(0.01f, 0.035f, 0.05f, 1f) : White, FontStyle.Bold);
            return button;
        }

        private static Text FindText(Transform root, string name)
        {
            Text[] values = root.GetComponentsInChildren<Text>(true);
            for (int i = 0; i < values.Length; i++) if (values[i].name == name || values[i].transform.parent?.name == name) return values[i];
            return null;
        }

        private static void Stretch(RectTransform rect)
        {
            rect.anchorMin = Vector2.zero; rect.anchorMax = Vector2.one; rect.offsetMin = rect.offsetMax = Vector2.zero;
        }

        private static void ClearDynamic(Transform root, string prefix)
        {
            if (root == null) return;
            for (int i = root.childCount - 1; i >= 0; i--)
            {
                Transform child = root.GetChild(i);
                if (!child.name.StartsWith(prefix, StringComparison.Ordinal)) continue;
                if (Application.isPlaying) Destroy(child.gameObject);
                else DestroyImmediate(child.gameObject);
            }
        }

        private static void EnsureEventSystem()
        {
            if (FindAnyObjectByType<EventSystem>() != null) return;
            GameObject eventSystem = new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));
            eventSystem.transform.SetAsFirstSibling();
        }
    }

    public sealed class CrownSafeArea : MonoBehaviour
    {
        private Rect _lastSafeArea;
        private Vector2Int _lastScreen;

        private void OnEnable() { Apply(); }
        private void Update()
        {
            if (_lastSafeArea != Screen.safeArea || _lastScreen.x != Screen.width || _lastScreen.y != Screen.height) Apply();
        }

        private void Apply()
        {
            Rect safe = Screen.safeArea;
            RectTransform rect = transform as RectTransform;
            if (rect == null || Screen.width <= 0 || Screen.height <= 0) return;
            rect.anchorMin = new Vector2(safe.xMin / Screen.width, safe.yMin / Screen.height);
            rect.anchorMax = new Vector2(safe.xMax / Screen.width, safe.yMax / Screen.height);
            rect.offsetMin = rect.offsetMax = Vector2.zero;
            _lastSafeArea = safe;
            _lastScreen = new Vector2Int(Screen.width, Screen.height);
        }
    }
}
