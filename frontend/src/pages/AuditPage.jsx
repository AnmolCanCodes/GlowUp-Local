import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Activity,
  FileSearch,
  ShieldCheck,
  MapPin,
} from "lucide-react";
import { createAudit } from "../api";
import BusinessForm from "../components/audit/BusinessForm";
import CompetitorTable from "../components/audit/CompetitorTable";
import { RecommendationCard, ContentDrafts } from "../components/audit/RecommendationCard";

function Metric({ label, metric, suffix = "" }) {
  const fmt = (n) =>
    n == null ? "—" : `${Number.isInteger(n) ? n : Number(n).toFixed(1)}${suffix}`;

  return (
    <div className="comparison-metric">
      <span>{label}</span>
      <div>
        <strong>{fmt(metric?.owner_value)}</strong>
        <small>Your business</small>
      </div>
      <div>
        <strong>{fmt(metric?.competitor_average)}</strong>
        <small>Competitor average</small>
      </div>
      <p>
        {metric?.status === "unavailable"
          ? "Not enough data to compare"
          : metric?.status === "partial"
          ? `${metric.competitors_with_data} competitors with data`
          : metric
          ? `${metric.competitors_with_data} competitors included`
          : "Not available"}
      </p>
    </div>
  );
}

function Report({ report: r, onReset }) {
  const partial = r.missing_data_notes?.length > 0 || !r.competitors?.length;

  return (
    <main className="report-shell">
      <div className="report-topline">
        <button className="back-button" onClick={onReset}>
          <ArrowLeft size={15} /> New audit
        </button>
        <span className="report-date">
          MARKET INTELLIGENCE REPORT · {new Date(r.generated_at).toLocaleDateString()}
        </span>
      </div>

      <header className="report-heading">
        <div>
          <span className="eyebrow">LOCAL MARKET ANALYSIS / VARANASI</span>
          <h1>{r.business_name}</h1>
          <p>
            <MapPin size={14} />
            {r.location_searched} <span>·</span> {r.business_category}
          </p>
        </div>
        <span className={`audit-status ${partial ? "status-partial" : ""}`}>
          {partial ? "Completed with data gaps" : "Analysis complete"}
        </span>
      </header>

      <section className="report-overview">
        <div className="overview-main">
          <span className="eyebrow-small">MARKET LANDSCAPE</span>
          <strong className="competitor-total">
            {r.comparison?.competitor_count ?? r.competitors?.length ?? 0}
          </strong>
          <p>nearby businesses identified</p>
        </div>
        <div className="overview-copy">
          <h2>Your competitive position in context.</h2>
          <p>
            This analysis compares publicly available information for your business
            against nearby competitors. It identifies observable gaps and opportunities,
            not search rankings or service quality judgments.
          </p>
        </div>
      </section>

      <section className="report-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow-small">01 / COMPETITOR LANDSCAPE</span>
            <h2>Nearby businesses</h2>
          </div>
          <span className="section-count">{r.competitors?.length || 0} identified</span>
        </div>
        <CompetitorTable competitors={r.competitors || []} />
      </section>

      <section className="report-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow-small">02 / COMPARATIVE ANALYSIS</span>
            <h2>Performance metrics</h2>
          </div>
        </div>
        <div className="comparison-grid">
          <Metric label="Google rating" metric={r.comparison?.rating} />
          <Metric label="Review count" metric={r.comparison?.review_count} />
          <Metric label="Distance" metric={r.comparison?.distance} suffix=" m" />
        </div>
        <div className="coverage">
          <strong>Data availability</strong>
          <div>
            {Object.entries(r.comparison?.data_coverage || {}).map(([k, v]) => (
              <span key={k}>
                <i className={`coverage-dot ${v === "available" ? "good" : ""}`} />
                {k.replaceAll("_", " ")}: {v.replaceAll("_", " ")}
              </span>
            ))}
          </div>
        </div>
        {r.comparison?.evidence?.length > 0 && (
          <div className="evidence-register">
            <strong>Observed evidence</strong>
            {r.comparison.evidence.map((x) => (
              <p key={x.id}>
                <span>{x.source.replaceAll("_", " ")}</span>
                {x.description}
              </p>
            ))}
          </div>
        )}
      </section>

      <section className="report-section recommendations-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow-small">03 / STRATEGIC RECOMMENDATIONS</span>
            <h2>Priority actions</h2>
            <p>Evidence-based improvements ranked by impact and effort.</p>
          </div>
          <span className="section-count">{r.recommendations?.length || 0} actions</span>
        </div>
        {r.recommendations?.length ? (
          r.recommendations.map((x, i) => (
            <RecommendationCard recommendation={x} index={i} key={`${x.title}-${i}`} />
          ))
        ) : (
          <p className="muted-copy">No recommendations were returned.</p>
        )}
      </section>

      {r.content_drafts?.length > 0 && (
        <section className="report-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow-small">04 / CONTENT ASSETS</span>
              <h2>Draft content</h2>
              <p>Editable drafts for your website or business listings.</p>
            </div>
          </div>
          <ContentDrafts drafts={r.content_drafts} />
        </section>
      )}

      <section className="disclosure">
        <ShieldCheck size={19} />
        <div>
          <h3>Sources, gaps & limitations</h3>
          <p>
            <b>Sources:</b> {(r.data_sources || []).join(" · ") || "Not specified"}
          </p>
          {r.missing_data_notes?.map((x, i) => (
            <p key={`m${i}`}>{x}</p>
          ))}
          {r.limitations?.map((x, i) => (
            <p key={`l${i}`}>{x}</p>
          ))}
        </div>
      </section>

      <footer className="report-footer">
        <span>GLOWUP LOCAL <i>·</i> VARANASI</span>
        <button className="text-button" onClick={onReset}>
          Run another audit <ArrowUpRight size={14} />
        </button>
      </footer>
    </main>
  );
}

