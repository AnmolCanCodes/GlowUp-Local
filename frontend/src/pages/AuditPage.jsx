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
import { createAudit } from "../api.js";
import BusinessForm from "../components/BusinessForm.jsx";
import CompetitorTable from "../components/CompetitorTable.jsx";
import { RecommendationCard, ContentDrafts } from "../components/RecommendationCard.jsx";

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
          Report generated {new Date(r.generated_at).toLocaleDateString()}
        </span>
      </div>

      <header className="report-heading">
        <div>
          <span className="eyebrow">Local market analysis</span>
          <h1>{r.business_name}</h1>
          <p>
            <MapPin size={14} />
            <span>{r.location_searched}</span>
            <span>{r.business_category}</span>
          </p>
        </div>
        <span className={`audit-status ${partial ? "status-partial" : ""}`}>
          {partial ? "Completed with data gaps" : "Analysis complete"}
        </span>
      </header>

      <section className="report-overview">
        <div className="overview-main">
          <span className="eyebrow-small">Nearby competitors</span>
          <strong className="competitor-total">
            {r.comparison?.competitor_count ?? r.competitors?.length ?? 0}
          </strong>
          <p>businesses identified</p>
        </div>
        <div className="overview-copy">
          <h2>How you compare with nearby businesses</h2>
          <p>
            This report compares publicly available information for your business
            against nearby competitors. It points out visible gaps and opportunities.
            It does not measure search rankings or service quality.
          </p>
        </div>
      </section>

      <section className="report-section">
        <div className="section-heading">
          <div>
            <h2>Nearby businesses</h2>
          </div>
          <span className="section-count">{r.competitors?.length || 0} identified</span>
        </div>
        <CompetitorTable competitors={r.competitors || []} />
      </section>

      <section className="report-section">
        <div className="section-heading">
          <div>
            <h2>Ratings, reviews and distance</h2>
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
            <h2>What to do first</h2>
            <p>Ranked by expected impact and the effort needed.</p>
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
              <h2>Draft content</h2>
              <p>Editable drafts for your website or business listings. Review before publishing.</p>
            </div>
          </div>
          <ContentDrafts drafts={r.content_drafts} />
        </section>
      )}

      <section className="disclosure">
        <ShieldCheck size={19} />
        <div>
          <h3>Sources, gaps and limitations</h3>
          <p>
            <b>Sources:</b> {(r.data_sources || []).join(", ") || "Not specified"}
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
        <span>
          GlowUp Local <i>·</i> Varanasi
        </span>
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
          <span className="brand-mark">G</span>
          <span>
            GlowUp <span className="brand-light">Local</span>
          </span>
        </a>
        <div className="nav-right">
          <span>
            <i /> Built for Varanasi businesses
          </span>
          <a href="#how-it-works">How it works</a>
        </div>
      </nav>

      <main className="landing">
        <section className="intro">
          <div className="intro-copy">
            <span className="eyebrow">Local market intelligence for Varanasi</span>
            <h1>
              Understand your competition.<br />
              Strengthen your position.
            </h1>
            <p>
              Compare your business against nearby competitors and get practical
              improvements to your online presence, based on real listing data.
            </p>
            <div className="intro-meta">
              <span>
                <CheckCircle2 size={16} /> Data-driven comparisons
              </span>
              <span>
                <Activity size={16} /> Actionable insights
              </span>
            </div>
          </div>
          <aside className="intro-aside">
            <h2>What you get</h2>
            <ul className="intro-points">
              <li>
                <strong>Nearby competitors</strong>
                <span>Businesses around your location, found through Google Places.</span>
              </li>
              <li>
                <strong>Side-by-side comparison</strong>
                <span>Rating, review count and distance, calculated before any AI is involved.</span>
              </li>
              <li>
                <strong>A short action list</strong>
                <span>Fixes ranked by impact and effort, each with clear steps.</span>
              </li>
            </ul>
          </aside>
        </section>

        <section className="workflow" id="audit-form">
          <div className="workflow-heading">
            <div>
              <h2>Enter your business details</h2>
              <p>We use these to find and compare nearby competitors.</p>
            </div>
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
            <p>Competitor information comes from the Google Places API.</p>
          </div>
          <div>
            <Activity size={18} />
            <strong>Calculated before AI</strong>
            <p>Comparisons are computed first, then the AI explains what they mean.</p>
          </div>
          <div>
            <ShieldCheck size={18} />
            <strong>Evidence-based</strong>
            <p>No ranking guarantees or invented metrics, only what is visible in the data.</p>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>
          GlowUp Local <i>·</i> Varanasi, India
        </span>
        <span>Local knowledge for better business decisions.</span>
      </footer>
    </div>
  );
}