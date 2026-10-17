import { MapPin, Star, ExternalLink } from "lucide-react";

const val = (x) => (x == null || x === "" ? "Not available" : x);
const distance = (x) =>
  x == null
    ? "Not available"
    : x >= 1000
    ? `${(x / 1000).toFixed(1)} km`
    : `${Math.round(x)} m`;

export default function CompetitorTable({ competitors = [] }) {
  if (!competitors.length)
    return (
      <div className="empty-state">
        <MapPin size={20} />
        <div>
          <strong>No competitors returned</strong>
          <p>
            Try a broader category or nearby area. This does not mean there are
            no competitors.
          </p>
        </div>
      </div>
    );

  return (
    <div className="competitor-list">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Business</th>
              <th>Google rating</th>
              <th>Reviews</th>
              <th>Distance</th>
            </tr>
          </thead>
          <tbody>
            {competitors.map((c, i) => (
              <tr key={c.place_id || `${c.name}-${i}`}>
                <td>
                  <strong>{c.name}</strong>
                  <span className="address-cell">
                    {c.address || "Address not available"}
                  </span>
                  {c.google_maps_uri && (
                    <a
                      className="map-link"
                      href={c.google_maps_uri}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View on Maps <ExternalLink size={11} />
                    </a>
                  )}
                </td>
                <td>
                  {c.rating == null ? (
                    "Not available"
                  ) : (
                    <span className="metric-inline">
                      <Star size={13} />
                      {c.rating.toFixed(1)}
                    </span>
                  )}
                </td>
                <td>{val(c.review_count)}</td>
                <td>{distance(c.distance_meters)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mobile-competitors">
        {competitors.map((c, i) => (
          <article
            className="mobile-competitor"
            key={c.place_id || `${c.name}-${i}`}
          >
            <strong>{c.name}</strong>
            <p>{c.address || "Address not available"}</p>
            <dl>
              <div>
                <dt>Rating</dt>
                <dd>{val(c.rating)}</dd>
              </div>
              <div>
                <dt>Reviews</dt>
                <dd>{val(c.review_count)}</dd>
              </div>
              <div>
                <dt>Distance</dt>
                <dd>{distance(c.distance_meters)}</dd>
              </div>
            </dl>
            {c.google_maps_uri && (
              <a href={c.google_maps_uri} target="_blank" rel="noreferrer">
                View on Maps <ExternalLink size={12} />
              </a>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}