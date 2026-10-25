상품(product)에 상품 유형을 붙여 주세요. 상품 유형은 관리자가 관리하는 공통 코드예요.

- 공통 코드 그룹 `PRODUCT_TYPE`을 새로 만들고, 기본 코드 `BOOK`(도서), `FOOD`(식품)를 넣어 주세요.
- 상품: 이름(필수), 상품 유형 코드(필수). 등록과 수정 API가 있어요(관리자만).
- 등록할 때 없는 코드나 사용 중지된 코드는 400이에요.
- 수정할 때 상품 유형을 보내지 않으면 기존 값을 그대로 둬요. 이미 사용 중지된 유형이 붙은 상품을 같은 유형으로 다시 보내는 것은 받아 주지만, 사용 중지된 다른 유형으로 바꿀 수는 없어요.
- `.env`의 `DATABASE_URL`은 평가용 Postgres를 가리켜요. migration을 만들 때 써요.
- 끝나면 `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`를 실행해서 통과시키고, `npm run openapi`로 `openapi.json`을 다시 만들어 주세요.
