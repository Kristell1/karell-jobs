"use client";

import { useState } from "react";

export function ToggleChips({ label, options, values, onChange, note, allowCustom }) {
  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState("");

  const toggle = (val) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  const addCustom = () => {
    const trimmed = input.trim();
    if (
      trimmed &&
      !values.some((v) => v.toLowerCase() === trimmed.toLowerCase()) &&
      !options.some((o) => o.toLowerCase() === trimmed.toLowerCase())
    ) {
      onChange([...values, trimmed]);
    }
    setInput("");
    setAdding(false);
  };

  // Build full chip list: predefined options + custom values not in options
  const customValues = values.filter(
    (v) => !options.some((o) => o.toLowerCase() === v.toLowerCase())
  );
  const allChips = [...options, ...customValues];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <label
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            color: "var(--muted)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </label>
        {note && (
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 10,
              color: "var(--dim)",
            }}
          >
            {note}
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {allChips.map((opt) => {
          const active = values.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              style={{
                fontFamily: "var(--mono)",
                fontSize: 12,
                fontWeight: 500,
                padding: "6px 12px",
                borderRadius: 20,
                border: `1px solid ${
                  active ? "rgba(182,255,95,.35)" : "var(--border)"
                }`,
                background: active ? "var(--accent-dim)" : "transparent",
                color: active ? "var(--accent)" : "var(--muted)",
                cursor: "pointer",
                transition: "all .15s",
              }}
            >
              {opt}
            </button>
          );
        })}
        {allowCustom &&
          (adding ? (
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addCustom();
                if (e.key === "Escape") {
                  setInput("");
                  setAdding(false);
                }
              }}
              onBlur={addCustom}
              placeholder="Ville…"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border-light)",
                borderRadius: 20,
                padding: "5px 12px",
                color: "var(--text)",
                fontFamily: "var(--mono)",
                fontSize: 12,
                width: 110,
                outline: "none",
              }}
            />
          ) : (
            <button
              onClick={() => setAdding(true)}
              style={{
                fontFamily: "var(--mono)",
                fontSize: 12,
                padding: "6px 12px",
                borderRadius: 20,
                border: "1px dashed var(--border)",
                background: "transparent",
                color: "var(--muted)",
                cursor: "pointer",
                transition: "all .15s",
              }}
            >
              + Autre
            </button>
          ))}
      </div>
    </div>
  );
}

export function Tag({ children, accent }) {
  return (
    <span
      style={{
        fontFamily: "var(--mono)",
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "2px 7px",
        borderRadius: 3,
        background: accent ? "var(--accent-dim)" : "rgba(255,255,255,.05)",
        color: accent ? "var(--accent)" : "var(--muted)",
        border: `1px solid ${accent ? "rgba(182,255,95,.25)" : "var(--border)"}`,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export function Input({ label, value, onChange, placeholder, options }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        style={{
          fontFamily: "var(--mono)",
          fontSize: 10,
          color: "var(--muted)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>
      {options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            color: "var(--text)",
            fontFamily: "var(--mono)",
            fontSize: 13,
            padding: "9px 12px",
            outline: "none",
            cursor: "pointer",
            appearance: "none",
          }}
        >
          {options.map((o) => (
            <option key={o} value={o} style={{ background: "var(--card)" }}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            color: "var(--text)",
            fontFamily: "var(--mono)",
            fontSize: 13,
            padding: "9px 12px",
            outline: "none",
            width: "100%",
            transition: "border-color .15s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--border-light)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      )}
    </div>
  );
}

export function TagInput({ label, values, onChange, placeholder, note }) {
  const [input, setInput] = useState("");

  const addTag = (text) => {
    const trimmed = text.trim().replace(/,$/, "");
    if (trimmed && !values.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...values, trimmed]);
    }
  };

  const removeTag = (idx) => {
    onChange(values.filter((_, i) => i !== idx));
  };

  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
      setInput("");
    } else if (e.key === "Backspace" && !input && values.length > 0) {
      removeTag(values.length - 1);
    }
  };

  const handleBlur = () => {
    if (input.trim()) {
      addTag(input);
      setInput("");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <label
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            color: "var(--muted)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </label>
        {note && (
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 10,
              color: "var(--dim)",
            }}
          >
            {note}
          </span>
        )}
      </div>
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "6px 8px",
          minHeight: 38,
          display: "flex",
          flexWrap: "wrap",
          gap: 5,
          alignItems: "center",
          transition: "border-color .15s",
        }}
      >
        {values.map((tag, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "var(--mono)",
              fontSize: 11,
              fontWeight: 500,
              padding: "3px 4px 3px 8px",
              borderRadius: 3,
              background: "var(--accent-dim)",
              color: "var(--accent)",
              border: "1px solid rgba(182,255,95,.25)",
            }}
          >
            {tag}
            <button
              onClick={() => removeTag(i)}
              type="button"
              style={{
                background: "none",
                border: "none",
                color: "var(--accent)",
                cursor: "pointer",
                padding: "0 4px",
                fontSize: 13,
                lineHeight: 1,
                opacity: 0.7,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.7)}
              aria-label={`Retirer ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={handleBlur}
          placeholder={values.length === 0 ? placeholder : "+ Ajouter…"}
          style={{
            flex: 1,
            minWidth: 100,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--text)",
            fontFamily: "var(--mono)",
            fontSize: 12,
            padding: "5px 4px",
          }}
        />
      </div>
    </div>
  );
}

export function Textarea({ label, value, onChange, rows = 10, note }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <label
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            color: "var(--muted)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </label>
        {note && (
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 10,
              color: "var(--dim)",
            }}
          >
            {note}
          </span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          color: "var(--text)",
          fontFamily: "var(--mono)",
          fontSize: 12,
          lineHeight: 1.7,
          padding: 12,
          outline: "none",
          width: "100%",
          transition: "border-color .15s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--border-light)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
      />
    </div>
  );
}

export function Btn({ children, onClick, disabled, variant = "primary", full, small, href, target }) {
  const isPrim = variant === "primary";
  const isDanger = variant === "danger";

  const baseStyle = {
    fontFamily: "var(--sans)",
    fontSize: small ? 12 : 13,
    fontWeight: 600,
    letterSpacing: "0.02em",
    padding: small ? "7px 14px" : "10px 20px",
    borderRadius: 6,
    border: isPrim ? "none" : `1px solid ${isDanger ? "var(--err)" : "var(--border)"}`,
    background: isPrim ? "var(--accent)" : "transparent",
    color: isPrim ? "#0a0a0a" : isDanger ? "var(--err)" : "var(--muted)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
    transition: "all .15s",
    width: full ? "100%" : "auto",
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
  };

  const [hover, setHover] = useState(false);
  const style = {
    ...baseStyle,
    filter: hover && !disabled && isPrim ? "brightness(1.1)" : "",
    color: hover && !disabled && !isPrim
      ? isDanger ? "var(--err)" : "var(--text)"
      : baseStyle.color,
  };

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        style={style}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={style}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </button>
  );
}

export function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: "2px solid var(--border)",
          borderTopColor: "var(--accent)",
          animation: "spin 0.7s linear infinite",
        }}
      />
    </div>
  );
}