export default function AuditPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (payload) => {
    setLoading(true);
    setError("");
    try {
      const r = await createAudit(payload);
      if (
        !r.audit_id ||
        !Array.isArray(r.competitors) ||
        !r.comparison ||
        !Array.isArray(r.recommendations)
      ) {
        throw new Error(
          "Backend response is missing required audit fields. Check frontend/backend versions."
        );
      }
      setReport(r);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e.message || "Audit failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setReport(null);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (report) return <Report report={report} onReset={reset} />;

  return (
    <div className="app-shell">
      <nav className="top-nav">
        <a href="/" className="brand">
          <span className="brand-mark">G.</span>
          <span>
            glowup<span className="brand-light">local</span>
          </span>
        </a>
        <div className="nav-right">
          <span>
            <i /> BUILT FOR VARANASI BUSINESSES
          </span>
          <a href="#how-it-works">How it works</a>
        </div>
      </nav>

      <main className="landing">
        <section className="intro">
          <div className="intro-copy">
            <span className="eyebrow">
              <span className="eyebrow-line" /> LOCAL MARKET INTELLIGENCE · VARANASI
            </span>
            <h1>
              Understand your competition.<br />
              <em>Strengthen your position.</em>
            </h1>
            <p>
              Compare your business against nearby competitors and discover practical
              improvements to your online presence based on real data.
            </p>
            <div className="intro-meta">
              <span>
                <CheckCircle2 size={14} /> Data-driven comparisons
              </span>
              <span>
                <Activity size={14} /> Actionable insights
              </span>
            </div>
          </div>
          <aside className="intro-aside">
            <span className="aside-index">FIELD NOTE / 001</span>
            <div className="aside-rule" />
            <p>Strategic decisions require clear visibility into your local market.</p>
            <span className="aside-foot">MARKET INTELLIGENCE REPORT</span>
          </aside>
        </section>

        <section className="workflow" id="audit-form">
          <div className="workflow-heading">
            <div>
              <span className="eyebrow-small">BEGIN YOUR ANALYSIS</span>
              <h2>Enter your business details.</h2>
              <p>Basic information to compare against nearby competitors.</p>
            </div>
            <span className="step-label">
              01 <i>/</i> 01
            </span>
          </div>

          {error && (
            <div className="error-banner" role="alert">
              <AlertCircle size={18} />
              <div>
                <strong>We couldn't complete this audit.</strong>
                <p>{error}</p>
                <span>
                  Your entered details are still here. Check the connection or settings,
                  then try again.
                </span>
              </div>
            </div>
          )}

          {loading && (
            <div className="loading-banner" role="status">
              <span className="spinner" />
              <div>
                <strong>Reviewing your local market…</strong>
                <p>
                  Finding nearby businesses and preparing recommendations. This can take a
                  little while.
                </p>
              </div>
            </div>
          )}

          <BusinessForm onSubmit={submit} loading={loading} />
        </section>

        <section className="trust-strip" id="how-it-works">
          <div>
            <FileSearch size={18} />
            <strong>Public data sources</strong>
            <p>Competitor information sourced from Google Places API.</p>
          </div>
          <div>
            <Activity size={18} />
            <strong>Deterministic analysis</strong>
            <p>Comparisons calculated independently before AI interpretation.</p>
          </div>
          <div>
            <ShieldCheck size={18} />
            <strong>Evidence-based insights</strong>
            <p>No ranking guarantees or invented metrics—only observable facts.</p>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>GLOWUP LOCAL <i>·</i> VARANASI, INDIA</span>
        <span>LOCAL KNOWLEDGE. BETTER BUSINESS DECISIONS.</span>
      </footer>
    </div>
  );
}