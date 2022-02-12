import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { EpisodeRequest } from './../interfaces/episode-request.interface.js';
import { Response } from './../interfaces/response.interface.js';
import { StreamioPuppeteerService } from './puppeteer.master.js';

@Injectable()
export class VideoPlayerService {


    private readonly logger = new Logger(VideoPlayerService.name);
    private vidPlayerProc: ChildProcessWithoutNullStreams = null;
    private startUpSnapshot = {
        millis: 5000,
        stdout: "",
        stderr: "",
        error: "",
        retCode: undefined,
    };

    constructor(private readonly configService: ConfigService) { }


    async playEpisode(directLink: URL): Promise<Response> {

        const vidPlayerExe = this.configService.get<string>("video-player.exe");
        const vidPlayerPreURLFlags = this.configService.get<string>("video-player.pre-url-flags")

        this.logger.log(`Starting video player with os command<${vidPlayerExe} ${directLink.toString()}>`);

        if (this.vidPlayerProc?.exitCode === null) { //video player is still running
            if (!this.vidPlayerProc.kill()) {
                this.logger.error("Unable to kill video player process still running");
            }
        }

        this.vidPlayerProc = spawn(vidPlayerExe, [vidPlayerPreURLFlags, directLink.toString()]);

        this.vidPlayerProc.stdout.on("data", data => {
            this.logger.log(`stdout: ${data}`);
            this.startUpSnapshot.stdout += data + "\n";
        });

        this.vidPlayerProc.stderr.on("data", data => {
            this.logger.log(`stderr: ${data}`);
            this.startUpSnapshot.stderr += data + "\n";
        });

        this.vidPlayerProc.on("error", (error) => {
            this.logger.log(`error: ${error.message}`);
            this.startUpSnapshot.stdout += error.message + "\n";
        });

        this.vidPlayerProc.on("close", code => {
            this.logger.log(`child process exited with code ${code}`);
            this.startUpSnapshot.retCode = code;
        });

        await new Promise(resolve => setTimeout(resolve, this.startUpSnapshot.millis));


        return { code: 0, msg: `Trying to Play<${directLink}>\n` + JSON.stringify(this.startUpSnapshot, null, 4) };
    }

}
