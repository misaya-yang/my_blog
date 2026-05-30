# Future R&D: Author Intervention and Live Participation

## Status

This is intentionally not part of the MVP or the first three implementation phases.

Direct author participation sounds attractive, but it is a much harder product than the core Blog Agent because it introduces expectation management, notification design, moderation, SLA ambiguity, identity trust, and a live support-like workflow.

## Why It Is Hard

- Readers may expect a guaranteed personal response.
- Admin notifications can become a burden.
- AI and author replies can conflict unless conversation ownership is clearly modeled.
- The system must label author-authored vs AI-authored messages perfectly.
- Abuse moderation becomes more important.
- It changes the product from a knowledge agent into a support/community system.

## Preconditions Before Considering It

- The Blog Agent has real usage.
- Conversation history and admin observability are stable.
- The system can identify high-value questions.
- The author wants a bounded office-hour workflow.
- There is a clear response expectation, such as "selected questions may be answered asynchronously."

## Possible Future Model

If implemented, use an asynchronous "Ask Misaya" request, not live chat.

States:

- `agent_active`
- `author_question_submitted`
- `author_answered`
- `closed`

Rules:

- AI never sends messages as Misaya.
- Author replies are manually written or manually approved.
- Readers see clear expectation text.
- Admin can convert questions into public FAQ/blog posts instead of replying one-by-one.

## Recommendation

Do not implement this until after:

1. Blog Knowledge Agent MVP.
2. Durable visitor sessions and file uploads.
3. Agent workflows and admin retrieval/evaluation workspace.
