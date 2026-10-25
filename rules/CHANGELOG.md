# 하네스 규칙 변경 기록

새 항목은 맨 위에 써요. `/sonic-harness-be:update`가 이 기록과 git 로그로 무엇이 바뀌었는지 보여 줘요.

- 2026-10-25: 첫 뼈대. Prettier·commitlint는 FE 하네스와 같아요. tsconfig는 데코레이터 메타데이터를 켜고 `verbatimModuleSyntax`·`exactOptionalPropertyTypes`를 꺼요. ESLint는 TypeScript 공통 규칙만 있고, `consistent-type-imports`는 Nest DI를 깨서 쓰지 않아요 (0.1.0)
