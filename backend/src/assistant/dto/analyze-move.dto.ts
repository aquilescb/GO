import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';

class MoveDto {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsIn(['black', 'white'])
  color: 'black' | 'white';
}

class PlayerProfileDto {
  @IsIn(['beginner', 'intermediate', 'advanced'])
  level: string;

  @IsOptional()
  @IsIn(['aggressive', 'defensive', 'balanced'])
  style?: string;

  @IsOptional()
  @IsArray()
  commonMistakes?: string[];
}

export class AnalyzeMoveDto {
  @ValidateNested()
  @Type(() => MoveDto)
  move: MoveDto;

  @IsArray()
  board: ('black' | 'white' | null)[][];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MoveDto)
  lastMoves: MoveDto[];

  @ValidateNested()
  @Type(() => PlayerProfileDto)
  playerProfile: PlayerProfileDto;
}
