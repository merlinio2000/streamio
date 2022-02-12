import { Module } from '@nestjs/common';
import { StreamioModule } from './streamio/streamio.module.js';
import { ConfigModule } from '@nestjs/config';
import streamioConfig from './conf/streamio.config.js';

@Module({
  imports: [StreamioModule, 
    ConfigModule.forRoot({
      isGlobal: true,
      load: [streamioConfig]})],
})
export class AppModule {}
