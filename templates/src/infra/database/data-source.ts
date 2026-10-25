import { DataSource, type DataSourceOptions } from 'typeorm';

import { env } from '@/config/env.js';

// 앱(TypeOrmModule)과 migration CLI가 같이 쓰는 설정이에요.
// CLI는 빌드 결과(dist)를 읽어요: npm run build && npm run migration:run
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: env.DATABASE_URL,
  synchronize: false,
  entities: [`${import.meta.dirname}/../../**/*.entity.js`],
  migrations: [`${import.meta.dirname}/migrations/*.js`],
};

export default new DataSource(dataSourceOptions);
