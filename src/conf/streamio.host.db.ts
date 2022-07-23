
import { read, readdirSync, readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import path, { join } from 'path';


const hostDBDir = join(path.resolve(path.dirname('')), 'host-db');

export function loadDB(): Map<string, Record<string, any>> {


  const result = new Map<string, Record<string, any>>();

  let currentDB: Record<string,any>;
  for (const file of readdirSync(hostDBDir)) {
    // console.log('MERBUG host-db-file: ' + file);
    currentDB = yaml.load(readFileSync(join(hostDBDir, file), 'utf-8')) as Record<string, any>;
    // console.log('MERBUG current-DB ' + JSON.stringify(currentDB));
    const hostname = currentDB?.host?.urlHostname;
    if (!hostname) {
      console.log(`ERROR invalid host DB ${file} no host.url-hostname provided`);
    } else {
      result.set(hostname, currentDB);
    }
  }
  // console.log('HostDB-Load returning:' + JSON.stringify([...result.entries()], null, 4));
  return result;
};
