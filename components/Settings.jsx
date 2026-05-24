"use client";

import { useState, useEffect } from "react";
import { Btn } from "./ui";

const STORAGE_KEY = "karell-jobs:user-api-key";

export function useUserApiKey() {
  const [key, setKey] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setKey(stored);
  }, []);

  const save = (value) => {
    setKey(value);
    if (value) {
      localStorage.setItem(STORAGE_KEY, value);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return [key, save];
}

export default function Settings({ open, onClose, userKey, setUserKey, rateInfo }) {
  const [draftKey, setDraftKey] = useState(userKey || "");
  const [show, setShow] = useState(false);

  useEffect(() => {
    setDraftKey(userKey || "");
  }, [userKey, open]);

  if (!open) return null;

  const save = () => {
    setUserKey(draftKey.trim());
    onClose();
  };

  const clear = () => {
    setDraftKey("");
    setUserKey("");
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fade-in"
        style={{
          background: "var(--surf)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 24,
          maxWidth: 480,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontFamily: "var(--sans)",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}
          >
            Paramètres
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--muted)",
              fontSize: 18,
              cursor: "pointer",
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Usage info */}
        {rateInfo && (
          <div
            style={{
              marginBottom: 20,
              padding: "12px 14px",
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
            }}
          >
            <div
              style={{
                fontFamily: "var(--mono)",
                fontSize: 10,
                color: "var(--muted)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Quota du jour
            </div>
            <div
              style={{
                fontFamily: "var(--sans)",
                fontSize: 15,
                fontWeight: 600,
                color:
                  rateInfo.remaining === 0
                    ? "var(--err)"
                    : rateInfo.remaining <= 1
                      ? "var(--accent)"
                      : "var(--text)",
              }}
            >
              {rateInfo.remaining} / {rateInfo.limit} recherches restantes
            </div>
          </div>
        )}

        {/* BYOK */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 10,
              color: "var(--muted)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Ta propre clé Anthropic (optionnel)
          </div>
          <p
            style={{
              fontFamily: "var(--mono)",
              fontSize: 12,
              color: "var(--muted)",
              lineHeight: 1.6,
              marginBottom: 12,
            }}
          >
            Si tu fournis ta propre clé, tu n'es plus limité par les quotas.
            Elle reste stockée dans ton navigateur uniquement et est transmise à
            ce serveur seulement pour relayer les requêtes — jamais loguée ni
            stockée côté serveur.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <input
                type={show ? "text" : "password"}
                value={draftKey}
                onChange={(e) => setDraftKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  color: "var(--text)",
                  fontFamily: "var(--mono)",
                  fontSize: 12,
                  padding: "10px 60px 10px 12px",
                  outline: "none",
                  width: "100%",
                }}
              />
              <button
                onClick={() => setShow(!show)}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--muted)",
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                }}
              >
                {show ? "MASQUER" : "AFFICHER"}
              </button>
            </div>

            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "var(--mono)",
                fontSize: 10,
                color: "var(--accent)",
                letterSpacing: "0.04em",
              }}
            >
              ↗ Obtenir une clé sur console.anthropic.com
            </a>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            marginTop: 24,
            paddingTop: 16,
            borderTop: "1px solid var(--border)",
          }}
        >
          {userKey && (
            <Btn variant="danger" small onClick={clear}>
              Supprimer ma clé
            </Btn>
          )}
          <Btn variant="ghost" small onClick={onClose}>
            Annuler
          </Btn>
          <Btn small onClick={save}>
            Enregistrer
          </Btn>
        </div>
      </div>
    </div>
  );
}
