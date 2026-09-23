# AI Agents Guide

Welcome! Please follow these guidelines when interacting with this codebase:

> [!IMPORTANT]
> **Environment & Secrets**
> Do NOT access, read, or modify any `.env` files or environment variables without explicit consent from the user.

> [!NOTE]
> **Codebase Structure**
> Always adhere to the current monorepo structure:
> - `packages/shared`: Shared types and constants.
> - `apps/backend`: Node.js/Express backend (MVC pattern).
> - `apps/frontend`: Vite/React frontend SPA.
> Maintain clear boundaries and ensure shared dependencies are only placed in `packages/shared`.
