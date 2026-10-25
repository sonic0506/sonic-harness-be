로그인한 사용자가 프로필 이미지를 올리는 API를 만들어 주세요.

- `POST /v1/profile-images` (multipart, 필드 이름 `file`).
- PNG 또는 JPEG만, 2MB 이하만 받아요. 아니면 400이에요.
- 파일은 저장하지 않고, 받은 파일의 이름·크기·형식을 DB에 기록한 뒤 그 정보를 돌려줘요(올린 사용자도 기록해요).
- `GET /v1/profile-images`: 본인이 올린 기록만 페이지 단위로 보여 줘요.
- `.env`의 `DATABASE_URL`은 평가용 Postgres를 가리켜요. migration을 만들 때 써요.
- 끝나면 `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`를 실행해서 통과시키고, `npm run openapi`로 `openapi.json`을 다시 만들어 주세요.
