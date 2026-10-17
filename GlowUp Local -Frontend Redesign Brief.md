# GlowUp Local — Frontend Redesign Brief

Act as a senior product designer and frontend engineer. Redesign the existing GlowUp Local frontend into a polished, production-quality local business intelligence application.

## First: Inspect, don't immediately code

1. Read the existing frontend source code and project structure.
2. Understand the current backend API integration and response schemas.
3. Identify existing reusable components and styling problems.
4. Preserve working functionality and existing API contracts.
5. Create a concise implementation plan before modifying files.

## Design direction

The visual identity is **Local Market Intelligence Journal**.

The product should feel like a premium editorial research publication combined with a modern business intelligence tool.

Retain the warm ivory, deep navy, terracotta, Newsreader, DM Sans and DM Mono direction, but improve its usability and visual richness.

## Non-negotiable design requirements

- Body text: 16–18px.
- Form labels: 14–15px minimum.
- Supporting text: 13–14px minimum.
- Navigation: approximately 14px.
- Section headings: 30–36px.
- Main container: approximately 1160px.
- Remove unnecessary whitespace and oversized empty sections.
- Improve content density without making the interface cramped.
- Maintain strong contrast and accessible focus states.
- Use consistent spacing and typography tokens.
- Make the primary action immediately visible.
- The first viewport must communicate the product and reveal the beginning of the business form.

## Avoid AI-generated design clichés

Do NOT use:
- Purple/blue gradients.
- Generic SaaS dashboard templates.
- Repeated identical cards for every section.
- Floating decorative icon pills.
- Centered hero + three identical feature cards.
- Excessive rounded corners.
- Tiny uppercase text everywhere.
- Unnecessary glassmorphism.
- Random illustrations and decorative blobs.
- Excessive whitespace.
- Animations without a functional purpose.

## Product-specific visual identity

Communicate local market intelligence through restrained editorial details:

- Report numbering and section identifiers.
- Evidence labels and data-source indicators.
- Competitor comparison tables.
- Clear metric hierarchy.
- Priority labels for recommendations.
- Subtle geographic or research-inspired visual details where appropriate.

Do not invent data or features that the backend does not provide.

## Component architecture

Use reusable components for layout, typography, buttons, form fields, metrics, competitor information, recommendations, and report sections.

Avoid unnecessary abstraction.

Keep the existing React + Vite architecture unless there is a compelling technical reason to change it.

## Motion

Use restrained transitions:
- 150–250ms hover and focus transitions.
- Subtle section entrance.
- Clear loading and generation states.
- Smooth expandable report sections.

Respect prefers-reduced-motion.

## Performance and accessibility

Target Core Web Vitals:
- LCP ≤ 2.5 seconds.
- INP ≤ 200ms.
- CLS ≤ 0.1.

Use semantic HTML, keyboard-accessible controls, optimized fonts, reserved image dimensions, and minimal dependencies.

## Backend integration — critical

- Do not modify backend routes or response schemas.
- Preserve POST /api/v1/audits and GET /health.
- Preserve the existing API base URL configuration.
- Preserve request payload fields.
- Preserve report rendering for actual backend responses.
- Preserve loading, error, and empty states.
- Never replace real API data with hardcoded demonstration data.

## Implementation process

1. Establish design tokens.
2. Redesign the landing page and business form.
3. Redesign the audit report.
4. Make all pages responsive.
5. Add restrained motion.
6. Run the production build.
7. Fix all errors.
8. Test the backend integration and verify every report section.

Do not stop after producing a pretty landing page. The entire working application must be redesigned.

Prioritize readability, clear hierarchy, useful information density, and a distinctive product identity over decorative effects.