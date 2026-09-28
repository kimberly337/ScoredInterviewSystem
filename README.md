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
3. Add the company's hiring steps and decision points. The optional Reference check preset creates a final call sheet.
4. Compare the role text with the 84-entry competency bank. The matching words and an excerpt appear beside each suggested competency. Review these possible matches, browse the bank, or add your own. Edit and include each competency. The app suggests a hiring step when its name and the step's format provide a clear match; review the reason and accept or override the suggested assignment. If the reference step is used, select up to three included competencies to verify.
5. Generate a draft kit with editable interview questions, follow-ups, 1/3/5 scoring anchors, and a manager guide. The reference sheet uses the chosen competencies for editable core questions, prompts, notes, a 1–5 evidence rating, and a “Not observed” option. Print a separate copy for each reference or save the kit as a PDF using the browser.

The anonymous Screen Printing Specialist example is illustrative. It contains no NTZ name, distinctive value names, schedule, or contact details. The default suggestions and kit wording are deterministic placeholders. An administrator can optionally request AI suggestions and tailored questions; each remains an editable draft requiring review.

The bank in `src/competencyBank.ts` contains original, editable, job-neutral examples. It is not a validated assessment or an official OPM/SHRM competency library. Role matching in `src/roleMatching.ts` and step recommendations in `src/recommendations.ts` are transparent keyword rules, not job analysis or evidence of validity. The company must choose job-relevant behaviors, use comparable questions or tasks, and review the generated questions and scoring anchors before use. For background, see [OPM's structured interview guide](https://www.opm.gov/policy-data-oversight/assessment-and-selection/structured-interviews/guide/) and [EEOC's selection procedures guidance](https://www.eeoc.gov/laws/guidance/employment-tests-and-selection-procedures).

## Prototype boundary

This is a single-browser design prototype. Uploaded files are read in the browser; the extracted text is saved in browser storage with the draft, while the original file is not retained. Files are limited to 10 MB, and PDFs to 25 pages. Image scans and protected documents have no supported text extraction; paste the text instead. Do not enter real candidate or reference information or sensitive company records. Interview and reference notes, contact details, and ratings on the printable kit are temporary form fields for printing only; they are not stored as candidate records. Browser storage is not an account, database, backup, or access control system. Approval is a local draft flag, not an audit record.

## Next implementation slice

- Organization accounts, roles, invitations, and authorization checks on every record.
- A persistent database with company-scoped profiles, role versions, hiring steps, competencies, approved kit versions, hiring rounds, candidates, and scorecards.
- Organization-scoped AI access, provenance for proposed competencies, and human approval records before publication.
- Secure scorecard upload storage and a review screen for confirming notes and scores. Handwriting extraction can follow once real forms have been tested.
- Retention settings and an audit trail for access, changes, approvals, and selection decisions.

## Railway preview

Railway builds with `npm run build` and starts with `npm start`. Set `ADMIN_PASSWORD` to a unique, strong password in the app service's Variables tab, then open `/admin` to sign in. This protects the error monitor and AI drafting. Set `OPENAI_API_KEY` in the same Variables tab to enable AI. You may set `OPENAI_MODEL` to a supported model; the default is `gpt-4.1-mini`. Never put the key in the browser, a `.env` file committed to GitHub, or a chat message. Redeploy after changing variables.

For error history across restarts, add a Railway Postgres service and set the app service's `DATABASE_URL` to a reference to that service's `DATABASE_URL`. The server creates its error table at first use, groups repeated errors, and removes records older than 90 days at startup. Without the database, the monitor displays recent events only until the app restarts, while Railway logs still contain error codes. Reports include error type and code location, not messages, stacks, job details, or candidate notes. The admin password is required even when the database is absent.

AI buttons make an explicit server request that sends the role description, company values, hiring steps, and selected competencies to OpenAI. Requests require the admin session, are limited to ten per hour per IP, and never expose the API key to the browser. AI provider failures appear in `/admin` as error codes. Configure API usage limits in the OpenAI account as an additional cost control. Do not enter real candidate or sensitive company information in this prototype.

The design workspace itself is public. Anyone with the domain can load it; its draft stays in that browser only. A production release needs company accounts and server-side access controls before real candidate information is entered.
