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
2. Upload a `.docx`, searchable `.pdf`, or `.txt` job description, or paste its text. Review the extracted text and add outcomes, requirements, and teachable skills.
3. Add the company's hiring steps and decision points.
4. Compare the role text with the 84-entry competency bank. The matching words and an excerpt appear beside each suggested competency. Review these possible matches, browse the bank, or add your own. Edit and include each competency. The app suggests a hiring step when its name and the step's format provide a clear match; review the reason and accept or override the suggested assignment.
5. Generate a draft kit with editable questions, follow-ups, 1/3/5 scoring anchors, and a manager guide. Print or save it as a PDF using the browser.

The anonymous Screen Printing Specialist example is illustrative. It contains no NTZ name, distinctive value names, schedule, or contact details. The competency suggestions and kit wording are deterministic placeholders; they are not AI-generated or validated by an HR reviewer.

The bank in `src/competencyBank.ts` contains original, editable, job-neutral examples. It is not a validated assessment or an official OPM/SHRM competency library. Role matching in `src/roleMatching.ts` and step recommendations in `src/recommendations.ts` are transparent keyword rules, not job analysis or evidence of validity. The company must choose job-relevant behaviors, use comparable questions or tasks, and review the generated questions and scoring anchors before use. For background, see [OPM's structured interview guide](https://www.opm.gov/policy-data-oversight/assessment-and-selection/structured-interviews/guide/) and [EEOC's selection procedures guidance](https://www.eeoc.gov/laws/guidance/employment-tests-and-selection-procedures).

## Prototype boundary

This is a single-browser design prototype. Uploaded files are read in the browser; the extracted text is saved in browser storage with the draft, while the original file is not retained. Files are limited to 10 MB, and PDFs to 25 pages. Image scans and protected documents have no supported text extraction; paste the text instead. Do not enter real candidate information or sensitive company records. Notes and scores on the printable kit are form fields for printing only; they are not stored as candidate records. Browser storage is not an account, database, backup, or access control system. Approval is a local draft flag, not an audit record.

## Next implementation slice

- Organization accounts, roles, invitations, and authorization checks on every record.
- A persistent database with company-scoped profiles, role versions, hiring steps, competencies, approved kit versions, hiring rounds, candidates, and scorecards.
- Server-side generation with a configurable AI provider, provenance for proposed competencies, editing, and human approval before publication.
- Secure scorecard upload storage and a review screen for confirming notes and scores. Handwriting extraction can follow once real forms have been tested.
- Retention settings and an audit trail for access, changes, approvals, and selection decisions.

## Railway preview

Railway can build the site with `npm run build` and start it with `npm start`. The start script serves the compiled `dist/` directory on Railway's `PORT`. No environment variables or database are needed for this browser-only prototype.

The preview has no authentication. Anyone with a generated public domain can load the app, so use sample data only. A production release needs company accounts and server-side access controls before real candidate information is entered.
