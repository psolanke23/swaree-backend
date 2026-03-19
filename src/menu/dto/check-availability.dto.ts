import { IsArray, IsNumber, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CheckAvailabilityItemDto {
  @IsString() menuItemId!: string;
  @IsNumber() @Min(1) quantity!: number;
}

export class CheckAvailabilityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckAvailabilityItemDto)
  items!: CheckAvailabilityItemDto[];
}
