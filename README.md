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

## 저장소 구조

```text
.claude-plugin/marketplace.json  플러그인 목록 (source: ./plugin)
plugin/                          명령어, hooks, scripts/harness.mjs
rules/                           프로젝트 .sonic-harness-be/로 들어가는 파일 (harness.md, eslint, tsconfig …)
templates/                       init 때 없는 파일만 복사하는 시작 파일
templates.feature/               /sonic-harness-be:feature 뼈대 (sample-item을 새 이름으로 바꿔요)
templates.common-codes/          init에서 공통 코드를 Y로 고르면 더하는 파일
tests/lint-samples/              ESLint 규칙 테스트 (npm run test:lint)
```
