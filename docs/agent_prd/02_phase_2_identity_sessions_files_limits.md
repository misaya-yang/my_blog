# Phase 2 PRD: Agent Identity, Sessions, Files, and Limits

## Goal

Turn the right-bottom AI companion into a durable product surface with conversation history, visitor identity, pasted/file context, and cost/abuse controls.

## Why This Phase Exists

Once a public agent entry point exists, the hard problems are no longer model calls. They are ownership, memory, quotas, privacy, file safety, tool boundaries, and operating costs.

Phase 2 should make the system safe enough for broader public use.

## Identity Model

### Anonymous

- No explicit login.
- Identified by hashed IP + user-agent bucket for rate limiting only.
- Can start short-lived conversations.
- History stored for 24 hours or until browser session ends.
- Lowest quota.

### Visitor JWT

Already exists in the codebase.

Capabilities:

- Durable conversation history.
- Nickname display.
- Can use pasted context in the assistant.
- Can upload small `.txt` / `.md` files after pasted context is stable.
- Can save generated reading paths and research maps.
- Can reopen previous agent tasks.
- Moderate quota.

Implementation should reuse:

- `server/auth.ts`
- `auth.visitorLogin`
- `VISITOR_SESSION_COOKIE`
- `client/src/_core/hooks/useAuth.ts`

### Account Login

Do not build official email/password account login in this phase unless needed.

Instead, define an adapter boundary:

- `identityProvider = visitorJwt | oauth | email`
- Keep `users` table compatible with future OAuth/email.
- Do not block Phase 2 on official email.

### Admin

Admin has:

- Full conversation visibility.
- Highest quota.
- Ability to inspect retrieval context.
- Ability to delete conversations/files.
- Ability to impersonate public retrieval mode for testing.

## Conversation Management

### Agent Session States

- `active`: agent can answer normally.
- `waiting_for_user`: agent produced a plan and needs user selection.
- `running_task`: agent is generating a reading path, comparison, or map.
- `completed`: task/conversation reached a natural end.
- `archived`: hidden from default history but retained.
- `flagged`: possible abuse, prompt injection, or unsafe upload.

### Conversation Metadata

Each conversation should track:

- scope type and value
- visitor identity
- latest message preview
- linked post slug
- tags/intent
- source count
- token usage
- task status
- active agent profile
- task type
- admin unread state

### Reader Conversation History

Add `/ai/history` or a side drawer:

- Recent conversations.
- Search by title/message.
- Filter by article.
- Continue conversation or rerun a saved agent task.
- Delete local conversation.

For anonymous users, show "Log in as visitor to keep this conversation."

## Pasted Context and File Uploads

Phase 2 should start with pasted text context before binary file uploads.

Reason:

- The project does not have an independent file system.
- Supabase should store extracted text chunks and metadata, not become an unbounded binary dump.
- Pasted text validates the product behavior before PDF parsing or storage complexity.

### Primary Use Cases

- Paste a paper excerpt and ask how it connects to blog posts.
- Upload notes or Markdown and ask for a reading path.
- Upload a small excerpt and ask for technical critique.
- Upload a project idea and ask which blog concepts are relevant.

### Supported File Types

Phase 2 recommended order:

1. Pasted text source.
2. `.txt`
3. `.md`

Defer until later:

- `.pdf`
- `.tex`
- `.json`
- `.docx`
- images for diagrams
- audio only if transcription is explicitly scoped

### Upload Limits

Default quotas:

| User Type | Max Files / Conversation | Max File Size | Retention |
| --- | ---: | ---: | --- |
| Anonymous | 0 | 0 | N/A |
| Visitor | 2 | 2 MB | 7 days |
| Admin | 10 | 10 MB | manual delete |

### File Safety

Requirements:

- Validate MIME and extension.
- Reject executable/binary unknown types.
- Store original file metadata.
- Extract text server-side only.
- Never send raw file URLs to the client if private.
- Delete expired visitor files.
- Add warning: users should not upload confidential or third-party copyrighted material unless they have rights.

### File Context Behavior

Uploaded files are conversation-local by default.

The AI should distinguish:

- Blog source.
- User uploaded source.
- General model knowledge.

Answer format:

```text
From the blog:
- ...

From your uploaded file:
- ...

My synthesis:
- ...
```

## Rate Limits and Cost Controls

### Limit Dimensions

Track limits by:

- IP hash.
- visitorId.
- admin user.
- conversationId.
- model provider.
- agent profile.
- task type.

Track usage:

- requests per minute
- requests per day
- input tokens
- output tokens
- retrieval calls
- file uploads
- upload bytes

### Default Quotas

| User Type | Messages / 10 min | Messages / day | Uploads / day | Notes |
| --- | ---: | ---: | ---: | --- |
| Anonymous | 2 | 2 | 0 | Hard MVP limit; offer visitor login |
| Visitor | 6 | 6 | 2 | Durable identity, still cost-controlled |
| Admin | 60 | configurable | 20 | For testing and maintenance |

### Abuse UX

When rate limited:

- Show reset time.
- Offer visitor login if anonymous.
- Preserve draft message.
- Do not call the model.

### Implementation Options

Recommended MVP:

- Start with Supabase/Postgres-backed counters in `ai_usage_buckets`.
- Move to Upstash Redis only if traffic grows.

Reason:

- Current traffic is likely low.
- Postgres simplifies local/dev/prod parity.
- The schema can later be replaced behind a `rateLimiter.check()` interface.

## Data Model Additions

- `ai_pasted_sources`
  - `id`
  - `conversationId`
  - `ownerType`
  - `ownerKey`
  - `title`
  - `textHash`
  - `textContent`
  - `expiresAt`
  - `createdAt`

- `ai_uploaded_files`
  - `id`
  - `conversationId`
  - `ownerType`
  - `ownerKey`
  - `fileName`
  - `mimeType`
  - `sizeBytes`
  - `textExtractStatus`
  - `expiresAt`
  - `createdAt`

- `ai_uploaded_file_chunks`
  - `id`
  - `fileId`
  - `conversationId`
  - `chunkIndex`
  - `content`
  - `tokenEstimate`
  - `createdAt`

- `ai_usage_buckets`
  - `id`
  - `identityType`: `anonymous | visitor | admin`
  - `identityKey`
  - `actionType`
  - `windowType`: `day | burst`
  - `windowStart`
  - `count`
  - `inputTokens`
  - `outputTokens`
  - `createdAt`
  - `updatedAt`

- Add fields to `ai_messages`
  - `userFileIds`
  - `feedback`: nullable `up | down`
  - `errorCode`

## Acceptance Criteria

- Visitor users can see and resume their own conversations.
- Anonymous users cannot access another session's conversations.
- Admin can inspect all conversations.
- Visitor can add pasted context and ask one question about it.
- Visitor can upload `.txt` / `.md` only after pasted context is implemented.
- Visitor can save at least one generated reading path.
- Unsupported files are rejected before storage/model calls.
- Anonymous users are blocked on the 3rd daily assistant message.
- Visitor users are blocked on the 7th daily assistant message.
- Rate-limited requests return 429-style UX and do not spend model tokens.
- Upload and conversation retention policies are enforced by a cleanup script or admin action.
