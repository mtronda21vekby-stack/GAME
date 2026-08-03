from pathlib import Path
import re

path = Path("unity/crown-front/Assets/_Project/Runtime/CrownEngineGame.cs")
text = path.read_text(encoding="utf-8")

if "HandleBattlefieldDeploymentInput" in text and '"DEPLOY TO LANE"' not in text:
    print("Battlefield UI is already patched.")
    raise SystemExit(0)

text, count = re.subn(
    r"(        private string _result = string\.Empty;\n)",
    r"\1        private int _lastDeploymentFrame = -1;\n",
    text,
    count=1,
)
if count != 1:
    raise SystemExit("Could not add deployment frame guard.")

text, count = re.subn(
    r"(            _aiEnergy = Mathf\.Min\(MaxEnergy, _aiEnergy \+ dt \* 0\.72f\);\n)",
    r"\1\n            HandleBattlefieldDeploymentInput();\n",
    text,
    count=1,
)
if count != 1:
    raise SystemExit("Could not hook battlefield input.")

new_panel = '''            // Keep the middle of the battlefield completely unobstructed.
            // Select a unit below, then tap/click the desired lane directly on the arena.
            float panelH = 224f;
            float y = height - panelH - 20f;
            GUI.color = new Color(0.03f, 0.06f, 0.09f, 0.95f);
            GUI.Box(new Rect(18, y, width - 36, panelH), string.Empty);
            GUI.color = Color.white;
            GUI.Label(new Rect(42, y + 18, 400, 42), $"ENERGY  {Mathf.FloorToInt(_energy)}/10");
            GUI.Label(new Rect(width - 520, y + 18, 480, 42), $"{_selected}  •  TAP A LANE", RightStyle());

            float cardW = (width - 96f) / 3f;
            DrawUnitButton(new Rect(30, y + 76, cardW, 108), CrownUnitKind.Assault, "ASSAULT", 3);
            DrawUnitButton(new Rect(48 + cardW, y + 76, cardW, 108), CrownUnitKind.Tank, "TANK", 4);
            DrawUnitButton(new Rect(66 + cardW * 2f, y + 76, cardW, 108), CrownUnitKind.Raider, "RAIDER", 2);
'''

text, count = re.subn(
    r"            float panelH = 330f;.*?            if \(GUI\.Button\(new Rect\(66 \+ laneW \* 2f, y \+ 236, laneW, 72\), \"RIGHT\"\)\) TryPlayerSpawn\(2\);\n",
    new_panel,
    text,
    count=1,
    flags=re.S,
)
if count != 1:
    raise SystemExit("Could not replace the center/lane control block.")

input_method = '''        private void HandleBattlefieldDeploymentInput()
        {
            if (_finished || _lastDeploymentFrame == Time.frameCount) return;

            Vector2 screenPosition = default;
            bool released = false;

            // Touch may also emulate a mouse release. Prefer the real touch path to avoid duplicates.
            if (Input.touchCount > 0)
            {
                Touch touch = Input.GetTouch(0);
                if (touch.phase == TouchPhase.Ended)
                {
                    screenPosition = touch.position;
                    released = true;
                }
            }
            else if (Input.GetMouseButtonUp(0))
            {
                screenPosition = Input.mousePosition;
                released = true;
            }

            if (!released || Screen.width <= 0 || Screen.height <= 0) return;

            float normalizedY = screenPosition.y / Screen.height;
            if (normalizedY < 0.16f || normalizedY > 0.90f) return;

            int lane = Mathf.Clamp(Mathf.FloorToInt(screenPosition.x / (Screen.width / 3f)), 0, 2);
            _lastDeploymentFrame = Time.frameCount;
            TryPlayerSpawn(lane);
        }

'''

text, count = re.subn(
    r"(        private void TryPlayerSpawn\(int lane\)\n)",
    input_method + r"\1",
    text,
    count=1,
)
if count != 1:
    raise SystemExit("Could not add direct arena deployment input.")

for forbidden in ('"DEPLOY TO LANE"', '"LEFT")) TryPlayerSpawn(0)', '"CENTER")) TryPlayerSpawn(1)', '"RIGHT")) TryPlayerSpawn(2)'):
    if forbidden in text:
        raise SystemExit(f"Obstructive control remains: {forbidden}")

path.write_text(text, encoding="utf-8")
print("CrownEngineGame.cs patched successfully.")
