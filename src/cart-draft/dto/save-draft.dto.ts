import { IsArray, IsNumber, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CartDraftItemDto {
  @IsString() menuItemId!: string;
  @IsNumber() @Min(1) quantity!: number;
}

export class SaveDraftDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartDraftItemDto)
  items!: CartDraftItemDto[];
}
