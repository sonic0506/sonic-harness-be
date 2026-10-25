export class PageMetaDto {
  page!: number;
  size!: number;
  total!: number;
}

export class PageDto<T> {
  items!: T[];
  meta!: PageMetaDto;
}
