
export type HostEntry = {
    urlHostName: string;
    playback: {
        pageNavigation: {
            stealthSlowDownMillis: number;
            videLoading: {
                clickSelector: string;
                awaitSelectorTimeoutMillis: number;
                postClickTimoutMillis: number;
                videoSourceHostName: string;
            }
        }
        associatedEpisodeDetection: {
            xpathSelectors: {
                    root: string;
                    url: string;
                    name: string;
                    // TODO image src
                }
            }
        }
}
export type Hostname = string;
export type HostDB = Map<Hostname, HostEntry>;