import React, { useMemo, useState } from "react";
import { Modal, Button } from "@blackcrown/ui";
import { userStorage, track } from "@blackcrown/core";

function sanitizeNickname(raw: string) {
  const s = raw.trim().replace(/\s+/g, " ");
  if (s.length < 2) return "";
  if (s.length > 16) return s.slice(0, 16);
  return s;
}

export function AccountModal(props: {
  open: boolean;
  onClose: () => void;
  onSaved: (name: string) => void;
}) {
  const initial = useMemo(() => userStorage.getString("nickname", ""), [props.open]);
  const [value, setValue] = useState(initial);
  const [error, setError] = useState("");

  const save = () => {
    const s = sanitizeNickname(value);
    if (!s) {
      setError("Nickname must be 2–16 characters.");
      return;
    }
    userStorage.setString("nickname", s);
    track({ type: "ui_toggle", id: "nickname_saved", value: s });
    props.onSaved(s);
  };

  return (
    <Modal
      open={props.open}
      title="Account"
      ariaDescription="Set your nickname. Stored locally on device."
      onClose={props.onClose}
      footer={
        <>
          <Button variant="secondary" onClick={props.onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>Save</Button>
        </>
      }
    >
      <div className="bc-col" style={{ gap: 10 }}>
        <label className="bc-col" style={{ gap: 6 }}>
          <div className="bc-muted" style={{ fontSize: 13 }}>Nickname</div>
          <input
            className="bc-focus"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(""); }}
            placeholder="Player"
            style={{
              width: "100%",
              minHeight: 44,
              borderRadius: 14,
              border: "1px solid var(--stroke)",
              background: "rgba(255,255,255,0.06)",
              color: "var(--text)",
              padding: "10px 12px",
              fontSize: 15
            }}
          />
        </label>

        {error ? <div className="bc-p" style={{ color: "rgba(255,140,140,0.95)" }}>{error}</div> : null}
      </div>
    </Modal>
  );
}
