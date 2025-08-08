import { Module } from '@nestjs/common';
import { GnuGoService } from './gnugo.service';

@Module({
  providers: [GnuGoService],
  exports: [GnuGoService],
})
export class GnuGoModule {}
