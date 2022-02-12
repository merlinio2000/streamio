import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { grpcClientOptions } from '../grpc-client.options.js';
import { StreamioPuppeteerService } from './util/puppeteer.master.js';
import { StreamioController } from './streamio.controller.js';
import { WebUtil } from './util/web.util.js';
import { VideoPlayerService } from './util/video.player.service.js';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'STREAMIO_PACKAGE',
        ...grpcClientOptions,
      },
    ]),
  ],
  controllers: [StreamioController],
  providers: [StreamioPuppeteerService, WebUtil, VideoPlayerService]
})
export class StreamioModule {}