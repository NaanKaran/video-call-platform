import { IsString, IsNotEmpty, IsDateString, IsOptional, IsNumber, Min, Max, MinLength, MaxLength, IsArray, IsEmail } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  public name: string;

  @IsDateString()
  public scheduled_time: string;

  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(240)
  public duration?: number;

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  public participant_emails?: string[];
}

export class JoinSessionDto {
  @IsString()
  @IsNotEmpty()
  public session_code: string;
}

export class UpdateSessionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  public name?: string;

  @IsOptional()
  @IsDateString()
  public scheduled_time?: string;

  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(240)
  public duration?: number;
}