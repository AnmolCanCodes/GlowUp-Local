import { useState } from "react";
import { Copy, ChevronDown, ChevronUp } from "lucide-react";

export function RecommendationCard({ recommendation: r, index }) {
  const [open, setOpen] = useState(index === 0);
  const p = r.priority || "medium";

  return (
    <article className="recommendation">
      <button
        className="recommendation-toggle"
        onClick={() => setOpen((x) => !x)}
        aria-expanded={open}
      >
        <span className="recommendation-index">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="recommendation-title">
          <strong>{r.title}</strong>
          <small className={`priority priority-${p}`}>
            {p} priority · {r.effort || "effort not specified"} effort
          </small>
        </span>
        {open ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
      </button>

      {open && (
        <div className="recommendation-body">
          <p className="recommendation-reason">{r.reason}</p>

          {r.evidence?.length > 0 && (
            <div className="evidence">
              <span>Supporting evidence</span>
              <ul>
                {r.evidence.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="action-steps">
            <span>Implementation steps</span>
            <ol>
              {r.action_steps?.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ol>
          </div>

          {r.measurement && (
            <p className="measurement">
              <b>Success metric:</b> {r.measurement}
            </p>
          )}

          {r.confidence && (
            <p className="confidence">Confidence level: {r.confidence}</p>
          )}
        </div>
      )}
    </article>
  );
}

export function ContentDrafts({ drafts = [] }) {
  const [copied, setCopied] = useState({});

  const copy = async (d, i) => {
    try {
      await navigator.clipboard.writeText(d.content);
      setCopied((s) => ({ ...s, [i]: "Copied" }));
    } catch {
      setCopied((s) => ({
        ...s,
        [i]: "Clipboard unavailable — select text to copy",
      }));
    }
    window.setTimeout(() => setCopied((s) => ({ ...s, [i]: "" })), 2500);
  };

  if (!drafts.length) return null;

  return (
    <div className="draft-list">
      {drafts.map((d, i) => (
        <article className="draft" key={`${d.title}-${i}`}>
          <div className="draft-head">
            <div>
              <span className="eyebrow-small">
                {(d.use_case || "content").replaceAll("_", " ").toUpperCase()}
              </span>
              <h3>{d.title}</h3>
            </div>
            <button className="copy-button" onClick={() => copy(d, i)}>
              <Copy size={14} />
              {copied[i] || "Copy"}
            </button>
          </div>

          <textarea
            aria-label={d.title}
            rows={Math.min(8, Math.max(3, Math.ceil(d.content.length / 85)))}
            defaultValue={d.content}
          />

          {copied[i] && (
            <small className="copy-status" role="status">
              {copied[i]}
            </small>
          )}
        </article>
      ))}
    </div>
  );
}