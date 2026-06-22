---
name: Stateless auth token format
description: How the travel-tracker API token is built/verified and the bcrypt-dot parsing trap
---

# Travel-tracker stateless auth token

Token = `base64url(JSON {id,username,role})` + `"."` + `passwordHash.slice(-8)`.
Built in `auth.ts` login/register; verified in `requireAuth`.

## The trap (caused random lockout for ~22% of users)
The tail is the last 8 chars of a **bcrypt** hash, and bcrypt's alphabet is `./A-Za-z0-9` — it can contain `.`.
So parsing the token with `token.split(".")[1]` breaks whenever the tail contains a dot (3+ parts), failing the tail check and returning 401 for valid users.

**Rule:** split on the FIRST dot only (`indexOf(".")` + `slice`). The base64url payload never contains `.`, so the first dot is always the true separator.

**Why:** symptom was "login works for some users but not others" / "won't work for some" — it depends on the user's password hash, so it looks random.
