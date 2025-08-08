import { Module } from '@nestjs/common';
import { PachiService } from './pachi.service';

@Module({
  providers: [PachiService],
  exports: [PachiService],
})
export class PachiModule {}
