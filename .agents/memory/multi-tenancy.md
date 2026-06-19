---
name: Multi-tenancy data isolation
description: How per-user data scoping is implemented and the TS pattern used for auth middleware
---

All data tables (visits, travel_links, country_memories) have a `user_id` FK to `users` with `.default(1)` so existing rows got admin's ID when column was added.

**AuthRequest pattern:**
`express-serve-static-core` module augmentation fails with `"types": ["node"]` in tsconfig. Fix: export `AuthRequest extends Request { authUser: AuthUser }` from `auth.ts`, cast in every route handler: `(req as AuthRequest).authUser.id`.

**Why:** The tsconfig intentionally restricts types to node only, so ambient module augmentation for express internals can't be resolved.

**How to apply:** Any new route that needs the logged-in user must import `AuthRequest` from `./auth` and cast.

**country_memories unique constraint:** Changed from single-column `.unique()` on `countryCode` to composite `uniqueIndex("memories_user_country_unique").on(table.userId, table.countryCode)`. The `.onConflictDoUpdate()` target is now `[countryMemoriesTable.userId, countryMemoriesTable.countryCode]`.

**Registration:** Public `POST /api/auth/register` endpoint in `auth.ts`. Returns a token immediately (auto-login). New users get "editor" role.
