import { Module } from '@nestjs/common';
import { LeelaService } from './leela.service';

@Module({
  providers: [LeelaService],
  exports: [LeelaService],
})
export class LeelaModule {}
