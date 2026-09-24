# E Factor Leadership Interview Design Studio

An early prototype for creating structured interview kits from a company's values, role description, and hiring process.

## Run locally

Requires Node.js 20.19+.

```bash
npm install
npm run dev
```

The setup draft is saved in the current browser's local storage. `npm run build` compiles the frontend to `dist/`.

## Current workflow

1. Describe the company and give observable examples for each value.
2. Enter a role description, outcomes, requirements, and teachable skills.
3. Add the company's hiring steps and decision points.
4. Generate rule-based competency suggestions from the role text and values. Edit, include, and assign each competency to a step.
5. Generate a draft kit with editable questions, follow-ups, 1/3/5 scoring anchors, and a manager guide. Print or save it as a PDF using the browser.

The anonymous Screen Printing Specialist example is illustrative. It contains no NTZ name, distinctive value names, schedule, or contact details. The competency suggestions and kit wording are deterministic placeholders; they are not AI-generated or validated by an HR reviewer.

## Prototype boundary

This is a single-browser design prototype. Do not enter real candidate information or sensitive company records. Notes and scores on the printable kit are form fields for printing only; they are not stored as candidate records. Browser storage is not an account, database, backup, or access control system. Approval is a local draft flag, not an audit record.

## Next implementation slice

- Organization accounts, roles, invitations, and authorization checks on every record.
- A persistent database with company-scoped profiles, role versions, hiring steps, competencies, approved kit versions, hiring rounds, candidates, and scorecards.
- Server-side generation with a configurable AI provider, provenance for proposed competencies, editing, and human approval before publication.
- Secure scorecard upload storage and a review screen for confirming notes and scores. Handwriting extraction can follow once real forms have been tested.
- Retention settings and an audit trail for access, changes, approvals, and selection decisions.

## Railway preview

Railway can build the site with `npm run build` and start it with `npm start`. The start script serves the compiled `dist/` directory on Railway's `PORT`. No environment variables or database are needed for this browser-only prototype.

The preview has no authentication. Anyone with a generated public domain can load the app, so use sample data only. A production release needs company accounts and server-side access controls before real candidate information is entered.
