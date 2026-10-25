#!/usr/bin/env bash
# 기준 작업 실행: 작업마다 sandbox를 시작 커밋(main)으로 되돌리고 Claude에게 작업을 시킨 뒤,
# 자동 항목을 확인해 evals/results/<날짜>-<작업>.md와 결과 코드(.patch)를 남겨요. 수동 항목은 .md에서 체크해요.
# migration 생성과 e2e에 Docker가 필요해요(평가용 Postgres를 띄워요).
#   evals/run.sh            # 전체
#   evals/run.sh 02         # 이름에 02가 들어간 작업만
#   MODEL=opus evals/run.sh # 모델 바꾸기 (기본 sonnet)
set -uo pipefail
here=$(cd "$(dirname "$0")/.." && pwd)
app=${SANDBOX:-$here/sandbox/nest}
stamp=$(date +%Y%m%d-%H%M)
db=sonic-be-eval-db port=${EVAL_DB_PORT:-55499}
mkdir -p "$here/evals/results"
cd "$app" || { echo "sandbox가 없어요: $app (evals/setup-sandbox.sh로 만들어요)"; exit 1; }

docker rm -f "$db" >/dev/null 2>&1
docker run -d --rm --name "$db" -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=app -p "$port:5432" postgres:17-alpine >/dev/null ||
  { echo "Docker로 평가용 Postgres를 띄우지 못했어요."; exit 1; }
trap 'docker rm -f "$db" >/dev/null 2>&1' EXIT
for _ in $(seq 1 30); do docker exec "$db" pg_isready -U postgres >/dev/null 2>&1 && break; sleep 1; done
export DATABASE_URL="postgres://postgres:postgres@localhost:$port/app"
fresh_db() { docker exec "$db" psql -U postgres -qc 'DROP DATABASE IF EXISTS app WITH (FORCE)' -c 'CREATE DATABASE app' >/dev/null; }

for task in "$here"/evals/tasks/*${1:-}*.md; do
  name=$(basename "$task" .md)
  out="$here/evals/results/$stamp-$name.md"
  log="$here/evals/results/$stamp-$name.jsonl"
  echo "▶ $name"
  git checkout -q . && git clean -fdq src test
  sed -e "s#^DATABASE_URL=.*#DATABASE_URL=$DATABASE_URL#" .env.example > .env
  fresh_db && npm run --silent migration:run >/dev/null 2>&1

  hooklog="${log%.jsonl}.hooks.log"
  : >"$hooklog"
  # 전역 설정·플러그인·MCP 없이, 이 저장소의 플러그인(plugin/)만 얹어서 실행해요.
  HARNESS_HOOK_LOG="$hooklog" claude -p "$(cat "$task")" --model "${MODEL:-sonnet}" --permission-mode acceptEdits \
    --setting-sources project,local --strict-mcp-config --plugin-dir "$here/plugin" \
    --allowedTools "Bash(npm run *)" "Bash(npm test*)" "Bash(npx vitest*)" "Bash(npx eslint*)" "Bash(npx tsc*)" "Bash(node scripts/*)" \
    --output-format stream-json --verbose > "$log" 2>&1
  if grep -q 'Failed to authenticate' "$log"; then
    echo "  claude 인증이 만료됐어요. 터미널에서 claude를 실행해 /login 한 뒤 다시 실행하세요."; exit 1
  fi

  check() { if eval "$2" >/dev/null 2>&1; then echo "| $1 | ✅ |"; else echo "| $1 | ❌ |"; fi; }
  {
    echo "# $name ($stamp, ${MODEL:-sonnet})"
    echo
    echo "## 자동 확인"
    echo
    echo "| 항목 | 결과 |"
    echo "|---|---|"
    check "1 lint" "npm run lint"
    check "2 typecheck" "npm run typecheck"
    check "3 test (새 service 단위 테스트 있음)" "git status --porcelain --untracked-files=all | grep -q 'service.spec.ts' && npm test"
    check "4 test:e2e" "npm run test:e2e"
    check "5 eslint-disable·ts-ignore·any 없음" "! grep -rnE 'eslint-disable|@ts-ignore|: any\\b' src test"
    check "6 harness-checks env e2e" "node scripts/harness-checks.mjs env e2e"
    check "7 lint:cycles" "npm run lint:cycles"
    check "8 openapi:check" "npm run openapi:check"
    check "9 migration:check" "fresh_db && npm run migration:check"
    check "10 build" "npm run build"
    echo
    echo "## 수동 확인 (checklist.md 11–16 + 작업별)"
    echo
    for i in "11 feature 뼈대 구조" "12 권한·403/404 e2e" "13 레이어" "14 e2e 필수 케이스" "15 불필요한 것 없음" "16 완료 보고 형식" "작업별 항목"; do
      echo "- [ ] $i"
    done
    echo
    echo "## hook이 막은 기록 ($(wc -l <"$hooklog" | tr -d ' ')회)"
    echo
    echo '```'
    cat "$hooklog"
    echo '```'
    echo
    echo "## 만든 파일"
    echo
    echo '```'
    git status --porcelain --untracked-files=all
    echo '```'
    echo
    echo "결과 코드: \`$stamp-$name.patch\` (sandbox에서 git apply) · 로그: \`$(basename "$log")\`"
  } > "$out"

  # 결과 코드는 커밋하지 않고 patch로 남겨요(sandbox는 다음 작업을 위해 시작 상태로 되돌려요).
  git add -A && git diff --cached --binary > "$here/evals/results/$stamp-$name.patch" && git reset -q
  git checkout -q . && git clean -fdq src test
  grep -E '❌|✅' "$out" | sed 's/^/  /'
done
echo "결과: $here/evals/results/$stamp-*.md"
