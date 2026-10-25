#!/usr/bin/env bash
# /sonic-harness-be:init 명령 확인: 새 nest new 프로젝트에서 Claude가 init을 끝까지 하고,
# lint·typecheck·test·build와 CI 검사가 통과하는지 봐요. 원본은 이 저장소에서 지금 체크아웃한 브랜치의 커밋된 상태예요
# (실행마다 새로 clone해요. 예전 clone을 다시 쓰면 그때의 기본 브랜치를 평가해요).
#   evals/init-check.sh [y|n]   (기본 n. y는 공통 코드 질문에 Y로 답해요)
set -uo pipefail
codes=${1:-n}
here=$(cd "$(dirname "$0")/.." && pwd)
app="$here/sandbox/init-$codes-$(date +%H%M%S)"
log="$here/evals/results/init-check-$codes-$(date +%Y%m%d-%H%M%S).jsonl"
mkdir -p "$here/evals/results" "$here/sandbox"
export SONIC_HARNESS_BE_ORIGIN="$here" SONIC_HARNESS_BE_HOME="$app.harness-home"

cd "$here/sandbox"
npx --yes @nestjs/cli@12 new "$(basename "$app")" --skip-git --package-manager npm --strict </dev/null >/dev/null 2>&1
cd "$app" && git init -q -b main

answer=$([ "$codes" = y ] && echo Y || echo N)
claude -p "/sonic-harness-be:init 평가 실행이라 사용자 확인 단계는 모두 승인된 것으로 보고 끝까지 진행해 주세요. 공통 코드를 쓰는지 묻는 질문에는 $answer로 답한 것으로 봐요. branch protection은 GitHub 저장소가 아니라 건너뛰어요." \
  --model sonnet --permission-mode acceptEdits --setting-sources project,local --strict-mcp-config \
  --plugin-dir "$here/plugin" --allowedTools "Bash(node:*)" "Bash(npm:*)" "Bash(npx:*)" "Bash(git:*)" "Bash(ls:*)" "Bash(cp:*)" "Bash(mkdir:*)" "Bash(rm:*)" \
  --output-format stream-json --verbose >"$log" 2>&1
if grep -q 'Failed to authenticate' "$log"; then
  echo "claude 인증이 만료됐어요. 터미널에서 claude를 실행해 /login 한 뒤 다시 실행하세요."; exit 1
fi

ok=0
check() { if eval "$2" >/dev/null 2>&1; then echo "  ✅ $1"; else echo "  ❌ $1"; ok=1; fi; }
echo "init-check (공통 코드 $answer): $app"
check "lock.json 있음" "test -f .sonic-harness-be/lock.json"
check "CLAUDE.md → AGENTS.md → harness.md" "grep -q '@AGENTS.md' CLAUDE.md && grep -q '@.sonic-harness-be/harness.md' AGENTS.md"
check "eslint.config.mjs가 base를 불러옴" "grep -q '.sonic-harness-be/eslint.base.mjs' eslint.config.mjs"
check "nest new 예시 파일·oxlint 없음" "! test -e src/app.service.ts && ! test -e .oxlintrc.json && ! grep -q oxlint package.json"
check "main.ts가 configureApp을 거침" "grep -q configureApp src/main.ts"
check "tsconfig가 strict 묶음과 paths를 씀" "grep -q 'tsconfig.strict.json' tsconfig.json && grep -q '\"@/\\*\"' tsconfig.json"
check "nest-cli에 Swagger 플러그인" "grep -q '@nestjs/swagger' nest-cli.json"
check "openapi.json 있음" "test -f openapi.json"
if [ "$codes" = y ]; then
  check "lock에 commonCodes: true" "grep -q '\"commonCodes\": true' .sonic-harness-be/lock.json"
  check "CommonCodesModule 등록" "grep -q 'CommonCodesModule,' src/app.module.ts"
  check "seed 테이블에 common_code_groups" "grep -q common_code_groups test/setup/seed-tables.ts"
else
  check "lock에 commonCodes: false" "grep -q '\"commonCodes\": false' .sonic-harness-be/lock.json"
  check "공통 코드 feature 없음" "! test -e src/modules/common-codes"
fi
check "npm run lint" "npm run lint"
check "npm run typecheck" "npm run typecheck"
check "npm test" "npm test"
check "npm run lint:cycles" "npm run lint:cycles"
check "harness-checks env e2e" "node scripts/harness-checks.mjs env e2e"
check "openapi.json이 코드와 같음" "npm run openapi:check"
check "prettier --check (CI lint job)" "npx prettier --check ."
check "nest build" "npx nest build"
echo "로그: $log"
[ $ok = 0 ] && echo "결과: PASS" || echo "결과: FAIL"
