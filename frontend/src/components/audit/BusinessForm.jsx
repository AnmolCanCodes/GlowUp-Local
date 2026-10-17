import { useState } from "react";
import { MapPin, LocateFixed, ArrowUpRight } from "lucide-react";

const initial = {
  business_name: "",
  business_category: "hotel",
  location: "",
  latitude: "",
  longitude: "",
  google_rating: "",
  review_count: "",
  business_description: "",
  website_url: "",
  google_business_profile_url: "",
  products_and_services: "",
  target_customer: "",
};

const categories = [
  ["hotel", "Hotel"],
  ["guesthouse", "Guesthouse"],
  ["restaurant", "Restaurant"],
  ["cafe", "Café"],
  ["saree shop", "Saree / textile shop"],
  ["other", "Other"],
];

export default function BusinessForm({ onSubmit, loading }) {
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState({});
  const [geo, setGeo] = useState("");

  const update = (k, x) => {
    setV((s) => ({ ...s, [k]: x }));
    setErrors((s) => ({ ...s, [k]: "" }));
  };

  const useLocation = () => {
    setGeo("");
    if (!navigator.geolocation) {
      setGeo("Location is not supported. Enter your address instead.");
      return;
    }
    setGeo("Waiting for location permission…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setV((s) => ({
          ...s,
          latitude: String(coords.latitude),
          longitude: String(coords.longitude),
        }));
        setGeo("Coordinates added. Your address remains editable.");
      },
      (e) =>
        setGeo(
          e.code === 1
            ? "Permission denied. Enter your address manually."
            : "Could not get your location. Enter your address manually."
        ),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  const submit = (e) => {
    e.preventDefault();
    const er = {};

    if (v.business_name.trim().length < 2)
      er.business_name = "Enter your business name.";
    if (v.business_category.length < 2)
      er.business_category = "Choose a category.";
    if (v.location.trim().length < 2)
      er.location = "Enter an address or area.";

    const rating = v.google_rating === "" ? null : Number(v.google_rating),
      reviews = v.review_count === "" ? null : Number(v.review_count),
      lat = v.latitude === "" ? null : Number(v.latitude),
      lng = v.longitude === "" ? null : Number(v.longitude);

    if (rating !== null && (!Number.isFinite(rating) || rating < 0 || rating > 5))
      er.google_rating = "Rating must be between 0 and 5.";
    if (reviews !== null && (!Number.isInteger(reviews) || reviews < 0))
      er.review_count = "Enter a whole number of zero or more.";
    if ((lat === null) !== (lng === null))
      er.latitude = "Enter both coordinates or leave both blank.";
    if (lat !== null && (!Number.isFinite(lat) || lat < -90 || lat > 90))
      er.latitude = "Latitude must be between -90 and 90.";
    if (lng !== null && (!Number.isFinite(lng) || lng < -180 || lng > 180))
      er.longitude = "Longitude must be between -180 and 180.";

    for (const k of ["website_url", "google_business_profile_url"]) {
      if (v[k] && !/^https?:\/\/.+/i.test(v[k])) {
        er[k] = "Enter a valid URL beginning with http:// or https://.";
      }
    }

    setErrors(er);
    if (Object.keys(er).length) return;

    onSubmit({
      business_name: v.business_name.trim(),
      business_category: v.business_category,
      location: v.location.trim(),
      latitude: lat,
      longitude: lng,
      google_rating: rating,
      review_count: reviews,
      business_description: v.business_description.trim() || null,
      website_url: v.website_url.trim() || null,
      google_business_profile_url: v.google_business_profile_url.trim() || null,
      products_and_services: v.products_and_services
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, 30),
      target_customer: v.target_customer.trim() || null,
    });
  };

  const field = (k, label, opts = {}) => (
    <label className="field" key={k}>
      <span>
        {label}
        {opts.optional && <em>Optional</em>}
      </span>
      <input
        value={v[k]}
        onChange={(e) => update(k, e.target.value)}
        placeholder={opts.placeholder || ""}
        type={opts.type || "text"}
        min={opts.min}
        max={opts.max}
        step={opts.step}
      />
      {errors[k] && <small className="field-error">{errors[k]}</small>}
    </label>
  );

  return (
    <form className="business-form" onSubmit={submit} noValidate>
      <div className="form-section-heading">
        <span>01</span>
        <div>
          <h2>About your business</h2>
          <p>Start with the details customers use to find you.</p>
        </div>
      </div>

      <div className="form-grid">
        {field("business_name", "Business name", {
          placeholder: "e.g. Ganga View Guest House",
        })}
        <label className="field">
          <span>Business category</span>
          <select
            value={v.business_category}
            onChange={(e) => update("business_category", e.target.value)}
          >
            {categories.map(([x, l]) => (
              <option value={x} key={x}>
                {l}
              </option>
            ))}
          </select>
          {errors.business_category && (
            <small className="field-error">{errors.business_category}</small>
          )}
        </label>
        <label className="field full">
          <span>Address or area</span>
          <input
            value={v.location}
            onChange={(e) => update("location", e.target.value)}
            placeholder="e.g. Assi Ghat, Varanasi, Uttar Pradesh"
          />
          {errors.location && (
            <small className="field-error">{errors.location}</small>
          )}
          <small className="hint">
            A nearby landmark or neighbourhood helps us find relevant businesses.
          </small>
        </label>
      </div>

      <div className="location-tools">
        <button type="button" className="text-button" onClick={useLocation}>
          <LocateFixed size={15} /> Use my current location
        </button>
        <span className="location-note">
          <MapPin size={13} /> Only accessed when you click
        </span>
        {geo && (
          <p className="geo-message" role="status">
            {geo}
          </p>
        )}
      </div>

      <div className="form-section-heading second">
        <span>02</span>
        <div>
          <h2>More context</h2>
          <p>Optional details make the comparison more useful.</p>
        </div>
      </div>

      <div className="form-grid">
        {field("google_rating", "Your Google rating", {
          optional: true,
          type: "number",
          min: "0",
          max: "5",
          step: "0.1",
          placeholder: "e.g. 4.2",
        })}
        {field("review_count", "Your review count", {
          optional: true,
          type: "number",
          min: "0",
          step: "1",
          placeholder: "e.g. 186",
        })}
        {field("website_url", "Website URL", {
          optional: true,
          placeholder: "https://yourbusiness.com",
        })}
        {field("google_business_profile_url", "Google Business Profile URL", {
          optional: true,
          placeholder: "https://maps.app.goo.gl/…",
        })}
        <label className="field full">
          <span>
            What do you offer? <em>Optional</em>
          </span>
          <input
            value={v.products_and_services}
            onChange={(e) => update("products_and_services", e.target.value)}
            placeholder="e.g. Banarasi silk sarees, custom blouse stitching"
          />
          <small className="hint">Separate services or products with commas.</small>
        </label>
        <label className="field full">
          <span>
            Business description <em>Optional</em>
          </span>
          <textarea
            rows="3"
            value={v.business_description}
            onChange={(e) => update("business_description", e.target.value)}
            placeholder="Briefly describe your business, what makes it useful, and what customers can expect."
          />
        </label>
        <label className="field full">
          <span>
            Who are your target customers? <em>Optional</em>
          </span>
          <input
            value={v.target_customer}
            onChange={(e) => update("target_customer", e.target.value)}
            placeholder="e.g. Families visiting Varanasi, domestic tourists"
          />
        </label>
      </div>

      <div className="form-footer">
        <p>
          <span className="required-mark">*</span> Required fields. Your details are
          used to run this audit.
        </p>
        <button className="button-primary" type="submit" disabled={loading}>
          {loading ? (
            "Preparing your audit…"
          ) : (
            <>
              Analyze my local market <ArrowUpRight size={16} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}