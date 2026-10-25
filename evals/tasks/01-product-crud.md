상품(product) 관리 API를 만들어 주세요.

- 필드: 이름(필수, 100자 이하), 가격(0 이상 정수), 재고(0 이상 정수).
- 목록(페이지네이션), 단건 조회, 등록, 수정(보낸 필드만), 삭제가 있어요.
- 조회는 로그인한 사용자 누구나, 등록·수정·삭제는 관리자만 할 수 있어요.
- 없는 상품은 404, 잘못된 입력은 400이에요.
- `.env`의 `DATABASE_URL`은 평가용 Postgres를 가리켜요. migration을 만들 때 써요.
- 끝나면 `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`를 실행해서 통과시키고, `npm run openapi`로 `openapi.json`을 다시 만들어 주세요.
