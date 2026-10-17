# GlowUp Local

**AI-powered local visibility and competitor intelligence for Varanasi businesses.**

GlowUp Local helps local business owners understand their nearby competitors, identify gaps in their online presence, and discover practical ways to improve their visibility on Google Search and Google Maps.

The initial target customers are hotels, guesthouses, cafés, restaurants, and saree shops in Varanasi, India.

Instead of overwhelming business owners with SEO metrics, GlowUp Local uses local business data and Gemma to generate an evidence-based, prioritized action plan.

> **Core idea:** Help local businesses understand what they can improve, why it matters, and what they should do next.

---

## Table of Contents

- [The Problem](#the-problem)
- [Our Solution](#our-solution)
- [MVP Features](#mvp-features)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [AI Recommendation Design](#ai-recommendation-design)
- [Privacy and Security](#privacy-and-security)
- [Reliability and Limitations](#reliability-and-limitations)
- [Testing and Evaluation](#testing-and-evaluation)
- [Why Open Innovation Matters](#why-open-innovation-matters)
- [Future Improvements](#future-improvements)
- [Hacktoberfest Week 2 Submission](#hacktoberfest-week-2-submission)

## The Problem

Varanasi attracts tourists throughout the year, creating opportunities for local hotels, guesthouses, restaurants, cafés, and traditional saree businesses.

However, many small business owners lack the resources or expertise to understand their online competition and improve their digital presence.

They often struggle to answer questions such as:

- Which nearby businesses compete with mine?
- How does my online business listing compare with theirs?
- Is important information missing from my listing or website?
- What should I improve first?
- How can I respond professionally to customer reviews?
- Which changes should I make to attract more relevant customers?

Existing SEO tools can be expensive, complicated, or designed for experienced marketers.

Small business owners need actionable recommendations, not another dashboard full of numbers.

## Our Solution

GlowUp Local is an AI-powered local business audit tool that combines publicly available business information, deterministic comparisons, and Gemma-generated recommendations.

A business owner provides their business details and location. The application discovers relevant nearby competitors, compares available information, and generates a practical report highlighting potential improvement opportunities.

The goal is to make local competitor analysis understandable and actionable for businesses without dedicated marketing teams.

### Who is it for?

- Hotels and guesthouses
- Restaurants and cafés
- Banarasi saree and textile shops
- Other location-based small businesses

The MVP focuses on one business at a time, starting with businesses in Varanasi.

## MVP Features

### 1. Business Onboarding

Business owners can provide:

- Business name
- Business category
- Address or location
- Products and services
- Website URL, if available
- Google Business Profile URL, if available
- Target customer or audience

This information establishes the context for the audit.

### 2. Location-Based Competitor Discovery

The owner can choose to share their current location or enter an address manually.

Using the Google Places API, the backend discovers relevant businesses within a configurable search radius.

The application displays available information, such as:

- Business name and category
- Location and approximate distance
- Google rating and review count, when available
- Website or other available business details

The application requests only the fields needed for the audit and follows applicable API terms.

### 3. Evidence-Based Competitor Comparison

The application compares available information about the owner's business and nearby competitors.

Examples of potential findings include:

- Missing website or service information
- Incomplete business descriptions
- Differences in publicly available ratings and review counts
- Opportunities to explain products or services more clearly
- Missing information that customers may need before visiting

A missing data field is treated as unknown, not as proof that a business lacks that feature.

### 4. Gemma-Powered AI Recommendations

Gemma analyzes the structured business information and comparison results to generate prioritized recommendations.

Each recommendation should include:

- The improvement opportunity
- Why it may matter
- Supporting evidence
- Practical implementation steps
- Estimated effort
- A metric or observation to track afterward

The AI is designed to assist decision-making, not to invent facts or guarantee search-ranking improvements.

### 5. Business Content Assistant

The application can help owners draft:

- Business descriptions
- Product and service descriptions
- Responses to customer reviews
- Polite messages requesting honest customer feedback
- Locally relevant content ideas

Generated content remains editable and should be reviewed before publication.

### 6. Actionable Audit Report

The final report combines competitor information with AI-generated recommendations.

The report prioritizes a small number of practical actions instead of overwhelming owners with a long list of generic SEO suggestions.

The initial version focuses on generating a useful report. Persistent audit history, automated monitoring, and scheduled reports can be added later.

## How It Works

The application follows a straightforward workflow.

1. **Business input:** The owner enters their business details and selects a location.
2. **Location handling:** The browser requests location permission when the owner chooses to use their current location. Manual address entry is available as a fallback.
3. **Competitor discovery:** FastAPI queries Google Places API for relevant nearby businesses.
4. **Data normalization:** The backend normalizes returned fields and handles unavailable information.
5. **Deterministic comparison:** Python calculates comparable values, such as approximate distances, and organizes the available evidence.
6. **AI analysis:** Gemma receives the structured evidence and generates prioritized recommendations.
7. **Output validation:** The backend validates the model's response before returning it.
8. **Report presentation:** React displays the competitor comparison and recommended actions.

### Example Scenario

Imagine a guesthouse near Assi Ghat.

The owner submits the business details and requests a local competitor audit.

The application discovers nearby guesthouses and compares available listing information. It identifies that some competitors provide clearer information about room amenities, check-in arrangements, and available services.

If the owner's own listing lacks this information, the AI may recommend verifying and adding the missing details, improving room photographs, and answering unanswered customer reviews.

These are potential improvement opportunities, not proof that the differences caused competitors to rank higher.

## Architecture

```text
                    BUSINESS OWNER
                          |
                          v
                 REACT FRONTEND
             Business Form / Audit Report
                          |
                    HTTPS / JSON
                          |
                          v
                  FASTAPI BACKEND
                          |
              +-----------+-----------+
              |                       |
              v                       v
       GOOGLE PLACES API       BUSINESS VALIDATION
       Nearby Businesses       Input / Data Cleanup
              |                       |
              +-----------+-----------+
                          |
                          v
                DETERMINISTIC ANALYSIS
               Comparison / Evidence
                          |
                          v
                    GEMMA MODEL
               Prioritized Recommendations
                          |
                          v
                 PYDANTIC VALIDATION
                          |
                          v
                 STRUCTURED AUDIT
                          |
                          v
                  REACT REPORT UI
```

### Why not LangGraph in the first version?

The initial workflow is mostly linear:

`Validate → Discover → Compare → Analyze → Validate Output → Return Report`

A regular Python service layer is easier to build, test, and debug for this workflow.

LangGraph may become useful later for conditional workflows, retry strategies, persistent state, human approval, or recurring monitoring. It is not required simply because the application uses an LLM.

## Tech Stack

| Technology | Purpose |
|---|---|
| React + Vite | Frontend and user interface |
| Python | Backend logic and data processing |
| FastAPI | API endpoints and service orchestration |
| Pydantic | Input validation and structured AI output |
| Google Places API (New) | Nearby business discovery |
| Gemma | AI-powered business analysis and recommendations |
| Hugging Face Inference Provider or compatible endpoint | Hosted Gemma inference for the MVP |
| Render | Application deployment |
| pytest | Backend testing |

### Optional technologies for later versions

- **PostgreSQL:** Save business profiles and audit history.
- **LangGraph:** Orchestrate workflows that genuinely need branching or persistent state.
- **Sentry:** Monitor errors, latency, and failures.
- **pgvector:** Add semantic retrieval if the product later needs it.

These technologies are not prerequisites for the initial MVP.

## Project Structure

```text
kashi-growth-ai/
├── README.md
├── requirements.txt
├── .env.example
├── .gitignore
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   └── routes.py
│   │   ├── core/
│   │   │   └── config.py
│   │   ├── schemas/
│   │   │   └── audit.py
│   │   └── services/
│   │       ├── places.py
│   │       ├── gemma.py
│   │       ├── comparison.py
│   │       └── audit.py
│   │
│   └── tests/
│       ├── test_health.py
│       └── test_comparison.py
│
├── frontend/
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       ├── api.js
│       ├── components/
│       │   ├── BusinessForm.jsx
│       │   ├── CompetitorTable.jsx
│       │   └── RecommendationCard.jsx
│       └── pages/
│           └── AuditPage.jsx
│
└── docs/
    ├── architecture.md
    └── demo-script.md
```

### Important files

- `main.py` — creates the FastAPI application and exposes the health endpoint.
- `routes.py` — defines API endpoints for audits and competitor discovery.
- `config.py` — loads environment variables and configuration.
- `schemas/audit.py` — defines validated request and response models.
- `services/places.py` — integrates with Google Places API.
- `services/comparison.py` — calculates comparisons using deterministic Python logic.
- `services/gemma.py` — handles model inference and response parsing.
- `services/audit.py` — coordinates the audit workflow.

## Getting Started

### Prerequisites

Install the following before running the project:

- Python 3.11 or a compatible version supported by the selected dependencies
- Node.js and npm
- A Google Maps Platform project with Places API access and billing configured as required
- A Hugging Face token and access to a compatible Gemma inference provider or endpoint

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/kashi-growth-ai.git
cd kashi-growth-ai
```

Replace the example repository URL with your actual GitHub repository.

### 2. Create a Python virtual environment

```bash
python -m venv .venv
```

Activate it on Linux or macOS:

```bash
source .venv/bin/activate
```

On Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

### 3. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Copy `.env.example` to `.env` and add the credentials for the providers you have configured.

Example:

```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
HF_TOKEN=your_hugging_face_token
HF_MODEL=google/gemma-3-4b-it
FRONTEND_ORIGIN=http://localhost:5173
```

The model identifier above is an example. Confirm that your selected Hugging Face inference provider or endpoint supports that model before using it.

Never commit `.env` or expose server-side API keys in frontend code.

### 5. Run the backend

From the repository root:

```bash
uvicorn backend.app.main:app --reload
```

When implemented, the local endpoints should be available at:

- Health check: `http://127.0.0.1:8000/health`
- Interactive API documentation: `http://127.0.0.1:8000/docs`

### 6. Run the frontend

After creating the React + Vite application and implementing the frontend files:

```bash
cd frontend
npm install
npm run dev
```

Configure the frontend API client to use the local FastAPI backend during development.

> **Implementation status:** These instructions describe the intended setup. They do not imply that every file or endpoint has already been implemented.

## AI Recommendation Design

The AI should produce structured recommendations rather than unrestricted paragraphs.

A recommendation can follow this schema:

```json
{
  "title": "Improve the business service description",
  "priority": "high",
  "reason": "The available listing information does not clearly describe the services offered.",
  "evidence": [
    "owner_listing_missing_service_details"
  ],
  "action_steps": [
    "Verify the services currently offered",
    "Add an accurate service description",
    "Review the updated listing for clarity"
  ],
  "effort": "low",
  "measurement": "Check whether customers can find the relevant service information",
  "confidence": "medium"
}
```

This is an illustrative output, not a claim about a real business.

The backend should:

1. Send Gemma only the necessary structured evidence.
2. Request a response that follows the expected schema.
3. Validate the output using Pydantic.
4. Reject malformed or unsupported findings.
5. Return a clear error or safe fallback if model inference fails.

The model must not be allowed to execute generated code or SQL.

## Privacy and Security

Privacy and responsible data handling are important because business owners may provide location and business information.

- **Explicit location permission:** Request browser geolocation only after the owner chooses to use their current location.
- **Manual fallback:** Allow address entry or map-pin selection if permission is denied.
- **No continuous tracking:** A single location lookup is sufficient for the nearby competitor search.
- **API key protection:** Keep provider credentials on the backend and restrict keys where supported.
- **Data minimization:** Collect only information necessary to perform the audit.
- **Provider transparency:** Explain when information is sent to a hosted AI inference provider.
- **Output validation:** Treat model output as untrusted and validate it before display.
- **Data-source compliance:** Follow applicable Google Maps Platform API terms, field requirements, attribution rules, and restrictions on caching or storing data.

Using an open-weight model does not automatically make the application private. Hosted inference still involves sending data to an external provider. A self-hosted deployment would require separate verification of the entire data flow.

## Reliability and Limitations

GlowUp Local is intended to provide decision support, not guaranteed SEO outcomes.

The initial version has several limitations:

- Nearby business data may be incomplete or unavailable.
- Ratings and review counts do not explain why a competitor ranks higher.
- Public listing information is not a complete view of Google's ranking systems.
- AI recommendations may be imperfect and should be grounded in evidence.
- Search results depend on location, category, API coverage, and query parameters.
- Model availability, latency, inference limits, and cost depend on the selected provider.
- A generated recommendation does not guarantee increased traffic, customers, or revenue.

The application should never fabricate missing competitor data, promise specific Google rankings, or automatically modify a business listing without explicit authorization.

Businesses should also be encouraged to request honest reviews from genuine customers, without incentives or selectively soliciting only positive reviews.

## Testing and Evaluation

The MVP should be evaluated on whether it provides reliable and useful recommendations.

### Functional tests

- Valid business input is accepted.
- Invalid input is rejected.
- Location permission denial has a manual fallback.
- Nearby competitor data is normalized correctly.
- Missing API fields do not cause incorrect comparisons.
- Malformed model responses are handled safely.
- External API timeouts produce understandable errors.

### AI quality checks

Evaluate the same set of representative business scenarios and record:

- Evidence support: are recommendations backed by supplied facts?
- Output validity: does the response follow the required schema?
- Actionability: can the owner perform the recommended steps?
- Specificity: are recommendations tailored to the business category?
- Latency: how long does an audit take?
- Cost: what is the approximate inference cost per completed audit?
- Usefulness: would local business owners actually use the report?

Where possible, ask a small number of local business owners to review the recommendations and provide feedback.

## Why Open Innovation Matters

GlowUp Local explores how open-weight AI can make practical business intelligence more accessible to small businesses.

We chose Gemma because we want to evaluate an open-weight model rather than assume every AI feature must depend on a proprietary model API.

For this MVP, Gemma gives us flexibility to experiment with model selection, deployment options, and future specialization for Varanasi's hotels, restaurants, cafés, and saree shops. We can measure whether it can turn structured competitor information into useful, consistent recommendations at a cost that makes sense for a small-business product.

**Cost matters.** Small businesses are unlikely to benefit from an AI tool if the cost of generating reports makes the service commercially unsustainable. We therefore want to measure inference cost per audit, response latency, output quality, and the operational effort required to serve users.

Open-weight models may allow us to run inference on infrastructure we control, but self-hosting is not automatically cheaper. Compute, hosting, reliability, and maintenance can outweigh the savings at low usage. For the challenge MVP, we plan to use a compatible hosted inference endpoint so we can focus on building and evaluating the product.

**Privacy matters too.** Open weights create the option to self-host a model and reduce reliance on external inference providers. However, our initial hosted setup will still be subject to the provider's policies and terms. We will not claim that customer data remains entirely on our own infrastructure unless we actually self-host the model and verify the full data flow.

**Specialization is a future opportunity.** If real evaluations show that general prompting is insufficient, we can investigate whether additional examples or fine-tuning improve recommendations for local business categories and Hindi-English workflows. Fine-tuning is not required for the initial MVP; first, we need a reliable baseline.

Finally, an open-weight approach gives us more options as the product evolves. We can compare providers and deployment methods instead of making the entire application dependent on one vendor's pricing and availability.

Our goal is not to claim that open AI is always better than closed AI. It is to test whether an open-based approach can deliver useful recommendations, acceptable costs, and appropriate control for the businesses we want to serve.

## Future Improvements

After validating the core audit workflow, possible improvements include:

- Saved business profiles and audit history using PostgreSQL
- Scheduled competitor monitoring and alerts
- Google Business Profile performance data, where authorized access is available
- Hindi and English report generation
- More detailed review sentiment analysis
- Monthly business improvement reports
- Exportable PDF reports
- Additional business categories and location support
- Workflow orchestration with LangGraph if complexity justifies it

These are future possibilities, not requirements for the initial MVP.

## Hacktoberfest Week 2 Submission

GlowUp Local is being developed for the Hacktoberfest Open-Source AI Challenge Week 2: Side Hustle.

The project aims to demonstrate how open-weight AI can support a practical business workflow with a plausible paying customer.

Before submitting, make sure the project has:

- A working deployed demo or clear demonstration video
- A public source repository with setup instructions
- A realistic end-to-end business audit example
- A clear explanation of the problem and target customer
- Evidence of meaningful Gemma integration
- A clear explanation of open innovation and its trade-offs
- An honest account of current limitations
- The required DEV submission format and challenge tag

Official challenge page:

https://dev.to/challenges/hacktoberfest-week2-2026-10-12

Check the official rules for the final submission deadline, template, prize-category conditions, and judging requirements.

---

**GlowUp Local — helping local businesses make better decisions with evidence and open AI.**
