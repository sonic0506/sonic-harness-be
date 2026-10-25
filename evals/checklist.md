# 기준 작업 체크리스트

`evals/run.sh`가 [자동] 항목을 채우고, [수동] 항목은 결과 파일에서 사람이 체크해요.
규칙(`rules/harness.md`)을 바꾸면 이 표도 함께 고쳐요.

## 공통

| #   | 항목                                                                                         | 확인                  |
| --- | -------------------------------------------------------------------------------------------- | --------------------- |
| 1   | `npm run lint` 통과                                                                          | [자동]                |
| 2   | `npm run typecheck` 통과                                                                     | [자동]                |
| 3   | `npm test` 통과, service 단위 테스트가 있음                                                  | [자동]                |
| 4   | `npm run test:e2e` 통과                                                                      | [자동]                |
| 5   | `eslint-disable`, `@ts-ignore`, `any` 없음                                                   | [자동]                |
| 6   | controller마다 e2e 파일, `.env.example`과 env 스키마 키가 같음                               | [자동]                |
| 7   | 순환 의존 없음(`npm run lint:cycles`)                                                        | [자동]                |
| 8   | `openapi.json`이 코드와 같음(`npm run openapi:check`)                                        | [자동]                |
| 9   | entity를 바꾸면 migration이 있음(`npm run migration:check`)                                  | [자동]                |
| 10  | build 통과                                                                                   | [자동]                |
| 11  | `/sonic-harness-be:feature` 뼈대 구조를 따름(파일 이름·위치, index.ts 공개 범위)             | [수동]                |
| 12  | 권한: 엔드포인트마다 `@Roles` 또는 본인 데이터 범위가 정해지고, 403·404 e2e가 있음           | [수동]                |
| 13  | 레이어: controller에 로직 없음, service는 HTTP 예외 대신 feature 예외, DB는 repository에서만 | [자동: lint] + [수동] |
| 14  | e2e 필수 케이스: 성공, 400(검증), 404, 403                                                   | [수동]                |
| 15  | 만들지 않아도 되는 것을 만들지 않음(쓰지 않는 레이어·추상화·파일), 요청 밖 리팩터링 없음     | [수동]                |
| 16  | 끝에 AGENTS.md "완료 보고" 형식(바뀐 것, 검증 결과, 지키지 못한 것)으로 보고함               | [수동]                |

## 작업별

| 작업                   | 항목                                                                                                                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01 product-crud        | 쓰기 3개에 `@Roles('admin')`, 일반 사용자 403 e2e. 목록은 `PageQueryDto`·`PageDto`                                                                                                                                           |
| 02 order-transaction   | order service가 product를 `@/modules/product/index.js`의 service로 씀(repository 직접 접근 없음). 주문 저장+재고 감소에 `@Transactional()`. `OUT_OF_STOCK`은 AppException 상속 예외. 목록은 `request.user.sub`로 범위를 좁힘 |
| 03 common-code-field   | `COMMON_CODE_GROUPS`에 `PRODUCT_TYPE`, migration으로 그룹·코드 seed. 생성 DTO에 `@IsCommonCode('PRODUCT_TYPE')`, 수정 DTO는 `allowInactive: true` + service에서 바뀐 값 활성 확인                                            |
| 04 options-composition | 통합 API는 `src/compositions/product-form/`(controller·service·dto만), 각 feature의 service로만 조회, `OptionDto` 사용, 독립 조회는 `Promise.all`                                                                            |
| 05 file-upload         | `@UploadedFile(new ParseFilePipe(...MaxFileSizeValidator, FileTypeValidator))`, 400 e2e(형식·크기), 본인 기록만 조회                                                                                                         |
