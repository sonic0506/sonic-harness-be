<!-- prettier-ignore -->
<div align="center">

<img src="./assets/mascot.webp" alt="sonic-harness-be mascot" width="160">

# sonic-harness-be

_NestJS + TypeScript 코딩 규칙을 글이 아니라 도구로 지키게 하는 Claude Code 플러그인_

[![Claude Code plugin](https://img.shields.io/badge/Claude_Code-plugin-e8650c?style=flat-square)](#시작하기)
[![Plugin version](https://img.shields.io/github/package-json/v/sonic0506/sonic-harness-be?filename=plugin%2F.claude-plugin%2Fplugin.json&style=flat-square&label=version)](./plugin/.claude-plugin/plugin.json)
[![NestJS + TypeORM](https://img.shields.io/badge/NestJS_+_TypeORM-PostgreSQL_·_Vitest-e0234e?style=flat-square&logo=nestjs&logoColor=white)](#요구-사항)
[![Architecture: Feature-Based + Layered](https://img.shields.io/badge/architecture-Feature--Based_+_Layered-0e9f6e?style=flat-square)](./rules/harness.md)

[개요](#개요) • [시작하기](#시작하기) • [명령어](#명령어) • [동작 방식](#동작-방식) • [규칙 바꾸기](#규칙-바꾸기) • [FAQ](#faq)

</div>

규칙을 문서로만 남겨 두면 사람도 AI도 잊어요. sonic-harness-be는 feature 경계, 레이어 방향, TypeORM 사용법 같은 규칙 대부분을 ESLint로 옮기고, Claude가 파일을 고칠 때마다 그 검사를 자동으로 실행해요. 어긴 코드는 저장 전에 막히거나, 저장 직후 에러로 돌아와 Claude가 직접 고쳐요. Claude가 작업을 끝내려 할 때는 typecheck와 관련 단위 테스트가 통과해야 해요.

[sonic-harness-fe](https://github.com/sonic0506/sonic-harness-fe)의 백엔드판이에요.

> [!TIP]
> 하네스는 `.sonic-harness-be/lock.json`이 있는 프로젝트에서만 동작해요. 플러그인을 설치해도 다른 프로젝트에는 영향이 없어요. FE 하네스(`.sonic-harness/`)와 함께 설치해도 서로의 hook이 끼어들지 않아요.

## 개요

하네스는 네 층으로 되어 있어요.

| 층        | 파일                                                                                                                | 하는 일                                                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 도구      | `eslint.base.mjs`, `eslint-plugin-sonic-be.mjs`, `prettier.base.mjs`, `tsconfig.strict.json`, `commitlint.base.mjs` | feature·레이어 경계, 이름, import 제한, 로컬 규칙 18개(DI·DTO·TypeORM·트랜잭션·N+1 등), strict TypeScript, 커밋 형식을 검사해요                       |
| hooks     | `plugin/hooks/`                                                                                                     | 파일을 쓰기 전에 경로(kebab-case)를 검사하고, 쓴 뒤 Prettier와 `eslint --fix`를 실행해요. 작업을 끝낼 때 typecheck와 바뀐 파일의 단위 테스트를 돌려요 |
| CI        | `templates/.github/workflows/ci.yml`, `spectral.yaml`                                                               | lint·단위·e2e·OpenAPI·migration·보안을 PR마다 검사해요. 사람이 쓴 코드도 같은 규칙을 지나요                                                           |
| 규칙 문서 | `harness.md`                                                                                                        | 어디에 둘지 판단하는 기준과 예시 코드예요. lint로 잡기 어려운 규칙도 여기에 있어요                                                                    |

규칙은 이 저장소 한 곳에서 관리하고, 각 프로젝트는 명령어로 받아 써요. 프로젝트에서 고친 공통 규칙은 PR로 이 저장소에 돌려보내요.

## 주요 기능

- **Feature·레이어 경계 강제**: `controller → service → repository` 방향만 허용하고, 다른 feature는 `index.ts`로만 가져오게 해요. 파일 접미사로 레이어가 정해지고, 목록에 없는 이름은 만들 수 없어요(`eslint-plugin-boundaries`).
- **TypeORM 사용법 고정**: TypeORM은 repository에서만, 목록 조회에는 `take`, raw SQL·`synchronize`·eager/lazy relation 금지, `timestamptz`, 반복문 안 repository 호출(N+1) 금지. DB 이름은 snake_case 전략으로 맞춰요.
- **API 계약**: 요청·응답 DTO와 Swagger를 함께 쓰고, 모든 에러가 RFC 9457 `ProblemDetails`로 문서화돼요. `openapi.json`이 코드와 같은지, 이전 버전과 호환되는지 CI가 확인해요.
- **feature 뼈대**: `/sonic-harness-be:feature`가 module·controller·service·repository·DTO·entity·단위·e2e 테스트를 규칙에 맞게 만들고 `app.module.ts`에 등록해요.
- **바로 쓰는 시작 파일**: 전역 예외 필터, JWT 전역 guard와 `@Roles`, pino 로그·request ID, throttler·helmet, health, zod env, Testcontainers e2e, 공통 코드(선택)를 init이 넣어 줘요.
- **자동 수정 루프**: hook이 Claude의 모든 파일 수정 뒤에 format과 lint를 돌리고, 고치지 못한 에러를 다시 Claude에게 넘겨요. typecheck나 테스트가 실패하면 작업을 끝내지 못해요.
- **원본과 동기화**: `lock.json`이 받은 버전과 파일 해시를 기억해서, 원본의 변경과 프로젝트의 변경을 구분해 합쳐요.
- **검증 장치**: 규칙마다 lint 샘플 테스트가 있고, Claude의 실제 행동을 기준 작업 5개로 평가해요.

## 시작하기

### 요구 사항

- [Claude Code](https://claude.com/claude-code)
- Node.js 20 이상, git
- `nest new`로 만든 NestJS 12 + TypeScript 프로젝트(또는 기존 NestJS 프로젝트), PostgreSQL
- e2e 테스트를 돌리려면 Docker(Testcontainers)
- `contribute`를 쓰려면 [GitHub CLI](https://cli.github.com)(`gh auth login`)

### 설치

Claude Code에서 한 번만 실행해요.

```text
/plugin marketplace add sonic0506/sonic-harness-be
/plugin install sonic-harness-be@sonic-harness-be
```

다른 Claude Code 세션이 열려 있을 때는 터미널에서 CLI로도 설치해요.

```bash
claude plugin marketplace add sonic0506/sonic-harness-be
claude plugin install sonic-harness-be@sonic-harness-be
```

### 프로젝트에 적용

프로젝트 루트에서 Claude Code를 열고 실행해요.

```text
/sonic-harness-be:init
```

init은 시작 전에 무엇을 할지 보여 주고, "공통 코드(common-codes) 기능을 쓰나요? (Y/N)"를 함께 물어요. 그다음 이렇게 처리해요.

1. 원본 최신 규칙을 `.sonic-harness-be/`에 받고, 없는 템플릿 파일만 복사해요.
2. `nest new`로 막 만든 프로젝트면 `main.ts`, `app.module.ts`, vitest 설정을 하네스 템플릿으로 바꾸고 예시 파일과 `.oxlintrc.json`, `.prettierrc`를 지워요.
3. tsconfig에 `.sonic-harness-be/tsconfig.strict.json`을 연결하고, 패키지와 npm scripts, nest-cli Swagger 플러그인을 설정해요.
4. Y면 공통 코드 feature(템플릿, 패키지, seed migration, `app.module.ts` 연결)를 더해요.
5. lint·typecheck·test·순환 의존·Prettier가 통과하는지 확인하고 `openapi.json`을 만들어요.
6. GitHub 저장소면 CI check들을 main 브랜치의 필수 check로 거는 명령을 보여 주고, 실행할지 물어요.

> [!NOTE]
> 명령과 hook은 새 세션부터 확실히 적용돼요. 설치한 뒤, 그리고 init 뒤에는 Claude Code를 다시 열어 주세요.

적용이 끝난 프로젝트는 이런 모습이에요.

```text
my-api/
├─ .sonic-harness-be/     원본이 관리하는 파일 (update로 갱신)
│  ├─ harness.md
│  ├─ eslint.base.mjs, eslint-plugin-sonic-be.mjs, prettier.base.mjs, commitlint.base.mjs
│  ├─ tsconfig.strict.json, spectral.yaml
│  └─ lock.json           받은 버전, 파일별 해시, commonCodes(공통 코드 사용 여부)
├─ eslint.config.mjs      프로젝트 소유: base + 이 프로젝트만의 규칙
├─ AGENTS.md              @.sonic-harness-be/harness.md 를 불러와요 (CLAUDE.md는 @AGENTS.md)
├─ openapi.json           코드에서 만든 API 문서 (CI가 비교해요)
└─ src/
   ├─ modules/{feature}/  module · controller · service · repository · dto · entities
   ├─ compositions/       여러 feature를 조합하는 통합 API
   ├─ common/             예외, 필터, 인증, 페이지네이션
   ├─ config/env.ts
   └─ infra/              database(data-source, migrations), health
```

## 명령어

| 명령어                                  | 하는 일                                                                                                      | 승인              |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------- |
| `/sonic-harness-be:init [common-codes]` | 이 프로젝트에 최신 하네스를 적용해요. 공통 코드 기능을 쓸지 함께 물어요                                      | 시작 전           |
| `/sonic-harness-be:feature <이름>`      | module·controller·service·repository·DTO·entity·테스트 뼈대를 만들어요. `--no-entity`면 controller·service만 | 없음              |
| `/sonic-harness-be:status`              | 적용 버전, 원본의 새 변경, 프로젝트에서 고친 하네스 파일을 보여 줘요                                         | 없음              |
| `/sonic-harness-be:update`              | 최신 규칙을 받아요. 프로젝트에서 고친 파일은 덮어쓰지 않고 합쳐요                                            | 적용 전, 충돌마다 |
| `/sonic-harness-be:check`               | 마지막 점검 뒤 받은 규칙 변경을 코드가 지키는지 점검해요                                                     | 고치기 전         |
| `/sonic-harness-be:contribute`          | 프로젝트에서 고친 공통 규칙을 이 저장소에 PR로 올려요                                                        | 브랜치 전, PR 전  |

평소 흐름은 다음과 같아요.

- **새 프로젝트**: `init`
- **기능 추가**: `feature <이름>` → 요구에 맞게 채우기 → `npm run openapi`
- **진행 중**: `status` → `update` → `check`
- **공통 규칙을 고쳤을 때**: `.sonic-harness-be/` 파일 수정 → `contribute` → PR 병합 → 다른 프로젝트에서 `update`

> [!IMPORTANT]
> `.sonic-harness-be/` 파일은 공통 규칙을 바꿀 때만 고쳐요. 이 프로젝트에만 필요한 규칙은 프로젝트 `eslint.config.mjs`나 `AGENTS.md`에 둬요.

### 공통 코드

공통 코드는 관리자가 관리하는 단순 분류·유형 값(상품 유형 등)이에요. init에서 **Y**를 고르면 그룹·코드 entity, 캐시, `@IsCommonCode`·`@NotCommonCode` 검증, 관리 API, seed migration을 넣고 `lock.json`에 `commonCodes: true`를 남겨요. 나중에 켜려면 이렇게 실행해요.

```text
/sonic-harness-be:init common-codes
```

분류 값이 필요할 때 공통 코드로 둘지, feature로 둘지는 [`harness.md` 12절](./rules/harness.md#12-공통-코드)의 기준을 따라요.

## 동작 방식

Claude가 파일을 쓰고 작업을 끝낼 때 hook이 차례로 실행돼요.

```text
Write src/modules/order/order.service.ts
 ├─ PreToolUse   경로가 kebab-case가 아니면 쓰기 취소, 이유를 Claude에게 전달
 └─ PostToolUse  prettier --write → eslint --fix → 남은 에러가 있으면 Claude가 다시 고침
Stop
 └─ typecheck → 바뀐 파일의 단위 테스트 → 실패하면 작업을 끝내지 못하고 Claude가 고침
```

PR에서는 CI(`.github/workflows/ci.yml`)가 같은 규칙을 다시 검사해요. job 이름이 그대로 필수 check예요.

| job         | 검사                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------ |
| `lint`      | ESLint, typecheck, Prettier, 순환 의존, `.env.example`과 env 스키마 키, controller마다 e2e |
| `test`      | 단위 테스트와 service 커버리지 80%                                                         |
| `e2e`       | Testcontainers Postgres 위 e2e                                                             |
| `openapi`   | `openapi.json`이 코드와 같은지, Spectral 규칙, 이전 버전과 호환(oasdiff)                   |
| `migration` | migration 누락                                                                             |
| `security`  | 비밀 값 커밋(gitleaks), 운영 의존성 critical 취약점, 새 패키지의 이유                      |

`update`는 파일마다 `lock.json`의 해시와 비교해 결정해요.

| 원본   | 프로젝트 | 결과                                                          |
| ------ | -------- | ------------------------------------------------------------- |
| 바뀜   | 그대로   | 새 원본으로 바꿔요                                            |
| 그대로 | 바뀜     | 프로젝트 파일을 그대로 둬요                                   |
| 바뀜   | 바뀜     | 이전 원본·새 원본·프로젝트 파일을 나란히 두고 Claude가 합쳐요 |

전체 규칙과 예시 코드는 [`rules/harness.md`](./rules/harness.md)에 있어요.

> [!WARNING]
> hook은 그 프로젝트의 `node_modules`에 설치된 Prettier·ESLint·tsc·Vitest를 실행해요. 믿을 수 없는 저장소를 열 때는 플러그인을 꺼 두세요.

## 규칙 바꾸기

이 저장소의 구조는 다음과 같아요.

```text
.claude-plugin/marketplace.json  플러그인 목록 (source: ./plugin)
plugin/                          명령어 6개, hooks, scripts/harness.mjs
rules/                           프로젝트 .sonic-harness-be/로 들어가는 파일
templates/                       init 때 없는 파일만 복사하는 시작 파일
templates.feature/               feature 뼈대 (sample-item을 새 이름으로 바꿔요)
templates.feature-service/       feature --no-entity 뼈대 (controller·service·DTO·테스트)
templates.common-codes/          init에서 공통 코드를 Y로 고르면 더하는 파일
tests/lint-samples/              ESLint 규칙 테스트
evals/                           Claude 행동 평가 (hook·init 확인, 기준 작업 5개)
```

규칙을 바꿀 때는 이 순서를 따라요.

1. `tests/lint-samples`에 규칙을 어기는 샘플(첫 줄 `// expect: 규칙`)과 지키는 샘플을 추가하고 `npm run test:lint`를 실행해요.
2. `rules/CHANGELOG.md` 맨 위에 한 줄을 써요.
3. `evals/run.sh`로 기준 작업을 다시 돌리고 `evals/results/`의 이전 결과와 비교해요.
4. 명령어나 hook을 바꿨다면 `plugin/.claude-plugin/plugin.json`의 `version`을 올려요.

<details>
<summary>평가 스크립트</summary>

| 스크립트                     | 확인하는 것                                                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `evals/setup-sandbox.sh`     | 평가용 Nest 프로젝트(`sandbox/nest`, 공통 코드 켬)를 플러그인 스크립트로 새로 만들어요                                 |
| `evals/hook-check.sh`        | 규칙을 어긴 파일을 hook이 막고, 최종 파일이 lint·typecheck를 통과하는지 확인해요                                       |
| `evals/init-check.sh [y\|n]` | 새 `nest new` 프로젝트에서 `/sonic-harness-be:init`(공통 코드 Y·N)만으로 lint·test·build·CI 검사가 통과하는지 확인해요 |
| `evals/run.sh [작업]`        | 기준 작업 5개를 [`evals/checklist.md`](./evals/checklist.md)로 채점하고 결과 코드를 `evals/results/*.patch`로 남겨요   |

평가는 개인 전역 설정 없이 이 저장소의 플러그인만 얹어서 실행하고, Docker가 필요해요. 원본은 이 저장소의 **커밋된** 상태예요.

</details>

<details>
<summary>환경 변수</summary>

| 변수                      | 기본값                                              | 쓰임                                                           |
| ------------------------- | --------------------------------------------------- | -------------------------------------------------------------- |
| `SONIC_HARNESS_BE_ORIGIN` | `https://github.com/sonic0506/sonic-harness-be.git` | 원본 git URL이에요. 테스트할 때는 로컬 경로를 넣어요           |
| `SONIC_HARNESS_BE_HOME`   | `~/.sonic-harness-be`                               | 원본 clone 위치예요. `contribute`가 여기에서 브랜치를 만들어요 |

</details>

## FAQ

<details>
<summary>init 뒤에도 hook이 동작하지 않아요</summary>

Claude Code는 세션을 시작할 때 플러그인 hook을 읽어요. Claude Code를 다시 열고, 프로젝트 루트에 `.sonic-harness-be/lock.json`이 있는지 확인하세요.

</details>

<details>
<summary>e2e에서 "Could not find a working container runtime strategy"가 나와요</summary>

Docker 소켓 위치가 기본값이 아니에요. Colima라면 `DOCKER_HOST=unix://$HOME/.colima/default/docker.sock`, `TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock`를 셸 설정에 넣어요.

</details>

<details>
<summary>update에서 충돌이 났어요</summary>

프로젝트와 원본이 같은 하네스 파일을 둘 다 고친 경우예요. `/sonic-harness-be:update`가 `<파일>.base`(이전 원본), `<파일>.incoming`(새 원본), 프로젝트 파일을 비교해 합친 내용을 제안하고, 확인을 받은 뒤 정리해요.

</details>

<details>
<summary>contribute가 "원본에서도 바뀌었어요"라며 멈춰요</summary>

올리려는 파일이 원본에서도 바뀐 상태예요. 먼저 `/sonic-harness-be:update`로 받아 합친 뒤 다시 실행하세요.

</details>

<details>
<summary>lint를 실행하면 boundaries `mode` deprecated 경고가 나와요</summary>

하네스가 알고 쓰는 설정이에요. 결과에는 영향이 없어요.

</details>
