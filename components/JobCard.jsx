"use client";

import { useState } from "react";
import { Tag, Btn } from "./ui";

export default function JobCard({ job, selected, onSelect, onCV, onEmail }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => onSelect(job)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="fade-in"
      style={{
        background: selected
          ? "var(--accent-dim-2)"
          : hovered
            ? "var(--card-hover)"
            : "var(--card)",
        border: `1px solid ${selected ? "rgba(182,255,95,.3)" : "var(--border)"}`,
        borderRadius: 8,
        padding: "16px 18px",
        cursor: "pointer",
        transition: "all .2s",
        position: "relative",
      }}
    >
      {selected && (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--accent)",
          }}
        />
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--sans)",
              fontWeight: 700,
              fontSize: 15,
              color: "var(--text)",
              marginBottom: 4,
            }}
          >
            {job.title}
          </div>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 12,
              color: "var(--muted)",
            }}
          >
            {job.company} · {job.location}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            alignItems: "flex-end",
            flexShrink: 0,
          }}
        >
          {job.contract && <Tag>{job.contract}</Tag>}
          {job.salary && (
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                color: "var(--accent)",
              }}
            >
              {job.salary}
            </span>
          )}
        </div>
      </div>

      {job.source && (
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            color: "var(--dim)",
            marginTop: 6,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          via {job.source}
        </div>
      )}

      <div
        style={{
          marginTop: 10,
          fontFamily: "var(--mono)",
          fontSize: 12,
          color: "var(--muted)",
          lineHeight: 1.6,
          overflow: "hidden",
          maxHeight: expanded ? "none" : 40,
        }}
      >
        {job.description}
      </div>
      {job.description?.length > 100 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            color: "var(--accent)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 0 0",
            letterSpacing: "0.04em",
          }}
        >
          {expanded ? "Voir moins ↑" : "Voir plus ↓"}
        </button>
      )}

      {job.requirements?.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 5,
            marginTop: 12,
          }}
        >
          {job.requirements.slice(0, 6).map((r, i) => (
            <Tag key={i}>{r}</Tag>
          ))}
          {job.requirements.length > 6 && (
            <Tag>+{job.requirements.length - 6}</Tag>
          )}
        </div>
      )}

      {selected && (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 14,
            paddingTop: 14,
            borderTop: "1px solid var(--border)",
            flexWrap: "wrap",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Btn small onClick={onCV}>
            Générer titre CV →
          </Btn>
          <Btn small onClick={onEmail}>
            Rédiger candidature →
          </Btn>
          {job.url && job.url !== "" && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                color: "var(--muted)",
                display: "flex",
                alignItems: "center",
                textDecoration: "none",
                marginLeft: "auto",
              }}
            >
              Voir l'offre ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}
