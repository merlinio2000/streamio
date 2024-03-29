import { ConsoleLogger, Controller, Get, Inject, Logger, OnModuleInit, Param, Query, Render } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClientGrpc,
  GrpcMethod
} from '@nestjs/microservices';
import { AvailableEpisodesResponse } from './interfaces/available-episodes-response.interface';
import { EpisodeRequest } from './interfaces/episode-request.interface';
import { Response } from './interfaces/response.interface';
import { PuppeteerMasterService } from './util/puppeteer-master.service.js';
import { VideoPlayerService } from './util/video-player.service.js';
import { WebUtil } from './util/web.util.js';

interface StreamioService {
  playEpisode(toPlay: EpisodeRequest): Promise<Response>;
  getAvailableEpisodes(oneEpisodeSameSeason: EpisodeRequest): Promise<AvailableEpisodesResponse>
}

@Controller('streamio')
export class StreamioController implements OnModuleInit {

  private streamioService: StreamioService;
  private readonly logger = new Logger(StreamioController.name);


  constructor(@Inject('STREAMIO_PACKAGE') private readonly client: ClientGrpc,
                                          private readonly configService: ConfigService,
                                          @Inject('PuppeteerMasterService')
                                          private readonly puppeteerService: PuppeteerMasterService, 
                                          @Inject('VideoPlayerService')
                                          private readonly vidPlayerService: VideoPlayerService) { }

  onModuleInit() {
    this.streamioService = this.client.getService<StreamioService>('StreamioService');
  }

  @Get()
  async getMany(): Promise<string> {
    return "Hello Streamio";
  }

  @Get("/index")
  @Render("index.hbs")
  async index(): Promise<void> {
    this.logger.debug('opening index');
  }


  @Get("/control")
  async controlVideoPlayer(@Query("action") action: string): Promise<string> {
    this.logger.debug("controling video player with action " + action);
    return this.vidPlayerService.controlPlayer(action);
  }


  @Get('/play/:vidUrl')
  async playByURL(@Param('vidUrl') vidUrl$: string): Promise<Response> {
    this.logger.debug('play=>' + vidUrl$);
    return this.streamioService.playEpisode({ vidUrl: vidUrl$ });
  }

  @Get('/raw/episodes')
  async getAvailableEpisodesRaw(@Query('vidURL') someEpisodeURL: string) {
    this.logger.debug('raw episodes of' + someEpisodeURL);
    return (await this.getAvailableEpisodes({ vidUrl: someEpisodeURL }));
  }

  @Get("/episodes")
  @Render("episodes.hbs")
  async viewAvailableEpisodes(@Query('vidURL') someEpisodeURL: string) {
    this.logger.debug('episodes of' + someEpisodeURL);
    return (await this.getAvailableEpisodes({ vidUrl: someEpisodeURL }));
  }

  @GrpcMethod('StreamioService', 'PlayEpisode')
  async playEpisode(toPlay: EpisodeRequest): Promise<Response> {

    this.logger.debug(`playEpisode ${toPlay.vidUrl}`);

    const directLink = await this.puppeteerService.getVidDirectLink(toPlay.vidUrl);

    this.logger.debug(`Got direct link<${directLink}`);

    return await this.vidPlayerService.playEpisode(new URL(directLink));
  }


  @GrpcMethod("StreamioService", "GetAvailableEpisodes")
  async getAvailableEpisodes(oneEpisodeSameSeason: EpisodeRequest): Promise<AvailableEpisodesResponse> {
    return { episodes: await WebUtil.getAvailableEpisodes(oneEpisodeSameSeason.vidUrl) };
  }

}
