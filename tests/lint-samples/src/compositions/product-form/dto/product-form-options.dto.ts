export class OptionDto {
  value!: string;
  label!: string;
}

export class ProductFormOptionsDto {
  productTypes!: OptionDto[];
}
