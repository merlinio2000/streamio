import { ConsoleLogger, Controller, Get, Inject, Logger, OnModuleInit, Param, Render } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClientGrpc,
  GrpcMethod
} from '@nestjs/microservices';
import { spawn } from 'child_process';
import { Observable, of } from 'rxjs';
import { AvailableEpisodesResponse } from './interfaces/available-episodes-response.interface.js';
import { EpisodeRequest } from './interfaces/episode-request.interface.js';
import { FrontendEpisode } from './interfaces/frontend-episode.interface.js';
import { Response } from './interfaces/response.interface.js';
import { StreamioPuppeteerService } from './puppeteer.master.js';
import { WebUtil } from './web.util.js';

interface StreamioService {
  playEpisode(toPlay: EpisodeRequest): Promise<Response>;
  getAvailableEpisodes(oneEpisodeSameSeason: EpisodeRequest): Promise<AvailableEpisodesResponse>
}

@Controller('streamio')
export class StreamioController implements OnModuleInit {

  private streamioService: StreamioService;
  private readonly logger = new Logger(StreamioController.name);


  constructor(@Inject('STREAMIO_PACKAGE') private readonly client: ClientGrpc, private readonly configService: ConfigService) { }

  onModuleInit() {
    this.streamioService = this.client.getService<StreamioService>('StreamioService');
  }

  @Get()
  getMany(): Observable<string> {
    return of('Hello Streamio');
  }

  @Get("/index")
  @Render("index.hbs")
  async index(@Param('vidUrl') vidUrl$: string): Promise<Response> {
    this.logger.log('vidUrl=>' + vidUrl$);
    return (await this.streamioService.playEpisode({ vidUrl: vidUrl$ }));
  }

  @Get('/play/:vidUrl')
  async playByURL(@Param('vidUrl') vidUrl$: string): Promise<Response> {
    this.logger.log('vidUrl=>' + vidUrl$);
    return (await this.streamioService.playEpisode({ vidUrl: vidUrl$ }));
  }

  @Get("/episodes/:someEpisodeURL")
  @Render("episodes.hbs")
  async viewAvailableEpisodes(@Param("someEpisodeURL") someEpisodeURL: string) {
    return (await this.getAvailableEpisodes({vidUrl: someEpisodeURL}));
  }

  @GrpcMethod('StreamioService', 'PlayEpisode')
  async playEpisode(toPlay: EpisodeRequest): Promise<Response> {

    const directLink = await StreamioPuppeteerService.getVidDirectLink(toPlay.vidUrl);

    const vidPlayerExe = this.configService.get<string>("video-player.exe");

    this.logger.log(`Starting video player with os command<${vidPlayerExe} ${directLink}>`);

    const mpvProc = spawn(vidPlayerExe, [directLink]);
    

    let startUpSnapshot = {
      millis: 5000,
      stdout: "",
      stderr: "",
      error: "",
      retCode: undefined,
    };

    mpvProc.stdout.on("data", data => {
      this.logger.log(`stdout: ${data}`);
      startUpSnapshot.stdout += data + "\n";
    });

    mpvProc.stderr.on("data", data => {
      this.logger.log(`stderr: ${data}`);
      startUpSnapshot.stderr += data + "\n";
    });

    mpvProc.on("error", (error) => {
      this.logger.log(`error: ${error.message}`);
      startUpSnapshot.stdout += error.message + "\n";
    });

    mpvProc.on("close", code => {
      this.logger.log(`child process exited with code ${code}`);
      startUpSnapshot.retCode = code;
    });

    await new Promise(resolve => setTimeout(resolve, startUpSnapshot.millis));


    return { code: 0, msg: `Trying to Play<${directLink}>\n` + JSON.stringify(startUpSnapshot)};
  }


  @GrpcMethod("StreamioService", "GetAvailableEpisodes")
  async getAvailableEpisodes(oneEpisodeSameSeason: EpisodeRequest): Promise<AvailableEpisodesResponse> {
    return {episodes: await WebUtil.getAvailableEpisodes(oneEpisodeSameSeason.vidUrl)};
  }

}
