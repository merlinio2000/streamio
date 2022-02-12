import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { grpcClientOptions } from '../grpc-client.options.js';
import { StreamioPuppeteerService } from './puppeteer.master.js';
import { StreamioController } from './streamio.controller.js';
import { WebUtil } from './web.util.js';

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
  providers: [StreamioPuppeteerService, WebUtil]
})
export class StreamioModule {}