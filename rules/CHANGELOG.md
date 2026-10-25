# 하네스 규칙 변경 기록

새 항목은 맨 위에 써요. `/sonic-harness-be:update`가 이 기록과 git 로그로 무엇이 바뀌었는지 보여 줘요.

- 2026-10-25: 템플릿과 harness.md. Nest 12 기본(ESM, Vitest)에 맞춰 테스트 규칙을 Jest에서 Vitest로 바꾸고 import에 `.js`를 붙여요. `templates/`(main·app.setup·전역 필터 RFC 9457·JWT 전역 guard·Roles·nestjs-pino·request ID·throttler·helmet·health·zod env·data-source·Testcontainers e2e·라우트 전체 401 테스트·MSW), `templates.feature/`(sample-item 뼈대: TransactionHost repository, service 단위 테스트, CRUD e2e), `templates.common-codes/`(그룹·코드 entity, 캐시, `@IsCommonCode`·`@NotCommonCode`, 관리 API, seed migration). migration은 빌드에 포함되도록 `src/infra/database/migrations/`에 두고 lint에서 빼요. module이 같은 feature constants를, service가 같은 feature service를 가져올 수 있어요
- 2026-10-25: lint 규칙. Feature·Layer 경계(boundaries: 접미사별 레이어, 다른 feature는 index.ts로만, compositions는 조합만), import 제한(TypeORM 위치, HTTP 예외는 controller·common, forwardRef 금지), 매직 넘버, disable 주석 이유 필수, 해요체 테스트 이름. 로컬 규칙 18개(`eslint-plugin-sonic-be.mjs`): DI·DTO·응답 DTO·예외·TypeORM(take, raw SQL, synchronize, eager/lazy, timestamptz)·트랜잭션(warn)·N+1·업로드·공통 코드·통합 API(warn). 샘플은 `npm run test:lint`
- 2026-10-25: 첫 뼈대. Prettier·commitlint는 FE 하네스와 같아요. tsconfig는 데코레이터 메타데이터를 켜고 `verbatimModuleSyntax`·`exactOptionalPropertyTypes`를 꺼요. ESLint는 TypeScript 공통 규칙만 있고, `consistent-type-imports`는 Nest DI를 깨서 쓰지 않아요 (0.1.0)
