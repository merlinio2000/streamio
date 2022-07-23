import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { grpcClientOptions } from '../grpc-client.options.js';
import { PuppeteerMasterService } from './util/puppeteer-master.service.js';
import { StreamioController } from './streamio.controller.js';
import { VideoPlayerService } from './util/video-player.service.js';
import { HostDBModule } from '../host-db/host-db.module.js';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'STREAMIO_PACKAGE',
        ...grpcClientOptions,
      },
    ]),
    HostDBModule,
  ],
  controllers: [StreamioController],
  providers: [{ provide: 'PuppeteerMasterService', useClass: PuppeteerMasterService }, 
        { provide: 'VideoPlayerService', useClass: VideoPlayerService }
      ]
})
export class StreamioModule {}