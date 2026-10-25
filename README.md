# sonic-harness-be

_NestJS + TypeScript 코딩 규칙을 글이 아니라 도구로 지키게 하는 Claude Code 플러그인_

[sonic-harness-fe](https://github.com/sonic0506/sonic-harness-fe)의 백엔드판이에요. 구조는 Feature-Based + Layered(Controller → Service → Repository), ORM은 TypeORM이에요.

> [!NOTE]
> 만드는 중이에요. 하네스는 `.sonic-harness-be/lock.json`이 있는 프로젝트에서만 동작해요. FE 하네스(`.sonic-harness/`)와 함께 설치해도 서로의 hook이 끼어들지 않아요.

## 설치

```text
/plugin marketplace add sonic0506/sonic-harness-be
/plugin install sonic-harness-be@sonic-harness-be
```

## 명령어

| 명령어                                  | 하는 일                                                                 |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `/sonic-harness-be:init [common-codes]` | 이 프로젝트에 최신 하네스를 적용해요. 공통 코드 기능을 쓸지 함께 물어요 |
| `/sonic-harness-be:feature <이름>`      | module·controller·service·repository·DTO·entity·테스트 뼈대를 만들어요  |
| `/sonic-harness-be:status`              | 적용 버전, 원본의 새 변경, 프로젝트에서 고친 하네스 파일을 보여 줘요    |
| `/sonic-harness-be:update`              | 최신 규칙을 받아요. 프로젝트에서 고친 파일은 덮어쓰지 않고 합쳐요       |
| `/sonic-harness-be:check`               | 마지막 점검 뒤 받은 규칙 변경을 코드가 지키는지 점검해요                |
| `/sonic-harness-be:contribute`          | 프로젝트에서 고친 공통 규칙을 이 저장소에 PR로 올려요                   |

hook은 파일을 쓰기 전에 경로(kebab-case)를 검사하고, 쓴 뒤 Prettier와 `eslint --fix`를 실행해요. Claude가 작업을 끝내려 할 때는 typecheck와 바뀐 파일의 단위 테스트를 돌리고, 실패하면 끝내지 못하게 해요.

CI(`.github/workflows/ci.yml`)는 lint·typecheck·순환 의존·단위·e2e·OpenAPI(코드 일치, 규칙, 호환성)·migration 누락·비밀 값·취약점을 검사해요. init이 이 check들을 main 브랜치의 필수 check로 거는 명령을 안내해요.

> [!NOTE]
> hook은 `.sonic-harness-be/lock.json`이 있는 프로젝트에서 그 프로젝트의 `node_modules`에 설치된 Prettier·ESLint·tsc·Vitest를 실행해요. 믿을 수 없는 저장소를 열 때는 플러그인을 꺼 두세요.

## 저장소 구조

```text
.claude-plugin/marketplace.json  플러그인 목록 (source: ./plugin)
plugin/                          명령어, hooks, scripts/harness.mjs
rules/                           프로젝트 .sonic-harness-be/로 들어가는 파일 (harness.md, eslint, tsconfig …)
templates/                       init 때 없는 파일만 복사하는 시작 파일
templates.feature/               /sonic-harness-be:feature 뼈대 (sample-item을 새 이름으로 바꿔요)
templates.common-codes/          init에서 공통 코드를 Y로 고르면 더하는 파일
tests/lint-samples/              ESLint 규칙 테스트 (npm run test:lint)
evals/                           Claude 행동 평가 (hook·init 확인, 기준 작업 5개)
```

## 평가

Claude가 하네스를 실제로 따르는지 기준 작업으로 확인해요. 평가는 개인 전역 설정 없이 이 저장소의 플러그인만 얹어서 실행하고, Docker가 필요해요. 원본은 이 저장소의 **커밋된** 상태예요.

| 스크립트                     | 확인하는 것                                                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `evals/setup-sandbox.sh`     | 평가용 Nest 프로젝트(`sandbox/nest`, 공통 코드 켬)를 플러그인 스크립트로 새로 만들어요                                 |
| `evals/hook-check.sh`        | 규칙을 어긴 파일을 hook이 막고, 최종 파일이 lint·typecheck를 통과하는지 확인해요                                       |
| `evals/init-check.sh [y\|n]` | 새 `nest new` 프로젝트에서 `/sonic-harness-be:init`(공통 코드 Y·N)만으로 lint·test·build·CI 검사가 통과하는지 확인해요 |
| `evals/run.sh [작업]`        | 기준 작업 5개를 [`evals/checklist.md`](./evals/checklist.md)로 채점하고 결과 코드를 `evals/results/*.patch`로 남겨요   |

규칙을 바꿀 때는 `tests/lint-samples`에 위반·준수 샘플을 넣고(`npm run test:lint`), `rules/CHANGELOG.md`에 한 줄을 쓰고, `evals/run.sh`로 이전 결과와 비교해요. 명령어나 hook을 바꿨다면 `plugin/.claude-plugin/plugin.json`의 `version`을 올려요.
