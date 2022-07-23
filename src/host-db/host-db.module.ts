import { Module } from "@nestjs/common";
import { loadDB } from "../conf/streamio.host.db.js";
import { HostDBService } from "./host-db.service.js";
import { HostDB } from "./type";

@Module({
    exports: [
        {
            provide: 'HostDBService',
            useClass: HostDBService
        }
    ],
    providers: [
        {
            provide: 'HostDBService',
            useClass: HostDBService
        }
    ],
})
export class HostDBModule {}