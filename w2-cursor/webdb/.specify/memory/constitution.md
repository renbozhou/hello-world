<!--
Sync Impact Report
- Version change: template (unversioned) -> 1.0.0
- Modified principles:
  - [PRINCIPLE_1_NAME] -> I. Ergonomic Python-First
  - [PRINCIPLE_2_NAME] -> II. End-to-End Strict Typing
  - [PRINCIPLE_3_NAME] -> III. Pydantic Data Contracts
  - [PRINCIPLE_4_NAME] -> IV. camelCase JSON Boundary
  - [PRINCIPLE_5_NAME] -> V. No User Management Scope
- Added sections:
  - Product Scope Constraints
  - Delivery Workflow & Quality Gates
- Removed sections:
  - None
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md
  - ✅ .specify/templates/spec-template.md
  - ✅ .specify/templates/tasks-template.md
  - ✅ .specify/templates/constitution-template.md
  - ⚠ pending: .specify/templates/commands/*.md (directory not present)
- Deferred TODOs:
  - None
-->
# WebDB Constitution

## Core Principles

### I. Ergonomic Python-First

All backend Python code MUST follow ergonomic Python style: clear naming, small composable
functions, predictable module boundaries, and minimal incidental complexity. Team members MUST
prefer readability and explicit intent over clever implementations.
Rationale: this project is iteration-heavy and query-centric; maintainable Python directly
improves delivery speed and operational safety.

### II. End-to-End Strict Typing

Backend and frontend code MUST use strict type annotations on public APIs, data boundaries, and
domain logic. Unannotated cross-module interfaces and loosely typed payloads are NOT allowed.
Rationale: strict typing prevents schema drift between SQL metadata, API responses, and UI views.

### III. Pydantic Data Contracts

Backend data models, request/response schemas, and validation contracts MUST be defined with
Pydantic models. Ad-hoc dict-based schema handling is prohibited for production paths.
Rationale: centralized schema validation keeps metadata and query results consistent and auditable.

### IV. camelCase JSON Boundary

All JSON produced by backend APIs MUST expose camelCase field names. Internal model fields MAY use
snake_case, but serialization at the API boundary MUST be camelCase and consistently documented.
Rationale: frontend integration remains stable and language-agnostic when API casing is uniform.

### V. No User Management Scope

The system MUST NOT implement user identity, authentication, authorization, or account lifecycle
features unless this constitution is amended first. Feature proposals MUST assume a single trusted
operator context.
Rationale: current product scope focuses on database connectivity, metadata exploration, and query
authoring; auth workflows add non-goal complexity.

## Product Scope Constraints

- The product MUST support registering database URLs and retrieving database metadata.
- The UI MUST provide navigation for database/table/view hierarchy and detailed metadata panes.
- The system MUST support both direct SQL input and natural-language-assisted SQL generation.
- Feature work MUST prioritize metadata correctness, query safety checks, and explainability.

## Delivery Workflow & Quality Gates

- Specs and plans MUST include explicit checks for all five core principles before implementation.
- Tasks MUST include contract validation work for Pydantic schemas and camelCase serialization.
- Pull requests MUST show typing coverage for changed API boundaries in frontend and backend.
- Any change that introduces user-management behavior MUST be rejected unless constitution version
  is amended with approved scope expansion.

## Governance

This constitution overrides local conventions and templates when conflicts exist. Amendments MUST
be proposed in writing, reviewed with impact analysis, and merged with corresponding template
updates in the same change set.

Versioning policy follows semantic versioning:

- MAJOR for incompatible governance or principle removals/redefinitions.
- MINOR for new principles/sections or materially expanded obligations.
- PATCH for clarifications and non-semantic wording refinements.

Compliance review is mandatory in planning, task generation, and code review. Reviewers MUST block
changes that violate any MUST rule without an approved amendment.

**Version**: 1.0.0 | **Ratified**: 2026-04-21 | **Last Amended**: 2026-04-21
