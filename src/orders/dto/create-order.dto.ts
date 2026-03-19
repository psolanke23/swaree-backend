import { Type } from 'class-transformer';
import { IsArray, IsString, IsNumber, IsOptional, IsEmail, ValidateNested, Min } from 'class-validator';

export class OrderItemDto {
  @IsString()
  menuItemId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsString()
  restaurantId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  deliveryAddress: string;

  @IsOptional()
  @IsString()
  notes?: string;

  // Guest-only fields (required when placing without a JWT token)
  @IsOptional()
  @IsString()
  guestName?: string;

  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @IsOptional()
  @IsString()
  guestPhone?: string;
}
