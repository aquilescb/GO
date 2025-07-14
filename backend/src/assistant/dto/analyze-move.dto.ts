import {IsArray,ValidateNested,IsIn,IsInt,IsOptional,ArrayMinSize,ArrayMaxSize} from "class-validator";
import { Type } from "class-transformer";

export class MoveDto {
    @IsInt()
    x: number;

    @IsInt()
    y: number;

    @IsIn(["black", "white"])
    color: "black" | "white";
}

export class AnalyzeMoveDto {
    @IsArray()
    @ArrayMinSize(1)
    board: ("black" | "white" | null)[][];

    @ValidateNested()
    @Type(() => MoveDto)
    lastMove: MoveDto;

    @IsArray()
    history: MoveDto[];
}
