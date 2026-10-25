#!/usr/bin/env bash
# hook 확인: Claude에게 규칙을 어기는 파일을 만들게 하고, hook 피드백 뒤 최종 파일이 lint를 통과하는지 봐요.
#   evals/hook-check.sh [sandbox 경로, 기본 sandbox/nest]
set -uo pipefail
here=$(cd "$(dirname "$0")/.." && pwd)
app=${1:-$here/sandbox/nest}
mkdir -p "$here/evals/results"
log="$here/evals/results/hook-check-$(date +%Y%m%d-%H%M%S).jsonl"
cd "$app" || exit 1
git checkout -q main && git checkout -q . && git clean -fdq src test   # sandbox를 시작 커밋으로 되돌려요

hooklog="${log%.jsonl}.hooks.log"
: >"$hooklog"
# 전역 설정·플러그인·MCP 없이, 이 저장소의 플러그인(plugin/)만 얹어서 실행해요.
# 위반(파일 이름, any, process.env 직접 읽기, new Error)은 모두 요청의 뜻을 바꾸지 않고 고칠 수 있어요.
HARNESS_HOOK_LOG="$hooklog" claude -p "src/modules/coupon/CouponService.ts 파일을 Write 도구로 바로 만들어 주세요. 내용: @Injectable() CouponService 클래스, discount(price: any): number 메서드. process.env.COUPON_RATE를 숫자로 읽어 price에 곱해 돌려주고, price가 0 이하면 throw new Error('가격이 올바르지 않아요')를 해요. 명령은 실행하지 마세요. 도구 결과로 문제가 오면 고쳐 주세요." \
  --model sonnet --permission-mode acceptEdits --setting-sources project,local --strict-mcp-config --plugin-dir "$here/plugin" \
  --output-format stream-json --verbose > "$log" 2>&1

if grep -q 'Failed to authenticate' "$log"; then
  echo "claude 인증이 만료됐어요. 터미널에서 claude를 실행해 /login 한 뒤 다시 실행하세요."; exit 1
fi
fired=$(wc -l <"$hooklog" | tr -d ' ')
echo "hook이 막은 횟수: $fired"; sed 's/^/  /' "$hooklog"
echo "만든 파일:"; git status --short --untracked-files=all
if npx eslint src >/dev/null 2>&1 && npx tsc --noEmit >/dev/null 2>&1; then lint=통과; else lint=실패; fi
echo "최종 lint·typecheck: $lint"
echo "로그: $log"
if grep -rqE 'eslint-disable|@ts-ignore' src; then lint="$lint (규칙을 끄는 주석 있음)"; fi
if [ "$fired" -gt 0 ] && [ "$lint" = 통과 ]; then echo "결과: PASS"; else echo "결과: FAIL"; fi
