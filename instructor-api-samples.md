# Instructor Onboarding & Module Review — API Reference & Sample Data

Base URL: `/api/v1`
Auth: `Authorization: Bearer <token>` (or `token` / `admin_token` cookie)
All responses are wrapped the same way everywhere in this API:

```json
// success
{ "success": true, "message": "Human readable message", "data": { /* ... */ }, "timestamp": "2026-09-08T10:00:00.000Z" }

// success, no payload (e.g. deletes)
{ "success": true, "message": "Module deleted successfully.", "timestamp": "2026-09-08T10:00:00.000Z" }

// error
{ "success": false, "message": "You do not have access to this module.", "code": "FORBIDDEN", "timestamp": "2026-09-08T10:00:00.000Z" }
```

Common error `code`s you'll want to branch on in the UI: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `INVALID_STATE` (400 — e.g. trying to edit a submitted module), `DUPLICATE` (409).

Sample IDs used throughout (swap for real ones):
- `lawyerUserId` (a lawyer's User._id): `66d9f1a2c1a2b3c4d5e6f701`
- `lawyerProfileId` (their LawyerProfile._id): `66d9f1a2c1a2b3c4d5e6f7a1`
- `moduleId`: `66d9f2b3c1a2b3c4d5e6f710`
- `topicId`: `66d9f2c4c1a2b3c4d5e6f720`
- `subtopicId`: `66d9f2d5c1a2b3c4d5e6f730`
- `adminId`: `66d9f0a1c1a2b3c4d5e6f7ff`

---

## 1. Lawyer applies to become an instructor

### `POST /instructor/request`
Auth: any signed-in lawyer (must already be NBA-verified).

**Request body**
```json
{
  "motivation": "I've handled 40+ tenancy disputes in Lagos and want to help citizens understand their rights before they end up in court."
}
```
`motivation` is optional but recommended (shown to admin in the review queue). Max 1000 chars.

**Response `201`**
```json
{
  "success": true,
  "message": "Instructor request submitted.",
  "data": {
    "message": "Instructor request submitted.",
    "profile": {
      "_id": "66d9f1a2c1a2b3c4d5e6f7a1",
      "userId": "66d9f1a2c1a2b3c4d5e6f701",
      "instructorStatus": "pending",
      "instructorRequestedAt": "2026-09-08T09:12:00.000Z",
      "instructorMotivation": "I've handled 40+ tenancy disputes in Lagos...",
      "...": "rest of the lawyer profile fields (bio, specialisms, fees, etc.)"
    }
  },
  "timestamp": "2026-09-08T09:12:00.000Z"
}
```

**Error cases**
| Status | code | when |
|---|---|---|
| 404 | NOT_FOUND | no LawyerProfile for this user yet |
| 403 | FORBIDDEN | lawyer isn't verified yet — `"Only NBA-verified lawyers can apply to become instructors."` |
| 500→handled | — | `profile.requestInstructor()` throws if status is already `pending` or `approved` (surfaces as a generic error; consider a friendlier 400 wrapper on the frontend based on message text) |

---

## 2. Lawyer checks their own instructor status

### `GET /instructor/status`
Auth: any signed-in lawyer.

**Response `200`**
```json
{
  "success": true,
  "message": "Instructor status fetched.",
  "data": {
    "instructorStatus": "pending",
    "instructorRequestedAt": "2026-09-08T09:12:00.000Z",
    "instructorApprovedAt": null,
    "instructorRejectedReason": null
  },
  "timestamp": "2026-09-08T09:15:00.000Z"
}
```
`instructorStatus` is one of: `"none" | "pending" | "approved" | "rejected"`. Drive your dashboard's empty/pending/approved/rejected states off this single field.

---

## 3. Admin: list instructor requests (review queue)

### `GET /admin/instructors/requests?status=pending&page=1&pageSize=20`
Auth: admin.

Query params (all optional): `status` (`pending` default | `approved` | `rejected` | `all`), `page`, `pageSize`.

**Response `200`**
```json
{
  "success": true,
  "message": "Instructor requests fetched.",
  "data": {
    "data": [
      {
        "lawyerProfileId": "66d9f1a2c1a2b3c4d5e6f7a1",
        "userId": "66d9f1a2c1a2b3c4d5e6f701",
        "user": {
          "_id": "66d9f1a2c1a2b3c4d5e6f701",
          "firstName": "Amaka",
          "lastName": "Okafor",
          "email": "amaka.okafor@example.com"
        },
        "title": "Property & Tenancy Lawyer",
        "specialisms": ["tenancy", "contracts"],
        "scnNumber": "SCN123456",
        "instructorStatus": "pending",
        "instructorMotivation": "I've handled 40+ tenancy disputes in Lagos...",
        "instructorRequestedAt": "2026-09-08T09:12:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  },
  "timestamp": "2026-09-08T09:20:00.000Z"
}
```

## 4. Admin: approve / reject an instructor request

### `PATCH /admin/instructors/requests/:lawyerProfileId/approve`
No body required.

**Response `200`**
```json
{
  "success": true,
  "message": "Instructor request approved.",
  "data": {
    "message": "Instructor request approved.",
    "profile": {
      "_id": "66d9f1a2c1a2b3c4d5e6f7a1",
      "instructorStatus": "approved",
      "instructorApprovedAt": "2026-09-08T09:25:00.000Z",
      "instructorApprovedBy": "66d9f0a1c1a2b3c4d5e6f7ff"
    }
  },
  "timestamp": "2026-09-08T09:25:00.000Z"
}
```

### `PATCH /admin/instructors/requests/:lawyerProfileId/reject`
**Request body**
```json
{ "reason": "SCN documents on file are incomplete — please resubmit verification first." }
```
`reason` is required (400 `VALIDATION_ERROR` if missing).

**Response `200`**
```json
{
  "success": true,
  "message": "Instructor request rejected.",
  "data": {
    "message": "Instructor request rejected.",
    "profile": {
      "instructorStatus": "rejected",
      "instructorRejectedReason": "SCN documents on file are incomplete — please resubmit verification first."
    }
  },
  "timestamp": "2026-09-08T09:26:00.000Z"
}
```

---

## 5. Instructor dashboard stats ("how their content grows")

### `GET /instructor/dashboard/stats`
Auth: approved instructor only (403 if not yet approved).

**Response `200`**
```json
{
  "success": true,
  "message": "Instructor dashboard stats fetched.",
  "data": {
    "totalModules": 4,
    "modulesByStatus": { "draft": 1, "pending": 1, "active": 2 },
    "totalEnrolled": 386,
    "totalWatchTimeHours": 142.5,
    "avgRating": 4.6,
    "enrollmentTrend": [
      { "date": "2026-08-10", "count": 12 },
      { "date": "2026-08-11", "count": 18 },
      { "date": "2026-08-12", "count": 9 }
    ],
    "topModules": [
      {
        "id": "66d9f2b3c1a2b3c4d5e6f710",
        "title": "Know Your Tenancy Rights in Lagos",
        "status": "active",
        "enrolledCount": 210,
        "avgRating": 4.8,
        "completionRate": 62
      },
      {
        "id": "66d9f2b3c1a2b3c4d5e6f711",
        "title": "Employment Contracts 101",
        "status": "active",
        "enrolledCount": 176,
        "avgRating": 4.4,
        "completionRate": 55
      }
    ]
  },
  "timestamp": "2026-09-08T10:00:00.000Z"
}
```
Use `modulesByStatus` for the little draft/pending/live counter chips, `enrollmentTrend` for a sparkline/line chart, `topModules` for a "your best performing content" list.

---

## 6. Instructor module CRUD (their own content)

### `POST /instructor/modules` — create a draft
**Request body**
```json
{
  "title": "Know Your Tenancy Rights in Lagos",
  "category": "tenancy",
  "description": "A practical walkthrough of what Lagos State tenancy law actually says landlords and tenants can and can't do.",
  "thumbnailUrl": "https://res.cloudinary.com/demo/image/upload/v1/tenancy-cover.jpg"
}
```
`category` must be one of: `criminal | tenancy | employment | contracts | business | family | consumer | road`.
Instead of `thumbnailUrl` you may send `thumbnailFile` as a base64 data URL string (`data:image/png;base64,...`) — the API uploads it to Cloudinary for you. One of the two is required.

**Response `201`**
```json
{
  "success": true,
  "message": "Module created as draft.",
  "data": {
    "module": {
      "id": "66d9f2b3c1a2b3c4d5e6f710",
      "title": "Know Your Tenancy Rights in Lagos",
      "category": "tenancy",
      "status": "draft",
      "slug": "know-your-tenancy-rights-in-lagos",
      "materialSummary": null,
      "thumbnail": "https://res.cloudinary.com/demo/image/upload/v1/tenancy-cover.jpg",
      "description": "A practical walkthrough of what Lagos State tenancy law...",
      "topicCount": 0,
      "enrolledCount": 0,
      "completionRate": 0,
      "avgRating": 0,
      "reviewCount": 0,
      "totalWatchTimeHours": 0,
      "instructor": "Amaka Okafor",
      "instructorId": "66d9f1a2c1a2b3c4d5e6f701",
      "instructorInitials": "AO",
      "instructorColor": "#3E7CB1",
      "trending": false,
      "createdBy": "instructor",
      "submittedAt": null,
      "reviewedAt": null,
      "reviewedBy": null,
      "reviewNote": "",
      "createdAt": "2026-09-08T09:30:00.000Z",
      "updatedAt": "2026-09-08T09:30:00.000Z"
    }
  },
  "timestamp": "2026-09-08T09:30:00.000Z"
}
```

### `GET /instructor/modules?status=draft&page=1&pageSize=20` — list own modules
`status` optional: `draft | pending | active | rejected | inactive | all`.

**Response `200`**
```json
{
  "success": true,
  "message": "Modules fetched successfully.",
  "data": {
    "data": [ /* array of module objects, same shape as above */ ],
    "total": 4,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  },
  "timestamp": "2026-09-08T09:31:00.000Z"
}
```

### `GET /instructor/modules/:id` — fetch one (ownership-checked)
**Response `200`** — `data` is a single module object (same shape as the create response's `module`).
**Error**: `403 FORBIDDEN` if the module belongs to a different instructor; `404 NOT_FOUND` if it doesn't exist.

### `PATCH /instructor/modules/:id` — edit (draft/rejected only)
**Request body** (all fields optional, send only what changed)
```json
{
  "title": "Know Your Tenancy Rights in Lagos (2026 Update)",
  "description": "Updated to reflect the 2026 amendment to the Lagos Tenancy Law.",
  "thumbnailUrl": "https://res.cloudinary.com/demo/image/upload/v2/tenancy-cover-v2.jpg"
}
```
**Response `200`**: `{ "module": { /* updated module */ } }`
**Error `400 INVALID_STATE`**: `"This module is under review or published — you can no longer edit it."` — fired if `status` is `pending`, `active`, or `inactive`. Disable the edit form in the UI whenever `module.status` isn't `draft` or `rejected`.

### `DELETE /instructor/modules/:id` — delete (draft/rejected only)
**Response `200`**: `{ "success": true, "message": "Module deleted successfully.", "timestamp": "..." }`
Same `INVALID_STATE` restriction as edit.

### `POST /instructor/modules/:id/submit` — send for admin review
No body. Requires the module to already have ≥1 topic.

**Response `200`**
```json
{
  "success": true,
  "message": "Module submitted for review.",
  "data": {
    "module": {
      "id": "66d9f2b3c1a2b3c4d5e6f710",
      "status": "pending",
      "submittedAt": "2026-09-08T10:05:00.000Z",
      "reviewNote": "",
      "...": "rest of module fields"
    }
  },
  "timestamp": "2026-09-08T10:05:00.000Z"
}
```
**Error `400 VALIDATION_ERROR`**: `"Add at least one topic before submitting for review."`
**Error `400 INVALID_STATE`**: `"Only draft or rejected modules can be submitted for review."`

---

## 7. Instructor topics & subtopics (inside their own module)

Identical request/response shape to the existing admin topic/subtopic endpoints — just scoped to the caller's module and blocked once the module leaves `draft`/`rejected`.

### `POST /instructor/modules/:moduleId/topics`
```json
{
  "title": "Can my landlord evict me without notice?",
  "classification": "Eviction",
  "overview": "What Lagos law requires before a landlord can start eviction proceedings.",
  "videoType": "youtube",
  "videoUrl": "https://youtube.com/watch?v=abc123",
  "thumbnailUrl": "https://res.cloudinary.com/demo/image/upload/v1/topic1.jpg",
  "tags": ["eviction", "notice-to-quit"]
}
```
`order` is optional (defaults to last + 1). New topics created by instructors always start as `status: "draft"` server-side — only admin publishing flips a topic to `published`.

**Response `201`**
```json
{
  "success": true,
  "message": "Topic created successfully.",
  "data": {
    "topic": {
      "id": "66d9f2c4c1a2b3c4d5e6f720",
      "moduleId": "66d9f2b3c1a2b3c4d5e6f710",
      "title": "Can my landlord evict me without notice?",
      "classification": "Eviction",
      "overview": "What Lagos law requires before a landlord can start eviction proceedings.",
      "status": "draft",
      "order": 1,
      "videoType": "youtube",
      "videoUrl": "https://youtube.com/watch?v=abc123",
      "thumbnailUrl": "https://res.cloudinary.com/demo/image/upload/v1/topic1.jpg",
      "duration": "0:00",
      "durationSeconds": 0,
      "watchCount": 0,
      "completionRate": 0,
      "likes": 0,
      "comments": 0,
      "tags": ["eviction", "notice-to-quit"],
      "subtopicCount": 0,
      "createdAt": "2026-09-08T10:10:00.000Z",
      "updatedAt": "2026-09-08T10:10:00.000Z"
    }
  },
  "timestamp": "2026-09-08T10:10:00.000Z"
}
```

### `PATCH /instructor/modules/:moduleId/topics/:topicId`
Body: any subset of `title, classification, overview, order, videoType, videoUrl, thumbnailUrl, tags`. Response: `{ "topic": { /* updated */ } }`.

### `DELETE /instructor/modules/:moduleId/topics/:topicId`
Response: `{ "success": true, "message": "Topic deleted successfully.", "timestamp": "..." }`

### `PATCH /instructor/modules/:moduleId/topics/reorder`
```json
{ "orderedIds": ["66d9f2c4c1a2b3c4d5e6f720", "66d9f2c4c1a2b3c4d5e6f721", "66d9f2c4c1a2b3c4d5e6f722"] }
```
Response: `{ "success": true, "message": "Topics reordered successfully.", "timestamp": "..." }`

### `POST /instructor/modules/:moduleId/topics/:topicId/subtopics`
```json
{
  "title": "Step 1: Check your tenancy length",
  "notes": "Explain that notice periods differ by tenancy length: weekly, monthly, quarterly, yearly.",
  "duration": "3:45"
}
```
`order` optional. **Response `201`**
```json
{
  "success": true,
  "message": "SubTopic created successfully.",
  "data": {
    "subtopic": {
      "id": "66d9f2d5c1a2b3c4d5e6f730",
      "topicId": "66d9f2c4c1a2b3c4d5e6f720",
      "moduleId": "66d9f2b3c1a2b3c4d5e6f710",
      "title": "Step 1: Check your tenancy length",
      "notes": "Explain that notice periods differ by tenancy length...",
      "duration": "3:45",
      "durationSeconds": 0,
      "order": 1,
      "viewCount": 0,
      "completedBy": 0,
      "createdAt": "2026-09-08T10:15:00.000Z",
      "updatedAt": "2026-09-08T10:15:00.000Z"
    }
  },
  "timestamp": "2026-09-08T10:15:00.000Z"
}
```

### `PATCH` / `DELETE /instructor/modules/:moduleId/topics/:topicId/subtopics/:subtopicId`
Same shapes as topics — PATCH accepts `title, notes, duration, order`; DELETE returns a plain success message.

### `PATCH /instructor/modules/:moduleId/topics/:topicId/subtopics/reorder`
```json
{ "orderedIds": ["66d9f2d5c1a2b3c4d5e6f730", "66d9f2d5c1a2b3c4d5e6f731"] }
```

---

## 8. Instructor's own module analytics ("how their content grows")

### `GET /instructor/modules/:moduleId/analytics`
Ownership-checked, then identical shape to the admin analytics endpoint.

**Response `200`**
```json
{
  "success": true,
  "message": "Analytics fetched successfully.",
  "data": {
    "moduleId": "66d9f2b3c1a2b3c4d5e6f710",
    "enrolledCount": 210,
    "completionRate": 62,
    "avgRating": 4.8,
    "totalWatchTimeHours": 58.2,
    "progressDistribution": [
      { "label": "Not started", "count": 40, "percentage": 19, "color": "#E5E7EB" },
      { "label": "In progress", "count": 90, "percentage": 43, "color": "#F59E0B" },
      { "label": "Completed", "count": 80, "percentage": 38, "color": "#10B981" }
    ],
    "topicPerformance": [
      {
        "topicId": "66d9f2c4c1a2b3c4d5e6f720",
        "title": "Can my landlord evict me without notice?",
        "classification": "Eviction",
        "order": 1,
        "watchCount": 205,
        "completionRate": 71,
        "likes": 34,
        "comments": 12,
        "status": "published",
        "duration": "8:20"
      }
    ],
    "updatedAt": "2026-09-08T09:00:00.000Z"
  },
  "timestamp": "2026-09-08T10:20:00.000Z"
}
```

---

## 9. Admin: review a submitted module (approve / reject)

### `PATCH /admin/modules/:id/review`
**Approve**
```json
{ "decision": "approve" }
```
`note` optional on approve.

**Reject**
```json
{ "decision": "reject", "note": "Topic 2's video is missing captions — please add before resubmitting." }
```
`note` is **required** when rejecting (400 `VALIDATION_ERROR` otherwise).

**Response `200`** (approve)
```json
{
  "success": true,
  "message": "Module approved and published.",
  "data": {
    "module": {
      "id": "66d9f2b3c1a2b3c4d5e6f710",
      "status": "active",
      "reviewedAt": "2026-09-08T11:00:00.000Z",
      "reviewedBy": "66d9f0a1c1a2b3c4d5e6f7ff",
      "reviewNote": "",
      "...": "rest of module fields"
    }
  },
  "timestamp": "2026-09-08T11:00:00.000Z"
}
```
**Response `200`** (reject) — same shape with `status: "rejected"` and `reviewNote` populated. Only modules with `status: "pending"` can be reviewed (`400 INVALID_STATE` otherwise) — grey out the review button in the admin UI for anything not `pending`.

---

## Quick reference: module lifecycle for the frontend

```
draft ──submit──▶ pending ──approve──▶ active ──(admin can still unpublish──▶ inactive)
  ▲                  │
  └──────reject───────┘   (reviewNote explains why; instructor edits & resubmits)
```

- Instructor can create/edit/delete/add-topics only while `draft` or `rejected`.
- Instructor cannot touch anything once `pending` (read-only until admin decides).
- `active` = live for citizens; `inactive` = admin-unpublished (existing admin-only status, unrelated to the review flow).
- Admin's existing `/admin/modules` CRUD is untouched — this whole flow only adds a parallel instructor-owned path plus the one `/admin/modules/:id/review` endpoint.
