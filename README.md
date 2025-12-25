# Lab Tools (Web)

A minimal, Finder‑style **Lab Assistant** for organizing experimental work:
- Firebase Auth (email/password)
- Personal & shared labs
- Finder‑like file manager inside each lab
- Notes (Markdown + tables + KaTeX math)
- Protocols: paste → auto checklist (each step editable + notes)
- Timers: multiple timers, synced via Firestore, **global notification** + one‑click jump back
- Upload & preview files (images inline)
- Export report (.md + .html)

## Tech
- Vite + React + TypeScript
- TailwindCSS
- Firebase: Auth, Firestore, Storage

---

## Local development

```bash
npm install
npm run dev
```

Open: http://localhost:5173

---

## Deploy to GitHub Pages

This repo includes a GitHub Pages workflow:
- Push to `main` → build → deploy to Pages.

Steps:
1. In GitHub repo settings → **Pages**:
   - Source: **GitHub Actions**
2. Push to `main`.

Vite base path is automatically set for GitHub Actions.

---

## Firebase setup (required)

Enable in Firebase console:
- **Authentication** → Email/Password
- **Firestore Database**
- **Storage**

The app uses the Firebase config embedded in `src/lib/firebase.ts`.

### Recommended Firestore rules

> This app expects:
> - A user can read labs they are a member of.
> - Public labs are visible in lobby, but items remain member‑only by default.

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }
    function isMember(labId) {
      return isSignedIn() && request.auth.uid in get(/databases/$(database)/documents/labs/$(labId)).data.members;
    }

    match /labs/{labId} {
      allow read: if isSignedIn() && (resource.data.isPublic == true || request.auth.uid in resource.data.members);
      allow create: if isSignedIn() && request.resource.data.ownerUid == request.auth.uid;
      allow update, delete: if isSignedIn() && request.auth.uid in resource.data.members;

      match /items/{itemId} {
        allow read, write: if isMember(labId);
      }
    }
  }
}
```

### Recommended Storage rules

```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isSignedIn() { return request.auth != null; }
    function isMember(labId) {
      return isSignedIn() && request.auth.uid in
        firestore.get(/databases/(default)/documents/labs/$(labId)).data.members;
    }

    match /labs/{labId}/uploads/{allPaths=**} {
      allow read, write: if isMember(labId);
    }
  }
}
```

---

## Data model (Firestore)

- `labs/{labId}`
  - `name: string`
  - `type: "personal" | "shared"`
  - `ownerUid: string`
  - `members: string[]`
  - `isPublic: boolean`

- `labs/{labId}/items/{itemId}`
  - common fields: `type`, `name`, `parentId`, `createdBy`, `createdAt`, `updatedAt`
  - type‑specific fields:
    - note: `content`
    - protocol: `raw`, `steps[]`
    - timer: `durationSec`, `status`, `startedAt`
    - file: `storagePath`, `downloadUrl`, `mimeType`, `size`

---

## Notes

- Invite flow (email → add member) can be added later; currently membership is a `members[]` array on the lab document.
- Timer “done” state is best‑effort (clients mark timers done when time reaches 0).
