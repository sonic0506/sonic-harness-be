// 공통 코드 그룹 ID 목록이에요. @IsCommonCode('그룹')의 오타를 컴파일할 때 잡아요.
// 새 그룹은 여기에 더하고, migration으로 common_code_groups에 행을 넣어요(harness.md 12절).
// EXAMPLE_TYPE은 예시예요. 첫 실제 그룹을 추가하면 지워요.
export const COMMON_CODE_GROUPS = ['EXAMPLE_TYPE'] as const;
export type CommonCodeGroup = (typeof COMMON_CODE_GROUPS)[number];

export const isCommonCodeGroup = (value: string): value is CommonCodeGroup =>
  COMMON_CODE_GROUPS.some((group) => group === value);

// 그룹 하나의 코드는 이 개수 안이에요. 넘으면 공통 코드가 아니라 feature로 둘 데이터예요.
export const MAX_CODES_PER_GROUP = 500;
// 공통 코드는 자주 바뀌지 않아서 캐시해요. 관리 API로 바꾸면 그 그룹 캐시를 바로 지워요.
// ponytail: 메모리 캐시라 인스턴스가 여러 개면 다른 인스턴스는 TTL이 지나야 바뀌어요. 그때는 Redis store로 바꿔요.
export const COMMON_CODE_CACHE_TTL_MS = 60_000;
