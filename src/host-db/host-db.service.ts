import { Injectable } from "@nestjs/common";
import { loadDB } from "../conf/streamio.host.db.js";
import { HostDB, HostEntry } from "./type";


@Injectable()
export class HostDBService {
    
    private static db: HostDB;
    public constructor(){
        HostDBService.db = loadDB()as HostDB;
    }

    getEntryForHostname(hostname: string): HostEntry {
        return HostDBService.db.get(hostname);
    }
}