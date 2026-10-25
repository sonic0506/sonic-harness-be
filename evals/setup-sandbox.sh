#!/usr/bin/env bash
# 평가용 sandbox(sandbox/nest)를 플러그인 스크립트로 새로 만들어요(공통 코드 켬).
# 원본은 이 저장소의 **커밋된** 상태예요. 규칙을 고쳤다면 커밋한 뒤 실행하세요.
#   evals/setup-sandbox.sh
set -euo pipefail
here=$(cd "$(dirname "$0")/.." && pwd)
app="$here/sandbox/nest"
harness() { node "$here/plugin/scripts/harness.mjs" "$@"; }
[ -e "$app" ] && { echo "이미 있어요: $app (옮기거나 지운 뒤 다시 실행하세요)"; exit 1; }

export SONIC_HARNESS_BE_ORIGIN="$here" SONIC_HARNESS_BE_HOME="$here/sandbox/.harness-home"
mkdir -p "$here/sandbox" && cd "$here/sandbox"
npx --yes @nestjs/cli@12 new nest --skip-git --package-manager npm --strict </dev/null >/dev/null
cd "$app" && git init -q -b main
harness init >/dev/null
harness deps >/dev/null
harness common-codes >/dev/null
cp .env.example .env
npx prettier --write . >/dev/null
npm run --silent lint && npm run --silent typecheck && npm test --silent >/dev/null
npm run --silent openapi >/dev/null
git add -A && git -c user.name=sandbox -c user.email=sandbox@local commit -qm "chore: 하네스 적용한 시작 상태"
echo "✓ sandbox를 만들었어요: $app"
