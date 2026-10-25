---
description: 이 NestJS 프로젝트에 최신 하네스 적용 (규칙 파일, 템플릿, 패키지, tsconfig 연결)
argument-hint: '[common-codes]'
allowed-tools: Bash(node:*), Bash(npm:*), Bash(npx:*), Bash(git:*), Bash(ls:*), Bash(cat:*), Bash(head:*), Bash(test:*), Bash(mkdir:*), Read, Edit, Write
---

이 프로젝트(NestJS 12 + TypeScript)에 sonic-harness-be를 적용해요.
스크립트: `node "${CLAUDE_PLUGIN_ROOT}/scripts/harness.mjs"`

## 지금 프로젝트

!`ls -a; cat package.json 2>/dev/null | head -40; test -d .sonic-harness-be && echo "(이미 하네스 있음)" || true`

인자: `$ARGUMENTS`

## 순서

1. 이미 `.sonic-harness-be/`가 있으면:
   - 인자가 `common-codes`면 "공통 코드 켜기"(아래)만 하고 끝내요. 무엇을 바꾸는지 먼저 보여 주고 확인을 받아요.
   - 아니면 멈추고 `/sonic-harness-be:update`를 안내해요.
2. 무엇을 할지 짧게 보여 주고 **사용자 확인을 받아요**. 이때 **"공통 코드(common-codes) 기능을 쓰나요? (Y/N)"도 함께 물어요**(인자가 `common-codes`면 Y로 보고 묻지 않아요). 공통 코드는 관리자가 관리하는 단순 분류·유형 값(상품 유형 등)과 `@IsCommonCode` 검증이에요(harness.md 12절).
   - `.sonic-harness-be/`에 원본 최신 규칙을 받고, 없는 템플릿만 복사해요(있는 파일은 그대로 둬요).
   - `nest new`로 막 만든 프로젝트면(`app.service.ts`가 Hello World) `main.ts`, `app.module.ts`, vitest 설정을 하네스 템플릿으로 바꾸고, 예시 파일(`app.controller*`, `app.service.ts`, `test/app.e2e-spec.ts`)과 `.oxlintrc.json`, `.prettierrc`를 지워요.
   - tsconfig에 `.sonic-harness-be/tsconfig.strict.json`을 연결해요.
   - 패키지를 설치하고(oxlint는 지워요) npm scripts와 nest-cli Swagger 플러그인을 설정해요.
   - Y면 공통 코드 feature(템플릿, 패키지, migration, app.module 연결)를 더해요.
3. `harness.mjs init`을 실행해요. 출력의 "건너뛴 템플릿"을 기억해요.
4. `harness.mjs deps`를 실행해요(시간이 걸려요).
5. 직접 손볼 곳을 처리해요. 각각 무엇을 바꾸는지 말하고 진행해요.
   - **건너뛴 템플릿**: 프로젝트에 원래 있던 `main.ts`, `app.module.ts`, `eslint.config.*`, `vitest.config*.ts`, `AGENTS.md` 등이 하네스 템플릿과 다르면 diff를 보여 주고, 하네스 템플릿 내용으로 합칠지 물어요. 특히:
     - `eslint.config.mjs`는 `./.sonic-harness-be/eslint.base.mjs`를 불러와야 해요.
     - `main.ts`는 `app.setup.ts`의 `configureApp`을 거쳐야 해요(e2e와 같은 설정).
     - `app.module.ts`의 `imports` 안에 `// feature 모듈은 여기에 더해요` 줄을 남겨 둬요(feature 명령이 이 줄 앞에 모듈을 더해요).
     - 건너뛴 `CLAUDE.md`에는 `@AGENTS.md`를, `AGENTS.md`에는 `@.sonic-harness-be/harness.md`를 넣어요.
   - **다른 lint·format 설정**(`.eslintrc*`, `.prettierrc*`, `.oxlintrc.json`)이 남아 있으면 제거를 제안해요. `.prettierrc`가 있으면 하네스 `prettier.config.mjs`보다 먼저 읽혀요.
   - 이미 entity·모듈이 있는 프로젝트면 구조를 바로 옮기지 말고, lint 결과를 보여 준 뒤 옮길 계획을 제안해요(묻지 않고 대규모로 옮기지 않아요).
6. Y를 골랐으면 "공통 코드 켜기"(아래)를 해요.
7. `.env`가 없으면 `.env.example`을 복사해 `.env`를 만들고, `DATABASE_URL`과 `JWT_SECRET`을 바꿔야 한다고 알려요.
8. 확인: `npm run lint`, `npm run typecheck`, `npm test`, `npx nest build`. 실패하면 고쳐요(규칙을 끄는 주석은 쓰지 않아요). Docker가 있으면 `npm run test:e2e`도 돌려요.
9. 끝나면 알려 줘요:
   - 적용 버전과 만든·바꾼·지운 파일
   - `AGENTS.md` 아래쪽 "이 프로젝트 정보"를 채워 달라는 안내
   - 새 feature는 `/sonic-harness-be:feature <이름>`으로 만든다는 안내
   - N이면 나중에 켜는 방법: `/sonic-harness-be:init common-codes`
   - git 저장소가 아니면 `git init` 뒤 `npx husky`를 실행하라는 안내
   - hook은 새 세션부터 확실히 적용된다는 안내

## 공통 코드 켜기

1. `harness.mjs common-codes`를 실행해요. 공통 코드 템플릿을 복사하고(migration은 지금 시각 이름으로), `@nestjs/cache-manager`·`cache-manager`를 설치하고, `app.module.ts`에 `CommonCodesModule`을 더하고, `lock.json`에 `commonCodes: true`를 기록해요.
2. 출력의 "건너뜀"이 있으면 그 파일을 공통 코드 템플릿과 비교해 합쳐요. 특히 `test/setup/seed-tables.ts`에 `'common_code_groups'`가 있어야 e2e가 seed 그룹을 지우지 않아요.
3. "직접 할 일"이 있으면 처리해요.
4. 예시 그룹 `EXAMPLE_TYPE`은 첫 실제 그룹을 정하면 `common-code-groups.constants.ts`와 새 migration에서 바꾸라고 안내해요.
