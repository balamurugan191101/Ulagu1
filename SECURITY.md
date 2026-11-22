# Security and deployment

This backend has basic application hardening, but security also depends on the database, hosting platform, secrets, and client application. Do not treat this project as certified or “fully secure.”

## Required production configuration

- Set `NODE_ENV=production` and a unique `JWT_SECRET` with at least 32 random bytes using your hosting provider's secret manager. Never commit `.env` files or share a secret between environments.
- Set `DATABASE_URL` to a dedicated PostgreSQL application account with only the permissions the API needs. Use a provider connection string with TLS and keep certificate verification enabled.
- Set `CORS_ORIGINS` to the exact HTTPS origins of trusted web clients. Native clients may omit `Origin`; CORS is not authentication.
- Set `TRUST_PROXY` only when deployed behind a known reverse proxy. Use the correct hop count or trusted proxy configuration for that topology.
- Terminate HTTPS at a trusted load balancer or hosting platform. Do not expose the local PEM/key files as deployment assets; rotate/reissue them if they were ever shared or committed.
- Restrict database/network access, keep Node.js and dependencies patched, and configure provider level backups, monitoring, and rate limiting for multi-instance deployments.

Authentication currently provides registration, login, and a protected `/api/auth/me` endpoint with 15 minute bearer access tokens. There is no refresh-token rotation, email verification, password reset, MFA, or account recovery flow. Add and review those flows before relying on them for a production user base.
