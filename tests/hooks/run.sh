#!/usr/bin/env bash
# hook 점검: 임시 모노레포(apps/server만 하네스 적용, node_modules는 루트로 끌어올림)에 hook을 직접 돌려요.
#   bash tests/hooks/run.sh
set -uo pipefail
here=$(cd "$(dirname "$0")/../.." && pwd)
hook="$here/plugin/hooks/format-lint.sh"
tmp=$(cd "$(mktemp -d)" && pwd -P)
trap 'rm -rf "$tmp"' EXIT
fail=0
check() { [ "$2" = "$3" ] && echo "ok   $1" || { echo "FAIL $1 (기대 $3, 실제 $2)"; fail=1; }; }

app="$tmp/apps/server"
mkdir -p "$app/.sonic-harness-be" "$app/src" "$app/test" "$app/node_modules/.bin" "$tmp/apps/other/src"
echo '{}' >"$app/.sonic-harness-be/lock.json"
ln -s "$here/node_modules" "$tmp/node_modules"

pre() { jq -n --arg f "$2" '{hook_event_name:"PreToolUse",tool_input:{file_path:$f}}' | CLAUDE_PROJECT_DIR="$1" "$hook" 2>/dev/null; echo $?; }
check '모노레포: 앱 src의 PascalCase 파일을 막음' "$(pre "$tmp" "$app/src/BadName.ts")" 2
check '모노레포: 앱 src의 kebab-case 파일은 통과' "$(pre "$tmp" "$app/src/good-name.ts")" 0
check '모노레포: lock 없는 앱은 건너뜀' "$(pre "$tmp" "$tmp/apps/other/src/BadName.ts")" 0
check '단일 프로젝트: 지금처럼 막음' "$(pre "$app" "$app/src/BadName.ts")" 2
check '..이 들어간 경로는 건너뜀' "$(pre "$tmp" "$app/../server/src/BadName.ts")" 0

echo '{"a":1}' >"$app/a.json"
jq -n --arg f "$app/a.json" '{hook_event_name:"PostToolUse",tool_input:{file_path:$f}}' | CLAUDE_PROJECT_DIR="$tmp" "$hook"
check '모노레포: 루트로 끌어올린 prettier로 format' "$(cat "$app/a.json")" '{ "a": 1 }'

# verify: 앱 node_modules의 가짜 tsc(실패)·vitest가 앱 폴더에서 앱 기준 경로로 불리는지 봐요.
printf '#!/bin/sh\necho "$(pwd -P) tsc $*" >>"%s/calls"\nexit 1\n' "$tmp" >"$app/node_modules/.bin/tsc"
printf '#!/bin/sh\necho "$(pwd -P) vitest $*" >>"%s/calls"\n' "$tmp" >"$app/node_modules/.bin/vitest"
chmod +x "$app/node_modules/.bin/"*
git -C "$tmp" init -q
printf 'node_modules\n' >"$tmp/.gitignore"
touch "$app/src/a.ts" "$app/test/a.spec.ts" "$tmp/apps/other/src/b.ts"
err=$(echo '{}' | CLAUDE_PROJECT_DIR="$tmp" node "$here/plugin/hooks/verify.mjs" 2>&1)
check 'verify: typecheck 실패면 exit 2' "$?" 2
check 'verify: 실패 메시지에 앱 경로' "$(grep -c 'typecheck 실패 (apps/server)' <<<"$err")" 1
check 'verify: 앱 폴더에서 tsc·vitest 실행' "$(cat "$tmp/calls")" "$app tsc --noEmit
$app vitest related --run --passWithNoTests src/a.ts"

exit $fail
