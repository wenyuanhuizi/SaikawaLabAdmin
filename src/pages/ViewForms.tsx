import { useEffect, useState } from "react";
import { getBugForms, getLatestAq, getOthersInterest, getStudentInterest } from "../api";

type Tab = "student" | "others" | "bug" | "env";

interface FetchState {
  data: Record<string, unknown>[] | null;
  loading: boolean;
  error: string | null;
}

const EMPTY: FetchState = { data: null, loading: false, error: null };

const FETCHERS: Record<Tab, () => Promise<unknown[]>> = {
  student: getStudentInterest,
  others: getOthersInterest,
  bug: getBugForms,
  env: getLatestAq,
};

export default function ViewForms() {
  const [tab, setTab] = useState<Tab>("student");
  const [states, setStates] = useState<Record<Tab, FetchState>>({
    student: EMPTY,
    others: EMPTY,
    bug: EMPTY,
    env: EMPTY,
  });

  async function load(t: Tab) {
    setStates((prev) => ({ ...prev, [t]: { data: null, loading: true, error: null } }));
    try {
      const data = (await FETCHERS[t]()) as Record<string, unknown>[];
      setStates((prev) => ({ ...prev, [t]: { data, loading: false, error: null } }));
    } catch (err) {
      setStates((prev) => ({
        ...prev,
        [t]: { data: null, loading: false, error: err instanceof Error ? err.message : "Failed to fetch" },
      }));
    }
  }

  useEffect(() => {
    load("student");
  }, []);

  function switchTab(t: Tab) {
    setTab(t);
    if (!states[t].data && !states[t].loading) load(t);
  }

  const current = states[tab];

  const tabs: { key: Tab; label: string }[] = [
    { key: "student", label: "Student Interest" },
    { key: "others", label: "Others Interest" },
    { key: "bug", label: "Bug Reports" },
    { key: "env", label: "Env Reports" },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">View Forms</h1>
        <p className="page-subtitle">Browse submitted forms from the community</p>
      </div>

      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? "tab-active" : ""}`}
            onClick={() => switchTab(t.key)}
          >
            {t.label}
          </button>
        ))}
        <button
          className="tab tab-refresh"
          onClick={() => load(tab)}
          disabled={current.loading}
          title="Refresh"
        >
          {current.loading ? "⟳" : "↻"} Refresh
        </button>
      </div>

      <div className="card">
        {current.loading && (
          <div className="state-message">
            <div className="spinner" />
            <p>Loading…</p>
          </div>
        )}

        {current.error && (
          <div className="alert alert-error">{current.error}</div>
        )}

        {current.data && current.data.length === 0 && (
          <div className="state-message">
            <p className="empty-text">No submissions yet.</p>
          </div>
        )}

        {current.data && current.data.length > 0 && (
          <div className="form-list">
            {current.data.map((entry, i) => (
              <FormCard key={i} index={i} data={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FormCard({ index, data }: { index: number; data: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);

  const primaryKeys = ["name", "email", "title", "subject", "message", "description", "createdAt", "timestamp", "date"];
  const preview: [string, unknown][] = [];
  const rest: [string, unknown][] = [];

  for (const [k, v] of Object.entries(data)) {
    if (primaryKeys.includes(k)) preview.push([k, v]);
    else rest.push([k, v]);
  }

  const allFields = [...preview, ...rest];

  return (
    <div className="form-card">
      <div className="form-card-header" onClick={() => setExpanded((e) => !e)}>
        <span className="form-card-index">#{index + 1}</span>
        <div className="form-card-preview">
          {preview.slice(0, 2).map(([k, v]) => (
            <span key={k} className="form-card-field">
              <span className="field-key">{formatKey(k)}:</span>{" "}
              <span className="field-val">{formatValue(v)}</span>
            </span>
          ))}
        </div>
        <span className="form-card-toggle">{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div className="form-card-body">
          <table className="field-table">
            <tbody>
              {allFields.map(([k, v]) => (
                <tr key={k}>
                  <td className="field-key-cell">{formatKey(k)}</td>
                  <td className="field-val-cell">{formatValue(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatKey(k: string) {
  return k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v, null, 2);
  return String(v);
}
