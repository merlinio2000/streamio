import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChildProcessWithoutNullStreams, execSync, spawn } from 'child_process';
import { Response } from './../interfaces/response.interface.js';

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


    controlPlayer(action: string): string {
        
        if (this.vidPlayerProc === null || this.vidPlayerProc.exitCode !== null) {
            this.logger.warn(`tried to perform ${action} but no player process is running`);
            return "No video is currently running";
        }
        
        const ipcCmd = this.configService.get<string>(`video-player.ipc.${action}`);
        const ipcPath = this.configService.get<string>("video-player.ipc.socket-path");

        if (ipcCmd === undefined) {
            return `Command ${action} not implemented`;
        }
        if (ipcPath === undefined) {
            return "video-player.ipc.socket-path not declared";
        }

        let ipcStdout: string;
        try {
            //@TODO: ipcCmd and ipcPath should be sanitized even though they are managed through the config
            ipcStdout = execSync(`echo '${ipcCmd}' | socat - ${ipcPath}`).toString();
            this.logger.debug(`stdout of ipc call<${ipcStdout}>`);
        } catch(err) {
            ipcStdout = `Error performing action> ${err}`;
            this.logger.error(ipcStdout);
        }

        return ipcStdout;
    }


    async playEpisode(directLink: URL): Promise<Response> {

        const vidPlayerExe = this.configService.get<string>("video-player.exe");
        const vidPlayerPreURLFlags = this.configService.get<string>("video-player.pre-url-flags");
        const vidPlayerIPCFlag = this.configService.get<string>("video-player.ipc.socket-flag") 
                                    + this.configService.get<string>("video-player.ipc.socket-path")

        this.logger.log(`Starting video player with os command<${vidPlayerExe} ${directLink.toString()} ${vidPlayerIPCFlag}>`);

        if (this.vidPlayerProc?.exitCode === null) { //video player is still running
            if (!this.vidPlayerProc.kill()) {
                this.logger.error("Unable to kill video player process still running");
            }
        }

        this.vidPlayerProc = spawn(vidPlayerExe, [vidPlayerPreURLFlags, directLink.toString(), vidPlayerIPCFlag]);

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
