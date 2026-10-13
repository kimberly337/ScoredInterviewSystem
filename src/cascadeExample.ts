// Reviewed fictional test kit. Loading creates an independent browser draft.
export const cascadeExample = () => ({
  "company": "Cascade Workplace Services — Fictional Test",
  "culture": "A fictional 32-person company in Bend, Oregon, coordinating office supplies, equipment maintenance, and workplace vendors for small businesses. The culture is collaborative and practical. Managers explain priorities and give direct feedback. Employees ask questions, raise concerns early, and acknowledge mistakes. Work is hybrid, with three designated office days and two remote days each week.",
  "role": "Client Operations Coordinator",
  "description": "Cascade Workplace Services helps small businesses manage office supplies, equipment maintenance, and workplace service vendors. The Client Operations Coordinator manages requests from intake through completion. Receive and prioritize requests through email, phone and our service platform. Schedule vendors and confirm appointments, pricing and completion. Maintain accurate client records, service notes and invoice documentation. Communicate delays and explain next steps. Resolve routine issues and escalate concerns involving cost, safety or client dissatisfaction. Coordinate coverage and leave clear handoff notes. Identify recurring problems and suggest practical improvements. Requires two years of customer service, administrative coordination or operations experience; competing-deadline management; clear written and verbal communication; comfort with spreadsheets, shared calendars and customer management software; and independent work while keeping teammates informed. Vendor coordination experience helpful but not required. Monday–Friday, 8:30 a.m.–5 p.m. Pacific in Bend, Oregon. Hybrid with three designated office days and two remote days weekly. First four weeks of onboarding are in office five days per week.",
  "outcomes": "By 90 days, manage routine requests independently, maintain complete records, provide timely client updates, coordinate reliable vendor appointments, and recognize when an issue needs a manager’s attention.",
  "challenges": "Missed vendor appointments, competing client deadlines, invoice discrepancies, teammate absences, and keeping clients and teammates informed as priorities change.",
  "requirements": "Two years of relevant service or coordination experience. Organization and prioritization, attention to detail, clear communication, customer service, accountability and reliability, collaboration, problem solving, adaptability and response to feedback.",
  "teachable": "Our service platform, vendor network, pricing approval process, client record standards, escalation procedures and industry-specific knowledge.",
  "values": [
    {
      "id": "cascade-value-0",
      "name": "Follow through",
      "behavior": "Track commitments and flag delays early.",
      "concern": "Miss deadlines without warning."
    },
    {
      "id": "cascade-value-1",
      "name": "Make communication useful",
      "behavior": "Explain next steps, ownership, and timing.",
      "concern": "Leave others guessing."
    },
    {
      "id": "cascade-value-2",
      "name": "Treat people with respect",
      "behavior": "Handle disagreements professionally.",
      "concern": "Dismiss concerns or blame others."
    },
    {
      "id": "cascade-value-3",
      "name": "Own mistakes and learn",
      "behavior": "Correct errors and apply feedback.",
      "concern": "Hide mistakes or repeat avoidable errors."
    },
    {
      "id": "cascade-value-4",
      "name": "Improve everyday work",
      "behavior": "Suggest practical improvements to recurring problems.",
      "concern": "Ignore repeated problems."
    }
  ],
  "stages": [
    {
      "id": "cascade-screen",
      "name": "Initial/Screening interview",
      "template": "Initial/Screening interview",
      "owner": "Hiring manager or HR",
      "method": "25–30 minute conversation",
      "purpose": "Relevant work history, reasons for job changes, interest in the role, relevant experience, and availability for the hybrid schedule.",
      "advance": "Experience and availability align with the role requirements.",
      "questionCount": 1
    },
    {
      "id": "cascade-manager",
      "name": "Hiring Manager interview",
      "template": "Hiring Manager interview",
      "owner": "Hiring manager or HR",
      "method": "45–50 minute structured behavioral interview",
      "purpose": "Job-related examples of communication, service, reliability, collaboration, problem solving and response to feedback.",
      "advance": "Examples provide sufficient evidence against the defined scoring guidance.",
      "questionCount": 8
    },
    {
      "id": "cascade-sample",
      "name": "Work sample and team discussion",
      "template": "custom",
      "owner": "Director of Operations and a teammate",
      "method": "35–40 minute practical exercise and discussion",
      "purpose": "It is 9 a.m. A vendor missed a client appointment yesterday, another client needs a quote by noon, an invoice differs from approved pricing, and an absent teammate has left two requests without an owner. Assess prioritization, accuracy, escalation, a client update and a handoff note.",
      "advance": "Accurate work, explained priorities, clear updates and appropriate escalation.",
      "questionCount": 4
    },
    {
      "id": "cascade-reference",
      "name": "Reference check",
      "template": "Reference check",
      "owner": "Hiring manager or HR",
      "method": "20–25 minute structured reference call",
      "purpose": "Rehire eligibility, teamwork, communication, reliability, detail, feedback, strengths, development needs and support for success.",
      "advance": "Review observed examples alongside interview evidence and identify onboarding support.",
      "questionCount": 0
    }
  ],
  "competencies": [
    {
      "id": "cascade-competency-0",
      "name": "Organization and Prioritization",
      "source": "Reviewed fictional example",
      "evidence": "Manage requests from intake through completion, prioritize requests via multiple channels, and handle competing deadlines.",
      "stageId": "cascade-manager",
      "included": true
    },
    {
      "id": "cascade-competency-1",
      "name": "Clear and Useful Communication",
      "source": "Reviewed fictional example",
      "evidence": "Communicate delays, explain next steps, ownership, and timing to clients and teammates.",
      "stageId": "cascade-manager",
      "included": true
    },
    {
      "id": "cascade-competency-2",
      "name": "Attention to Detail and Accountability",
      "source": "Reviewed fictional example",
      "evidence": "Maintain accurate client records, service notes, invoice documentation, and flag delays early.",
      "stageId": "cascade-sample",
      "included": true
    },
    {
      "id": "cascade-competency-3",
      "name": "Problem Solving and Continuous Improvement",
      "source": "Reviewed fictional example",
      "evidence": "Identify recurring problems and suggest practical improvements; resolve routine issues and escalate appropriately.",
      "stageId": "cascade-manager",
      "included": true
    },
    {
      "id": "cascade-competency-4",
      "name": "Customer Service and Professional Respect",
      "source": "Reviewed fictional example",
      "evidence": "Handle client requests professionally, treat people with respect, manage disagreements well.",
      "stageId": "cascade-manager",
      "included": true
    },
    {
      "id": "cascade-competency-5",
      "name": "Adaptability and Collaborative Teamwork",
      "source": "Reviewed fictional example",
      "evidence": "Coordinate coverage and handoff notes during teammate absences; work independently while keeping teammates informed.",
      "stageId": "cascade-screen",
      "included": true
    }
  ],
  "items": [
    {
      "id": "cascade-screen:item:0",
      "questionKey": "cascade-screen:0",
      "competencyId": "cascade-competency-5",
      "question": "Describe a time when you had to cover for a coworker who was unexpectedly absent. How did you ensure your team stayed informed and work continued smoothly?",
      "probe": "What steps did you take to communicate with others and manage your own workload during this period?",
      "low": "Does not identify who needed updates or gives an unclear handoff that leaves work unowned.",
      "meets": "Clarifies coverage priorities, gives teammates usable handoff notes, and tracks agreed responsibilities.",
      "high": "Checks dependencies and capacity, coordinates coverage, and follows up to confirm work and updates reached the right people."
    },
    {
      "id": "cascade-manager:item:0",
      "questionKey": "cascade-manager:0",
      "competencyId": "cascade-competency-0",
      "question": "Tell me about a time when you had multiple client requests or tasks with competing deadlines. How did you organize and prioritize to complete them successfully?",
      "probe": "How did you decide the order of tasks and adjust when priorities changed?",
      "low": "Cannot explain priorities or ignores known deadlines and client impact without raising concerns.",
      "meets": "Uses urgency, impact and dependencies to set priorities; tracks deadlines and informs others of changes.",
      "high": "Anticipates bottlenecks, explains tradeoffs, seeks help when needed, and adjusts the plan while keeping commitments visible."
    },
    {
      "id": "cascade-manager:item:1",
      "questionKey": "cascade-manager:1",
      "competencyId": "cascade-competency-1",
      "question": "Give an example of when you had to communicate a delay or change to a client or teammate. How did you make your communication clear and useful?",
      "probe": "What details did you include to explain next steps and ownership?",
      "low": "Notified the delay without explaining the cause or next steps, causing confusion or frustration.",
      "meets": "Clearly explained the delay, outlined next steps and who was responsible, and provided an estimated timeline.",
      "high": "Communicated proactively with empathy, provided actionable solutions, confirmed understanding, and followed up with updates promptly."
    },
    {
      "id": "cascade-manager:item:2",
      "questionKey": "cascade-manager:2",
      "competencyId": "cascade-competency-3",
      "question": "Describe a situation where you identified a recurring problem in your work process or team operations. What practical improvement did you suggest or implement?",
      "probe": "How did you come to identify the problem and what was the outcome of your suggestion?",
      "low": "Proposes action without checking the recurring problem or ignores feedback about its effect.",
      "meets": "Checks examples of the problem, suggests a practical improvement, and describes how its effect could be assessed.",
      "high": "Tests an improvement within their authority, gathers feedback, and explains what was learned and adjusted."
    },
    {
      "id": "cascade-manager:item:3",
      "questionKey": "cascade-manager:3",
      "competencyId": "cascade-competency-4",
      "question": "Tell me about a time when you handled a disagreement or conflict professionally with a client or colleague. How did you maintain respect and find a resolution?",
      "probe": "What steps did you take to manage emotions and focus on solutions?",
      "low": "Responded defensively or escalated conflict, damaging the relationship.",
      "meets": "Managed the disagreement calmly, listened respectfully, and reached an acceptable resolution for all parties.",
      "high": "Skillfully de-escalated tension, built rapport, and transformed the disagreement into a productive conversation leading to improved collaboration."
    },
    {
      "id": "cascade-manager:item:4",
      "questionKey": "cascade-manager:4",
      "competencyId": "cascade-competency-0",
      "question": "Tell me about a time you coordinated several appointments, service requests, or shared deadlines with competing needs. How did you check availability, confirm arrangements, and handle changes? Your example may come from any relevant industry.",
      "probe": "What tools or techniques did you use to avoid conflicts and confirm appointments?",
      "low": "Does not confirm key arrangements or leaves known conflicts unresolved without notifying others.",
      "meets": "Uses reliable records to check conflicts, confirms arrangements, and communicates changes to affected people.",
      "high": "Anticipates dependencies, prepares workable alternatives, and verifies that revised arrangements were understood."
    },
    {
      "id": "cascade-manager:item:5",
      "questionKey": "cascade-manager:5",
      "competencyId": "cascade-competency-1",
      "question": "Can you provide an example where your clear written communication prevented a misunderstanding or error in client service?",
      "probe": "What did you include in your communication to ensure clarity?",
      "low": "Wrote unclear messages that led to confusion or rework.",
      "meets": "Composed clear, concise messages including all relevant details that ensured client understanding and accurate follow-through.",
      "high": "Crafted detailed yet easily understandable communications anticipating potential questions, minimizing back-and-forth and strengthening client trust."
    },
    {
      "id": "cascade-manager:item:6",
      "questionKey": "cascade-manager:6",
      "competencyId": "cascade-competency-3",
      "question": "Recall a time when you resolved a routine issue independently but knew when to escalate a problem involving cost, safety, or client dissatisfaction. How did you make that determination?",
      "probe": "What was your approach to solving the issue and deciding escalation?",
      "low": "Either escalated minor issues unnecessarily or failed to escalate important problems causing bigger issues.",
      "meets": "Resolved routine problems independently and escalated significant concerns appropriately following company guidelines.",
      "high": "Demonstrated sound judgment by balancing resolution and escalation, documented clearly, communicated proactively with stakeholders, and helped prevent escalation of the issue."
    },
    {
      "id": "cascade-manager:item:7",
      "questionKey": "cascade-manager:7",
      "competencyId": "cascade-competency-4",
      "question": "Describe a time a client or teammate gave you constructive feedback about how you handled a service request. How did you respond, what did you change, and what happened afterward?",
      "probe": "How did you handle the situation and what was the outcome?",
      "low": "Dismisses feedback, blames others, or makes no relevant change to the approach.",
      "meets": "Listens, clarifies the concern, makes a relevant change, and describes its outcome.",
      "high": "Seeks specific examples, applies the feedback, checks whether the change helped, and carries learning into later requests."
    },
    {
      "id": "cascade-sample:item:0",
      "questionKey": "cascade-sample:0",
      "competencyId": "cascade-competency-2",
      "question": "Work sample: At 9 a.m., you have four issues: a vendor missed yesterday’s client appointment, another client needs a quote by noon, invoice INV-204 is $525 although the approved quote is $450, and an absent teammate left two open requests without owners. Prepare a short issue list. Identify what you can confirm, what is missing, and which records you would check before acting.",
      "probe": "How do you track and flag discrepancies or missing information?",
      "low": "Treats assumptions as confirmed facts or misses the invoice mismatch and missing owners.",
      "meets": "Identifies the four issues and $75 mismatch, distinguishes missing facts, and names relevant records to check.",
      "high": "Also identifies dependencies and explains how to verify the records before making commitments or changes."
    },
    {
      "id": "cascade-sample:item:1",
      "questionKey": "cascade-sample:1",
      "competencyId": "cascade-competency-2",
      "question": "Using the same work sample, create an action tracker for the four issues. Include an owner, next action, deadline or next update time, and how you will confirm completion. Explain how you would arrange coverage without losing your existing commitments.",
      "probe": "What tools or habits help you track your commitments and flag delays early?",
      "low": "Leaves issues without an owner, next action or update time.",
      "meets": "Provides a workable owner, next action and deadline or update time for every issue, with a completion check.",
      "high": "Also checks owner availability, plans coverage and escalation, and makes changes to commitments visible to teammates."
    },
    {
      "id": "cascade-sample:item:2",
      "questionKey": "cascade-sample:2",
      "competencyId": "cascade-competency-2",
      "question": "Using the same work sample, place the four issues in your proposed order of action. Explain the client impact and deadlines behind that order. Draft a handoff note containing the known facts, open questions, owners, and next actions a teammate needs.",
      "probe": "How do you ensure completeness and clarity in all client records during this process?",
      "low": "Lists tasks without considering deadlines or impact; the handoff omits key actions or owners.",
      "meets": "Explains a defensible order based on deadlines, impact and missing facts; the handoff gives usable next actions and owners.",
      "high": "Also identifies dependencies and what would change the order, with clear follow-up and escalation points."
    },
    {
      "id": "cascade-sample:item:3",
      "questionKey": "cascade-sample:3",
      "competencyId": "cascade-competency-2",
      "question": "Using invoice INV-204 and the approved quote in the work sample, record the $75 discrepancy. Explain your investigation and proposed next steps, including which decisions require manager approval. Draft a short client update about the missed appointment without making unsupported promises.",
      "probe": "What steps would you take to correct the discrepancy and communicate with clients or vendors?",
      "low": "Changes the invoice without checking authorization or makes unsupported promises to the client.",
      "meets": "Records the $75 discrepancy, checks relevant records and approval requirements, and drafts a factual client update with a next step and update time.",
      "high": "Also explains practical options and consequences, leaves a clear record for the manager, and distinguishes confirmed facts from pending actions."
    }
  ],
  "referenceCompetencyIds": [],
  "referenceItems": [],
  "backgroundItems": [
    {
      "id": "cascade-screen:background:0",
      "stageId": "cascade-screen",
      "title": "Work history",
      "question": "Walk me through your relevant work history. What were your responsibilities in each role?",
      "probe": "Which responsibilities did you personally own?"
    },
    {
      "id": "cascade-screen:background:1",
      "stageId": "cascade-screen",
      "title": "Job changes",
      "question": "What led you to make your recent job changes, and what are you looking for in your next role?",
      "probe": "Share only the work-related context you are comfortable discussing."
    },
    {
      "id": "cascade-screen:background:2",
      "stageId": "cascade-screen",
      "title": "Interest in the role",
      "question": "What interests you about this role and the work described in the posting?",
      "probe": "Which responsibilities would you most like to learn more about?"
    },
    {
      "id": "cascade-screen:background:3",
      "stageId": "cascade-screen",
      "title": "Relevant experience",
      "question": "Which parts of your experience best prepare you for this role? Give an example tied to a stated responsibility.",
      "probe": "Where would you need training or support?"
    },
    {
      "id": "cascade-screen:background:4",
      "stageId": "cascade-screen",
      "title": "Work arrangement and availability",
      "question": "This role works Monday–Friday, 8:30 a.m.–5 p.m. Pacific in Bend, Oregon, with three designated office days and two remote days each week. The first four weeks of onboarding are in office five days per week. Are you available for these requirements, and when could you start?",
      "probe": "Confirm the stated requirements first. Ask about availability without asking for personal reasons."
    },
    {
      "id": "cascade-reference:background:0",
      "stageId": "cascade-reference",
      "title": "Working relationship",
      "question": "What was your role, how did you work with this person, and during what period?",
      "probe": "How directly and how recently did you observe their work?"
    },
    {
      "id": "cascade-reference:background:1",
      "stageId": "cascade-reference",
      "title": "Working with others",
      "question": "Describe how this person worked with colleagues or customers. What specific example stands out?",
      "probe": "How did they handle disagreement or a difficult handoff?"
    },
    {
      "id": "cascade-reference:background:2",
      "stageId": "cascade-reference",
      "title": "Communication",
      "question": "How did this person communicate information, questions, and concerns at work?",
      "probe": "What example shows how they adapted to the audience or situation?"
    },
    {
      "id": "cascade-reference:background:3",
      "stageId": "cascade-reference",
      "title": "Reliability",
      "question": "What did you observe about their follow-through on agreed commitments?",
      "probe": "How did they communicate when a commitment was at risk?"
    },
    {
      "id": "cascade-reference:background:4",
      "stageId": "cascade-reference",
      "title": "Attention to detail",
      "question": "How did this person check the quality and accuracy of their work?",
      "probe": "Describe an error they caught or corrected and what happened afterward."
    },
    {
      "id": "cascade-reference:background:5",
      "stageId": "cascade-reference",
      "title": "Receiving feedback",
      "question": "Describe a time this person received constructive feedback. What did they do with it?",
      "probe": "What change did you observe afterward?"
    },
    {
      "id": "cascade-reference:background:6",
      "stageId": "cascade-reference",
      "title": "Strengths",
      "question": "What work-related strengths did you observe most consistently?",
      "probe": "Which responsibilities made the best use of those strengths?"
    },
    {
      "id": "cascade-reference:background:7",
      "stageId": "cascade-reference",
      "title": "Areas for improvement",
      "question": "Which work-related skills or practices would benefit from further development?",
      "probe": "What support helped, and what progress did you observe?"
    },
    {
      "id": "cascade-reference:background:8",
      "stageId": "cascade-reference",
      "title": "Rehire",
      "question": "If your organization permits you to answer, would you rehire this person for a similar role? What job-related observations support your answer?",
      "probe": "Distinguish organizational eligibility rules from your own experience. Unable to answer is not negative evidence."
    },
    {
      "id": "cascade-reference:background:9",
      "stageId": "cascade-reference",
      "title": "Setting them up for success",
      "question": "What guidance would you give their next manager to help this person succeed?",
      "probe": "What onboarding, expectations, feedback, or working conditions helped them do their best work?"
    }
  ],
  "approved": false
})
