"use client";

import { useState } from "react";
import { Input, Textarea, TagInput, Btn, Spinner } from "@/components/ui";
import JobCard from "@/components/JobCard";
import Settings, { useUserApiKey } from "@/components/Settings";

/* ─── API helper ──────────────────────────────────────────────── */
async function callAPI({ messages, system, useWebSearch, userKey }) {
  const headers = { "Content-Type": "application/json" };
  if (userKey) headers["x-user-api-key"] = userKey;

  const res = await fetch("/api/anthropic", {
    method: "POST",
    headers,
    body: JSON.stringify({ messages, system, useWebSearch }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.message || data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function parseJSON(raw) {
  const clean = raw.replace(/```json|```/g, "").trim();
  const m = clean.match(/\{[\s\S]*\}/);
  return JSON.parse(m ? m[0] : clean);
}

/* ─── Main app ────────────────────────────────────────────────── */
export default function Home() {
  const [tab, setTab] = useState("search");
  const [profile, setProfile] = useState({
    name: "",
    pitch:
      "UX/Product Designer, 3 ans d'expérience agence web (Rennes), Figma, design system, recherche utilisateur, certifications Opquast et Access42.",
  });
  const [crit, setCrit] = useState({
    postes: [
      "Product designer",
      "UX designer",
      "UX/UI designer",
      "Webdesigner",
      "Designer web",
    ],
    loc: "Paris, Rennes, Nantes",
    contrat: "CDI",
    remote: "Hybride",
  });
  const [jobs, setJobs] = useState([]);
  const [job, setJob] = useState(null);
  const [titles, setTitles] = useState([]);
  const [chosen, setChosen] = useState("");
  const [copied, setCopied] = useState(false);
  const [mail, setMail] = useState({ to: "", subject: "", body: "" });
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [rateInfo, setRateInfo] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userKey, setUserKey] = useUserApiKey();

  const setLoad = (m) => setBusy(m || "");
  const note = (text, type = "info") => setMsg({ text, type });

  const handleError = (e) => {
    if (e.status === 429) {
      note(e.message + " (Clique ⚙ pour ajouter ta clé)", "err");
    } else {
      note(`Erreur : ${e.message}`, "err");
    }
  };

  /* Search jobs */
  async function searchJobs() {
    setLoad("Recherche des offres en cours…");
    note("");
    try {
      const data = await callAPI({
        userKey,
        messages: [
          {
            role: "user",
            content: `Recherche des offres d'emploi actuelles sur LinkedIn, HelloWork et Indeed.
Intitulés de poste recherchés (n'importe lequel correspond) : ${crit.postes.join(", ")}
Localisations : ${crit.loc}
Contrat : ${crit.contrat}
Télétravail : ${crit.remote}
Profil candidat : ${profile.pitch}

Trouve des offres réelles et actuelles correspondant à l'un des intitulés listés. Indique la source réelle (LinkedIn / HelloWork / Indeed) dans le champ "source". Retourne UNIQUEMENT ce JSON sans texte ni backticks :
{"jobs":[{"id":"1","title":"","company":"","location":"","contract":"","salary":"","description":"","requirements":[],"url":"","source":""}]}`,
          },
        ],
        useWebSearch: true,
        system:
          "Tu es un assistant de recherche d'emploi. Recherche des offres réelles et actuelles. Réponds en JSON pur uniquement, aucun autre texte.",
      });
      if (data.rateInfo) setRateInfo(data.rateInfo);
      const p = parseJSON(data.text);
      setJobs(p.jobs || []);
      const count = p.jobs?.length || 0;
      let msgText = `${count} offre${count !== 1 ? "s" : ""} trouvée${count !== 1 ? "s" : ""}`;
      if (data.rateInfo && !data.usingBYOK) {
        msgText += ` · ${data.rateInfo.remaining}/${data.rateInfo.limit} recherches restantes aujourd'hui`;
      }
      note(msgText, "ok");
    } catch (e) {
      handleError(e);
    }
    setLoad("");
  }

  /* Generate CV titles */
  async function genTitles() {
    if (!job) return;
    setLoad("Génération des titres en cours…");
    try {
      const data = await callAPI({
        userKey,
        messages: [
          {
            role: "user",
            content: `Génère 4 titres de CV percutants et ciblés pour cette offre.
Poste : ${job.title} chez ${job.company}
Compétences recherchées : ${job.requirements?.join(", ")}
Profil : ${profile.pitch}
Titres courts (max 8 mots), directs, professionnels, sans superlatifs.
Retourne UNIQUEMENT ce JSON : {"titles":["...","...","...","..."]}`,
          },
        ],
      });
      const p = parseJSON(data.text);
      setTitles(p.titles || []);
      setChosen(p.titles?.[0] || "");
      setTab("cv");
      note("");
    } catch (e) {
      handleError(e);
    }
    setLoad("");
  }

  /* Generate email */
  async function genEmail() {
    if (!job) return;
    setLoad("Rédaction de la candidature…");
    try {
      const data = await callAPI({
        userKey,
        messages: [
          {
            role: "user",
            content: `Rédige un email de candidature.
Offre : ${job.title} chez ${job.company} (${job.location})
Description du poste : ${job.description}
Profil candidat : ${profile.pitch}
${profile.name ? `Nom du candidat : ${profile.name}` : ""}
Style d'écriture : confiant, direct, mesuré. Pas de "je suis très motivée", formulations concrètes.
Retourne UNIQUEMENT ce JSON sans backticks :
{"to":"","subject":"Candidature – ${job.title}${profile.name ? ` | ${profile.name}` : ""}","body":"corps de l'email complet, 3-4 paragraphes, professionnel et direct, en français"}`,
          },
        ],
      });
      const p = parseJSON(data.text);
      setMail({
        to: p.to || "",
        subject: p.subject || `Candidature – ${job.title}`,
        body: p.body || "",
      });
      setTab("email");
      note("");
    } catch (e) {
      handleError(e);
    }
    setLoad("");
  }

  const mailtoHref = () => {
    const params = new URLSearchParams({
      subject: mail.subject,
      body: mail.body,
    });
    return `mailto:${encodeURIComponent(mail.to)}?${params.toString()}`;
  };

  const gmailHref = () => {
    const params = new URLSearchParams({
      view: "cm",
      fs: "1",
      to: mail.to,
      su: mail.subject,
      body: mail.body,
    });
    return `https://mail.google.com/mail/?${params.toString()}`;
  };

  function copy(text) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const tabs = [
    { id: "search", label: "01 — Recherche", locked: false },
    { id: "cv", label: "02 — Titre CV", locked: !job },
    { id: "email", label: "03 — Candidature", locked: !job },
  ];

  return (
    <main style={{ minHeight: "100vh", padding: "32px 24px 64px" }}>
      <Settings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        userKey={userKey}
        setUserKey={setUserKey}
        rateInfo={rateInfo}
      />

      {/* Header */}
      <div style={{ maxWidth: 780, margin: "0 auto 28px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 16,
            marginBottom: 6,
            flexWrap: "wrap",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--sans)",
              fontWeight: 800,
              fontSize: 24,
              letterSpacing: "-0.02em",
            }}
          >
            Studio Candidature
          </h1>
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              color: "var(--muted)",
              letterSpacing: "0.06em",
            }}
          >
            UX / Product
          </span>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            {userKey && (
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  color: "var(--accent)",
                  letterSpacing: "0.06em",
                  padding: "3px 7px",
                  border: "1px solid rgba(182,255,95,.3)",
                  borderRadius: 3,
                }}
              >
                ● BYOK
              </span>
            )}
            {rateInfo && !userKey && (
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  color:
                    rateInfo.remaining === 0
                      ? "var(--err)"
                      : "var(--muted)",
                  letterSpacing: "0.04em",
                }}
              >
                {rateInfo.remaining}/{rateInfo.limit}
              </span>
            )}
            <button
              onClick={() => setSettingsOpen(true)}
              style={{
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: 4,
                color: "var(--muted)",
                padding: "4px 10px",
                cursor: "pointer",
                fontFamily: "var(--mono)",
                fontSize: 11,
                letterSpacing: "0.04em",
                transition: "all .15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text)";
                e.currentTarget.style.borderColor = "var(--border-light)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--muted)";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              ⚙ Paramètres
            </button>
          </div>
        </div>
        <p
          style={{
            fontFamily: "var(--mono)",
            fontSize: 12,
            color: "var(--dim)",
            lineHeight: 1.5,
          }}
        >
          Recherche d'offres IA · Optimisation CV · Candidature personnalisée
        </p>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        {/* Profile (collapsible) */}
        <details
          style={{
            background: "var(--surf)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            marginBottom: 20,
            overflow: "hidden",
          }}
        >
          <summary
            style={{
              padding: "10px 16px",
              cursor: "pointer",
              fontFamily: "var(--mono)",
              fontSize: 11,
              color: "var(--muted)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              userSelect: "none",
            }}
          >
            Profil candidat
          </summary>
          <div
            style={{
              padding: "0 16px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <Input
              label="Nom"
              value={profile.name}
              onChange={(v) => setProfile((p) => ({ ...p, name: v }))}
              placeholder="Ton prénom et nom"
            />
            <Textarea
              label="Pitch / résumé"
              value={profile.pitch}
              rows={3}
              onChange={(v) => setProfile((p) => ({ ...p, pitch: v }))}
            />
          </div>
        </details>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 0,
            borderBottom: "1px solid var(--border)",
            marginBottom: 28,
            overflowX: "auto",
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => !t.locked && setTab(t.id)}
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                letterSpacing: "0.05em",
                padding: "10px 20px",
                background: "none",
                border: "none",
                borderBottom: `2px solid ${tab === t.id ? "var(--accent)" : "transparent"}`,
                color: t.locked
                  ? "var(--dim)"
                  : tab === t.id
                    ? "var(--accent)"
                    : "var(--muted)",
                cursor: t.locked ? "default" : "pointer",
                transition: "all .15s",
                marginBottom: -1,
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Status bar */}
        {(busy || msg.text) && (
          <div
            className="fade-in"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 20,
              padding: "10px 14px",
              borderRadius: 6,
              background:
                msg.type === "ok"
                  ? "rgba(134,239,172,.08)"
                  : msg.type === "err"
                    ? "rgba(248,113,113,.08)"
                    : "var(--surf)",
              border: `1px solid ${
                msg.type === "ok"
                  ? "rgba(134,239,172,.2)"
                  : msg.type === "err"
                    ? "rgba(248,113,113,.2)"
                    : "var(--border)"
              }`,
            }}
          >
            {busy ? <Spinner /> : null}
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: 12,
                color:
                  msg.type === "ok"
                    ? "var(--ok)"
                    : msg.type === "err"
                      ? "var(--err)"
                      : "var(--muted)",
                lineHeight: 1.5,
              }}
            >
              {busy || msg.text}
            </span>
          </div>
        )}

        {/* ── Tab: Search ── */}
        {tab === "search" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: 24 }}
            className="fade-in"
          >
            <div
              style={{
                background: "var(--surf)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  color: "var(--muted)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Critères de recherche
              </span>
              <TagInput
                label="Postes recherchés"
                values={crit.postes}
                onChange={(v) => setCrit((p) => ({ ...p, postes: v }))}
                placeholder="ex. UX Designer, puis Entrée"
                note="Entrée ou virgule pour ajouter"
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 14,
                }}
              >
                <Input
                  label="Localisation"
                  value={crit.loc}
                  onChange={(v) => setCrit((p) => ({ ...p, loc: v }))}
                />
                <Input
                  label="Contrat"
                  value={crit.contrat}
                  onChange={(v) => setCrit((p) => ({ ...p, contrat: v }))}
                  options={["CDI", "CDD", "Freelance", "Stage", "Alternance"]}
                />
                <Input
                  label="Télétravail"
                  value={crit.remote}
                  onChange={(v) => setCrit((p) => ({ ...p, remote: v }))}
                  options={["Hybride", "Full remote", "Présentiel"]}
                />
              </div>
              <Btn onClick={searchJobs} disabled={!!busy || crit.postes.length === 0}>
                {busy ? "Recherche…" : "Lancer la recherche →"}
              </Btn>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  color: "var(--dim)",
                  letterSpacing: "0.04em",
                  textAlign: "center",
                }}
              >
                Sources : LinkedIn · HelloWork · Indeed
              </div>
            </div>

            {jobs.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      color: "var(--muted)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Offres ({jobs.length})
                  </span>
                  {job && (
                    <span
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: 11,
                        color: "var(--accent)",
                      }}
                    >
                      ● {job.title} sélectionné
                    </span>
                  )}
                </div>
                {jobs.map((j) => (
                  <JobCard
                    key={j.id}
                    job={j}
                    selected={job?.id === j.id}
                    onSelect={(jj) => setJob(jj)}
                    onCV={genTitles}
                    onEmail={genEmail}
                  />
                ))}
              </div>
            )}

            {jobs.length === 0 && !busy && (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 24px",
                  fontFamily: "var(--mono)",
                  color: "var(--dim)",
                  fontSize: 12,
                  lineHeight: 1.7,
                }}
              >
                Lance une recherche pour voir les offres apparaître ici.
              </div>
            )}
          </div>
        )}

        {/* ── Tab: CV ── */}
        {tab === "cv" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
            className="fade-in"
          >
            {job && (
              <div
                style={{
                  background: "var(--surf)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "12px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "var(--sans)",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {job.title}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                      color: "var(--muted)",
                    }}
                  >
                    {job.company} · {job.location}
                  </div>
                </div>
                <Btn small variant="ghost" onClick={() => setTab("search")}>
                  ← Changer
                </Btn>
              </div>
            )}

            <div
              style={{
                background: "rgba(182,255,95,.05)",
                border: "1px solid rgba(182,255,95,.15)",
                borderRadius: 8,
                padding: "12px 16px",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>☝️</span>
              <div
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  color: "var(--muted)",
                  lineHeight: 1.6,
                }}
              >
                <strong style={{ color: "var(--accent)" }}>Canva</strong> ne
                propose pas d'API publique d'édition. Copie le titre ci-dessous
                et colle-le dans ton CV Canva.
              </div>
            </div>

            {titles.length > 0 ? (
              <>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      color: "var(--muted)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Titres générés — clique pour sélectionner
                  </span>
                  {titles.map((t, i) => (
                    <div
                      key={i}
                      onClick={() => setChosen(t)}
                      style={{
                        background:
                          chosen === t ? "var(--accent-dim)" : "var(--card)",
                        border: `1px solid ${
                          chosen === t
                            ? "rgba(182,255,95,.35)"
                            : "var(--border)"
                        }`,
                        borderRadius: 8,
                        padding: "14px 18px",
                        cursor: "pointer",
                        transition: "all .15s",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--sans)",
                          fontWeight: chosen === t ? 700 : 500,
                          fontSize: 15,
                          color: chosen === t ? "var(--accent)" : "var(--text)",
                        }}
                      >
                        {t}
                      </span>
                      {chosen === t && (
                        <span
                          style={{
                            fontFamily: "var(--mono)",
                            fontSize: 10,
                            color: "var(--accent)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          SÉLECTIONNÉ
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Btn onClick={() => copy(chosen)} disabled={!chosen}>
                    {copied ? "✓ Copié !" : "Copier le titre →"}
                  </Btn>
                  <Btn
                    variant="ghost"
                    onClick={genTitles}
                    disabled={!!busy}
                    small
                  >
                    Régénérer
                  </Btn>
                  <Btn
                    variant="ghost"
                    onClick={genEmail}
                    disabled={!!busy || !job}
                    small
                  >
                    Rédiger candidature →
                  </Btn>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 24px" }}>
                <Btn onClick={genTitles} disabled={!!busy || !job}>
                  Générer les titres →
                </Btn>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Email ── */}
        {tab === "email" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: 18 }}
            className="fade-in"
          >
            {job && (
              <div
                style={{
                  background: "var(--surf)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "12px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "var(--sans)",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {job.title}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                      color: "var(--muted)",
                    }}
                  >
                    {job.company} · {job.location}
                  </div>
                </div>
                <Btn small variant="ghost" onClick={() => setTab("search")}>
                  ← Changer
                </Btn>
              </div>
            )}

            {mail.body ? (
              <>
                <Input
                  label="Destinataire"
                  value={mail.to}
                  onChange={(v) => setMail((p) => ({ ...p, to: v }))}
                  placeholder="recruteur@entreprise.fr"
                />
                <Input
                  label="Sujet"
                  value={mail.subject}
                  onChange={(v) => setMail((p) => ({ ...p, subject: v }))}
                />
                <Textarea
                  label="Corps de l'email"
                  value={mail.body}
                  rows={14}
                  onChange={(v) => setMail((p) => ({ ...p, body: v }))}
                  note="Modifiable"
                />
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Btn href={gmailHref()} target="_blank" disabled={!mail.to}>
                    Ouvrir dans Gmail →
                  </Btn>
                  <Btn
                    href={mailtoHref()}
                    variant="ghost"
                    small
                    disabled={!mail.to}
                  >
                    Client mail système
                  </Btn>
                  <Btn
                    variant="ghost"
                    onClick={genEmail}
                    disabled={!!busy}
                    small
                  >
                    Régénérer
                  </Btn>
                  <Btn
                    variant="ghost"
                    small
                    onClick={() => {
                      copy(
                        `À : ${mail.to}\nSujet : ${mail.subject}\n\n${mail.body}`
                      );
                      note("Email copié dans le presse-papiers.", "ok");
                    }}
                  >
                    Copier
                  </Btn>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 24px" }}>
                <Btn onClick={genEmail} disabled={!!busy || !job}>
                  Rédiger la candidature →
                </Btn>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: 64,
            paddingTop: 24,
            borderTop: "1px solid var(--border)",
            fontFamily: "var(--mono)",
            fontSize: 10,
            color: "var(--dim)",
            letterSpacing: "0.06em",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span>Studio Candidature · 2026</span>
          <span>Propulsé par Claude · Open source MIT</span>
        </div>
      </div>
    </main>
  );
}
