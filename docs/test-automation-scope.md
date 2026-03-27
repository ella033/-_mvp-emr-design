## Test Automation Scope

This frontend does not treat "project-wide 100% coverage" as the quality goal.

The current gate is scoped to UI contracts that are required for natural-language
Playwright scenario generation:

- screen and document utility functions under `src/app/**/_utils/**`
- reusable UI/domain helpers under `src/lib/**`
- page-level model logic under `src/components/**/model/**`
- shared pure helpers under `src/utils/**`

The following areas are intentionally excluded from the frontend coverage gate:

- API client wrappers and route mappers under `src/lib/api/**`
- service adapters under `src/services/**`
- state containers under `src/store/**`
- hooks that mostly orchestrate server state under `src/hooks/**`
- printing, PDF, prescription, and backend-facing integration infrastructure

Reasoning:

- scenario generation quality depends on stable UI behavior, not on duplicating
  backend contract verification in the frontend
- backend truth should be validated in `nestjs-emr-api`
- scenario data creation and orchestration can be handled separately through
  `nextemr-admin`

Cross-project ownership:

- `react-frontend`: UI contract tests, integration tests, Playwright user flows
- `nextemr-admin`: scenario generation/orchestration and test data entry paths
- `nestjs-emr-api`: Prisma schema and backend validation source of truth

Relevant backend references:

- `nextemr-admin/e2e`
- `nextemr-admin/src/app/(dashboard)/test/qa`
- `nestjs-emr-api/prisma/schema.prisma`
- `nestjs-emr-api/prisma/schema/e2e_test.prisma`
