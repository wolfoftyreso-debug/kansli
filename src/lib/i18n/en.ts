/** Canonical English UI catalog. Translations derive from these keys. */
export const EN = {
  "chrome.rooms": "Rooms",
  "chrome.services": "Services",
  "chrome.signIn": "Sign in",
  "chrome.signOut": "Sign out",
  "chrome.signedOut": "not signed in",
  "chrome.switchOrg": "Switch company",
  "chrome.menu": "Menu",
  "chrome.language": "Language",
  "chrome.orgs": "Companies",
  "chrome.skipToContent": "Skip to content",
  "chrome.roomsMobile": "Rooms, mobile",

  "runtime.production": "production",
  "runtime.preview": "preview",
  "runtime.local": "local",

  "home.hello": "Hello",
  "home.helloNamed": "Hello, {name}",
  "home.roleAdmin": "System administrator",
  "home.roleOpen": "Open surface",
  "home.programs": "Programs · {count} installed",
  "home.openKansli": "Open Kansli",
  "home.documentation": "Documentation",
  "home.metaDescription": "One room per job. The same sign-in.",

  "service.platform": "Platform",
  "service.ops": "Operations",
  "service.events": "Events",
  "service.procurement": "Procurement",
  "service.intake": "New customer",
  "service.docs": "Documentation",

  "category.kansli": "Start",
  "category.ekonomi": "Book",
  "category.tora": "Procurement",
  "category.rita": "Tax",
  "category.britt": "Follow-up",
  "category.irma": "Agreements",
  "category.tyra": "Tyre hotel",
  "category.alva": "Diagnostics",
  "category.creditae": "Credit",

  "idp.title": "Sign in · Pixdrift",
  "idp.heading": "Sign in",
  "idp.email": "Email",
  "idp.password": "Password",
  "idp.submit": "Sign in",
  "idp.noAccount": "No account?",
  "idp.requestAccess": "Request access through group procurement",
  "idp.wrongCredentials": "Wrong email or password.",
  "idp.tooManyAttempts": "Too many attempts. Try again in a moment.",
  "idp.errorTitle": "Error",
  "idp.errorHeading": "The request cannot be processed",
  "idp.loginUnavailable": "Sign-in is not available right now",
  "idp.loginUnavailableBody":
    "We could not reach sign-in. Try again in a moment, or go back to the {home}.",
  "idp.home": "home page",
  "idp.pkceRequired": "PKCE (S256) is required",
  "idp.demo": "Demo: {email} / {password}",

  "common.missing": "missing",
  "common.all": "All",
  "common.loading": "Loading…",
  "common.saving": "Saving…",
  "common.configured": "configured · {auth}",
  "common.missingKey": "missing key",

  "alva.metaTitle": "ALVA — Pixdrift",
  "alva.metaDescription": "The customer's fault, notes and measurements. Diagnosis comes later.",
  "alva.lead":
    "ALVA takes what the customer said, what you noted and what was measured. Diagnosis is wired later. The system does not diagnose on its own.",
  "alva.notice":
    "Diagnosis is not wired yet. You can fill an empty protocol with your own facts. The system never invents anything.",
  "alva.signInTitle": "Sign in to register cases",
  "alva.signInBody": "The case is stored in ALVA. Sign in to register.",
  "alva.newCase": "New case",
  "alva.complaint": "Customer's description",
  "alva.vehicleRef": "Vehicle reference (optional)",
  "alva.area": "Area (optional, e.g. brakes)",
  "alva.mileage": "Odometer km (optional)",
  "alva.desiredOutcome": "Desired outcome (optional)",
  "alva.register": "Register case",
  "alva.cases": "Cases",
  "alva.empty": "No cases yet.",
  "alva.status.open": "Open",
  "alva.status.in_progress": "In progress",
  "alva.status.closed": "Closed",
  "alva.detailMetaTitle": "Case — ALVA — Pixdrift",
  "alva.detailSignInTitle": "Sign in to see the case",
  "alva.detailSignInBody": "The case belongs to the organization.",
  "alva.detailNotice":
    "You fill in the facts yourselves. The system draws no conclusions of its own.",
  "alva.vehicleRefShort": "Vehicle reference",
  "alva.areaShort": "Area",
  "alva.mileageShort": "Odometer",

  "creditae.metaTitle": "CREDITAE — Pixdrift",
  "creditae.metaDescription":
    "Credit assessment of a counterpart. Your conclusion, no invented score.",
  "creditae.lead":
    "CREDITAE takes who you will assess and what you yourselves concluded. The system sets no credit score.",
  "creditae.noticeOn":
    "Credit on. The bureau report is fetched when the inquiry is registered. Your conclusion is still yours.",
  "creditae.noticeOff":
    "Credit off. No credit bureau is connected. The assessment is yours. The system never invents a score.",
  "creditae.signInTitle": "Sign in to assess a counterpart",
  "creditae.signInBody": "The inquiry is stored in CREDITAE. Sign in to register.",
  "creditae.newInquiry": "New inquiry",
  "creditae.orgNumber": "Organisation number",
  "creditae.companyName": "Company name (optional)",
  "creditae.reason": "Why you assess (optional)",
  "creditae.register": "Register inquiry",
  "creditae.inquiries": "Inquiries",
  "creditae.empty": "No inquiries yet.",
  "creditae.status.open": "Open",
  "creditae.status.assessed": "Assessed",
  "creditae.assess.go": "Go",
  "creditae.assess.watch": "Watch",
  "creditae.assess.stop": "Stop",
  "creditae.vendor.blocked": "Credit off",
  "creditae.vendor.failed": "No report",
  "creditae.vendor.fetched": "Report in",
  "creditae.detailMetaTitle": "Inquiry — CREDITAE — Pixdrift",
  "creditae.detailSignInTitle": "Sign in to see the inquiry",
  "creditae.detailSignInBody": "The inquiry belongs to the organization.",
  "creditae.detailNoticeOn":
    "You fill in the conclusion yourselves. Bureau fields are not your assessment.",
  "creditae.detailNoticeOff":
    "You fill in the conclusion yourselves. The system sets no credit score.",
  "creditae.why": "Why",
  "creditae.bureau": "Credit bureau",
  "creditae.vendorName": "Name at the bureau",

  "kansli.metaTitle": "Kansli — Pixdrift",
  "kansli.metaDescription": "The start page. Tasks and the way in.",
  "kansli.lead":
    "This is where it starts. The same sign-in in every system, and a task board for internal work.",
  "kansli.signInTitle": "Sign in with Pixdrift",
  "kansli.signInBody": "The same sign-in covers TORA, RITA, BRITT, IRMA and ALVA.",
  "kansli.firstCustomer": "First customer — a checklist, not a date",
  "kansli.groupProcurement": "Group procurement",
  "kansli.family": "The family",
  "kansli.map": "The map",
  "kansli.mapLead": "What each system does, and how they connect.",
  "kansli.recentEvents": "Recent events",
  "kansli.notice":
    "When a task is created, BRITT gets something to follow up. Kansli still owns the task.",

  "tasks.summary": "Task board — {open} open, {done} done.",
  "tasks.titlePlaceholder": "New task…",
  "tasks.titleAria": "Task title",
  "tasks.ownerPlaceholder": "Owner",
  "tasks.ownerAria": "Owner",
  "tasks.add": "Add",
  "tasks.empty": "No tasks yet. Add the first one above.",
  "tasks.remove": "Remove",
  "tasks.markDone": 'Mark "{title}" as done',
  "tasks.removeNamed": 'Remove "{title}"',
  "tasks.fetchError": "Could not load tasks.",
  "tasks.saveError": "Could not save the task.",
  "tasks.updateError": "Could not update the task.",
  "tasks.deleteError": "Could not remove the task.",
  "tasks.genericError": "Something went wrong.",
  "tasks.emptyTitle": "The title cannot be empty.",

  "platform.metaTitle": "Platform — Pixdrift",
  "platform.metaDescription": "What each system does, and how they connect.",
  "platform.heading": "What each system does",
  "platform.notice":
    "Each system does one job. TORA takes procurement. RITA takes tax. They are not mixed.",
  "platform.systems": "The systems",
  "platform.howTheyConnect": "How they connect",
  "platform.moreSystems": "More systems",
  "platform.waiting": "Waiting to be wired",
  "platform.tech": "Technology — for whoever runs operations",
  "platform.gateway": "Model gateway",
  "platform.gatewayLead":
    "One key gives access to more than 100 models. Remember: the system's answers are guesses, not facts.",
  "platform.gatewayHint": "Set {key} in Secrets or {oidc} on Vercel.",

  "family.status.operational": "Running",
  "family.status.pilot": "On the way",
  "family.status.deferred": "Not ready yet",
  "family.principle":
    "The same sign-in in every system. Each system does its own job. TORA takes procurement. RITA takes tax. They are not mixed.",
  "family.incoming":
    "More systems are on the way. They get the same sign-in and their own records. Names come when they are ready — not before.",
  "family.party.products": "every product",
  "family.party.events": "the event list",
  "family.identity.mission": "One sign-in for every system.",
  "family.kansli.mission": "The start page. Tasks and the way in.",
  "family.ekonomi.mission": "Invoices, VAT and how the money came in.",
  "family.tora.mission": "Which procurements your company can take.",
  "family.rita.mission": "Looks for tax savings in your books.",
  "family.britt.mission": "What happened and needs follow-up.",
  "family.irma.mission": "Send an agreement, see if it is read and confirmed.",
  "family.tyra.mission": "Customer, car, wheels and what to do next.",
  "family.alva.mission": "The customer's fault, notes and measurements. Diagnosis comes later.",
  "family.creditae.mission":
    "Credit assessment of a counterpart. Your conclusion, no invented score.",
  "family.identity.question": "Who are you, and which company does it apply to?",
  "family.identity.does": "You sign in once. Then you are in Kansli, TORA, RITA and the others.",
  "family.identity.doesNot": "No invoices are sent here, and there is no extra mobile code yet.",
  "family.kansli.question": "Where do I start, and what should we do internally?",
  "family.kansli.does": "Sign-in, an internal task board and the form for new customers.",
  "family.kansli.doesNot":
    "Kansli does not calculate procurement, tax or tyres. The other systems do that.",
  "family.ekonomi.question": "What is booked, what is overdue, and how did the money come in?",
  "family.ekonomi.does":
    "Writes a 10-day invoice, books in öre, connects Stripe and Revolut, matches incoming payments when the bank is connected.",
  "family.ekonomi.doesNot":
    "Not Visma. Not Fortnox. No invented payment. Cards need Stripe. Swish needs Swish to be wired.",
  "family.tora.question": "Can we bid here — and what should we do now?",
  "family.tora.does":
    "Compares the company with the procurements: requirements, gaps, amounts, dates and the next step.",
  "family.tora.doesNot": "Does not look in the books. RITA does that.",
  "family.rita.question": "Which deductions, VAT and other gaps sit in the annual accounts?",
  "family.rita.does":
    "Reads the annual accounts against Swedish tax rules and leaves proposals to check. Not tax advice.",
  "family.rita.doesNot":
    "Does not invent results. Does not say whether you may bid. No customer file to upload yet.",
  "family.britt.question": "What do you need to do now, based on what already happened?",
  "family.britt.does":
    "Collects things that must be followed up. One thing at a time, with the next step.",
  "family.britt.doesNot": "BRITT is not a case system and not a chat.",
  "family.irma.question": "Has the counterpart read and confirmed the agreement?",
  "family.irma.does": "Sends the agreement. Shows whether it is opened, signed or rejected.",
  "family.irma.doesNot": "IRMA is not email and not an archive for every document.",
  "family.tyra.question": "Which customer, which car, which wheels — and what is the next step?",
  "family.tyra.does":
    "Keeps customer, vehicle and tyres together. Shows when it is time to change or collect.",
  "family.tyra.doesNot": "TYRA is not a general customer register for other trades.",
  "family.alva.question":
    "What did the customer say, what was measured — and what is the next step?",
  "family.alva.does":
    "Takes what was said and measured. Shows the note. Does not diagnose on its own.",
  "family.alva.doesNot": "ALVA does not diagnose and does not give advice.",
  "family.creditae.question": "Who should we assess — and what did you conclude?",
  "family.creditae.does":
    "Takes an organisation number and your assessment. Fetches the bureau report through the platform credit channel when it is wired. Go, watch or stop.",
  "family.creditae.doesNot": "CREDITAE sets no credit score. The product does not call Creditsafe.",

  "family.stack.language": "Language",
  "family.stack.language.runs":
    "TypeScript 5 across the system. SQL in the database. RITA's analysis runs as its own program. ekonomi-ledger checks vouchers, it does not post in production.",
  "family.stack.web": "Web",
  "family.stack.web.runs":
    "Next.js 16.3 App Router, React 19.2, Tailwind CSS 4. One process: site, /idp, products and API.",
  "family.stack.identity": "Identity",
  "family.stack.identity.runs":
    "Own sign-in, built on an open standard. One cookie keeps you signed in. The same sign-in in every system.",
  "family.stack.data": "Data",
  "family.stack.data.runs":
    "PostgreSQL 16. Each system has its own data. No system writes another system's records.",
  "family.stack.analysis": "Analysis",
  "family.stack.analysis.runs":
    "TORA calculates in the same process. RITA calls its own analysis. No invented results in production.",
  "family.stack.automation": "Automation",
  "family.stack.automation.runs":
    "Models go through the Vercel gateway. The answer is a guess, not a fact.",
  "family.stack.ops": "Operations and test",
  "family.stack.ops.runs": "Runs on Vercel. Tests against Postgres 16. No AWS SDK in this system.",

  "family.link.identity.products": "One sign-in. Products do not read each other's user lists.",
  "family.link.identity.events":
    "A successful sign-in is written in the log. It is a receipt, not a task to follow up.",
  "family.link.tora.britt": "Only when someone publishes. Reading the market creates no event.",
  "family.link.rita.britt":
    "BRITT gets the company name, how many hits it produced and whether automation was involved. Not the proposals themselves — those stay in RITA.",
  "family.link.irma.britt": "Agreement created, opened, confirmed or withdrawn.",
  "family.link.tyra.britt":
    "A case, a customer link or a reminder in the queue. A blocked queue does not mean sent.",
  "family.link.alva.britt": "A case is registered. No diagnosis follows until it is wired.",
  "family.link.creditae.britt":
    "A counterpart is registered, you have written your conclusion, or the bureau report arrived or stopped. No invented score follows.",
  "family.link.ekonomi.britt":
    "An issued invoice, a booked incoming payment or a Revolut fetch that did not go through.",
  "family.link.ekonomi.revolut":
    "The bank connection lifecycle. Ordinary renewal is logged as operations, not as something to follow up.",
  "family.link.ekonomi.invoice": "A draft appears in the log. No bookkeeping until issue.",
  "family.link.kansli.task": "An internal task appears in BRITT. Kansli still owns the task.",
  "family.link.kansli.intake":
    "An application has come in, or a workshop account was created for the demo.",
  "family.link.britt.finding":
    "The most important hits from the sample analysis become things to follow up. The rest stays in BRITT.",
  "family.link.britt.events": "Each thing to follow up is also written in the event list.",

  "family.blocked.rita":
    "RITA's analysis must be wired (on Vercel via URL, locally via the program file) before analyses can run.",
  "family.blocked.alva":
    "The guided diagnosis is wired when it is ready. The case can be registered already.",
  "family.blocked.irma":
    "IRMA stays with us: a simple digital confirmation and its own link. No legal e-signature yet.",
  "family.blocked.britt":
    "Fortnox, Revolut and BRITT's profiles if the sample analysis is to become the whole product.",
  "family.blocked.ekonomi":
    "Stripe, Revolut and Swish when you want to take payment that way. A 10-day invoice works without them.",
  "family.blocked.creditae":
    "CREDITAE goes through the platform credit channel. Products do not call Creditsafe. Without a key no report is fetched. The assessment is still yours.",

  "tyra.metaTitle": "TYRA — Pixdrift",
  "tyra.metaDescription": "Customer, car, wheels and what to do next.",
  "tyra.heading": "Which vehicle is coming in?",
  "tyra.lead":
    "TYRA keeps customer, car and wheels together. Tyres are sold here — one click books the invoice in Ekonomi. Amounts are your own figures. No live prices yet.",
  "tyra.customers": "Customer cards",
  "tyra.integrations": "Integrations",
  "tyra.signInTitle": "Sign in to open cases",
  "tyra.signInBody": "The same sign-in as the rest of Pixdrift. No extra account for the workshop.",
  "tyra.notice":
    "Reminders go in the queue but are not sent yet — there is no SMS or email connection. No live tyre prices.",

  "ekonomi.metaTitle": "Ekonomi — Pixdrift",
  "ekonomi.metaDescription": "Invoices, VAT and how the money came in.",
  "ekonomi.heading": "What is booked?",
  "ekonomi.lead":
    "Book sales in kronor. One click issues the invoice. TYRA quotes that are not booked sit in the queue. The customer can pay with Swish, Stripe or a 10-day invoice. Connect Revolut once, and statements are fetched and payments matched. Visma is the next connection — it is not here yet.",
  "ekonomi.signInTitle": "Sign in to see the book",
  "ekonomi.signInBody": "The books belong to your company. Sign in to see them.",
  "ekonomi.notice":
    "You write kronor. The book stores öre. Every voucher balances. Payments only run for real when the connections are in place — nothing is simulated unless you said yes.",
  "ekonomi.statements": "Statements",
  "ekonomi.invoices": "Invoices",
  "ekonomi.vouchers": "Vouchers",
  "ekonomi.reports": "Reports / VAT",
  "ekonomi.connections": "Connections",

  "tora.metaTitle": "TORA — Pixdrift",
  "tora.metaDescription": "Which procurements your company can take.",
  "tora.lead":
    "TORA shows which procurements {name} can bid on — and why you. Here is the whole assessment: requirements, gaps and the next step.",
  "tora.noticeDemo":
    "The procurements are examples, not real notices. The view is a paid account, so you see names, amounts and requirements. Company facts are the example company until you save your own profile.",
  "tora.noticeSaved":
    "The procurements are examples, not real notices. The view is a paid account, so you see names, amounts and requirements. Company facts are your saved profile ({name}).",
  "tora.calendar": "Calendar",
  "tora.current": "Current",
  "tora.upcoming": "Upcoming",
  "tora.watch": "Watch",
  "tora.publishedValue": "Published value",
  "tora.yourCompany": "Your company",
  "tora.profileLead": "Without a saved profile we calculate on the example company instead of you.",
  "tora.frameworks": "Agreements you are already on",
  "tora.references": "References TORA counts with",

  "rita.metaTitle": "RITA — Pixdrift",
  "rita.metaDescription": "RITA looks for tax savings in your books.",
  "rita.lead":
    "RITA looks for tax savings in your books: deductions, VAT, K10, pension and R&D. What RITA finds are proposals to check further — not tax advice.",
  "rita.noticeReady":
    "The analysis is running. Parts of the answer come from a model and may need a second look.",
  "rita.noticeRules":
    "The analysis is running, but without a model just now. Only the fixed rules are used.",
  "rita.noticeBlocked":
    "The analysis is not wired yet, so new analyses stay blocked. We never show invented results.",
  "rita.noticeExample":
    "The sample accounts are a built-in example — not something a customer uploaded.",
  "rita.signInTitle": "Sign in to request an analysis",
  "rita.signInBody":
    "The analysis is stored in RITA. BRITT gets something to follow up when an analysis completes or stops.",

  "britt.metaTitle": "BRITT — Pixdrift",
  "britt.metaDescription": "What happened and needs follow-up.",
  "britt.lead":
    "BRITT collects things that need follow-up. The figures here are examples — no Fortnox or Revolut connections yet.",
  "britt.noticeDemo":
    "The figures here are examples for the house, not Fortnox and not a live till.",
  "britt.noticeOwn": "Here you follow your own observations. Sample figures only run on the house.",
  "britt.signInTitle": "Sign in to see observations",
  "britt.signInBody":
    "Observations belong to your company. What happens in TORA, RITA and IRMA shows up here.",

  "irma.metaTitle": "IRMA — Pixdrift",
  "irma.metaDescription": "Send an agreement, see if it is read and confirmed.",
  "irma.heading": "Which agreement should go out?",
  "irma.lead":
    "With IRMA you send agreements digitally: create, send a link, see when the counterpart has opened and confirmed. The counterpart needs no account. It is a simple digital confirmation, not a legal e-signature. There is no document archive yet.",
  "irma.signInTitle": "Sign in to create agreements",
  "irma.signInBody":
    "The link is shown once — copy it straight away. We do not store it in readable form.",

  "creditae.vendorScore": "Bureau value",
  "creditae.vendorLimit": "Bureau limit",
  "creditae.vendorNotConclusion": "Those are the bureau's fields, not your conclusion.",
  "creditae.vendorWhyMissing": "Why the report is missing",
  "creditae.notes": "Note",
  "creditae.yourAssessment": "Your assessment",
  "creditae.conclusion": "Conclusion",
} as const;

export type MessageKey = keyof typeof EN;
