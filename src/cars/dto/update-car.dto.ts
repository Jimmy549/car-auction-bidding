export class UpdateCarDto {
  title?: string;
  description?: string;
  make?: string;
  model?: string;
  year?: number;
  bodyType?: string;
  category?: string;
  photos?: string[];
  startingPrice?: number;
  currentPrice?: number;
}