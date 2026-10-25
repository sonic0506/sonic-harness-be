export class SampleItemResponseDto {
  name: string;

  static of(name: string): SampleItemResponseDto {
    const dto = new SampleItemResponseDto();
    dto.name = name;
    return dto;
  }
}
