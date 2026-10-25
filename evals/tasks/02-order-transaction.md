주문(order) API를 만들어 주세요. 상품(product: 이름, 가격, 재고)도 함께 필요해요.

- `POST /v1/orders`: `{ productId, quantity }`로 주문해요. 로그인한 사용자 본인 주문으로 저장하고, 주문 금액(가격 × 수량)을 기록해요.
- 주문하면 상품 재고가 수량만큼 줄어요. 주문 저장과 재고 감소는 함께 성공하거나 함께 실패해야 해요.
- 재고가 모자라면 409와 에러 코드 `OUT_OF_STOCK`, 없는 상품이면 404예요.
- `GET /v1/orders`: 본인 주문만 페이지 단위로 보여 줘요. 다른 사람 주문은 보이지 않아요.
- 상품 등록 API는 관리자만 쓸 수 있으면 돼요(테스트 데이터용).
- `.env`의 `DATABASE_URL`은 평가용 Postgres를 가리켜요. migration을 만들 때 써요.
- 끝나면 `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`를 실행해서 통과시키고, `npm run openapi`로 `openapi.json`을 다시 만들어 주세요.
