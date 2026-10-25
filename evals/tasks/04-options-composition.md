상품 등록 화면에 필요한 선택 목록을 한 번에 주는 API를 만들어 주세요.

- 브랜드(brand) feature를 만들어요: 이름(필수), 사용 여부. 관리자만 등록할 수 있어요.
- 공통 코드 그룹 `PRODUCT_TYPE`(코드 `BOOK`, `FOOD`)을 만들어요.
- `GET /v1/product-form/options`: `{ productTypes: [{ value, label }], brands: [{ value, label }] }`를 돌려줘요. 사용 중인 것만, 정해진 순서대로예요. 브랜드의 value는 브랜드 id예요.
- 각 선택 목록의 개별 조회 API도 있어야 해요.
- `.env`의 `DATABASE_URL`은 평가용 Postgres를 가리켜요. migration을 만들 때 써요.
- 끝나면 `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`를 실행해서 통과시키고, `npm run openapi`로 `openapi.json`을 다시 만들어 주세요.
