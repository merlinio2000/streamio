import { ClientOptions, Transport } from '@nestjs/microservices';
import path from 'path';


export const __dirname = path.resolve(path.dirname(""));

export const grpcClientOptions: ClientOptions = {
  transport: Transport.GRPC,
  options: {
    url: '0.0.0.0:50051',
    package: 'streamio', // ['hero', 'hero2']
    protoPath: path.join(__dirname, './src/streamio/streamio.proto'), // ['./hero/hero.proto', './hero/hero2.proto']
  },
};
