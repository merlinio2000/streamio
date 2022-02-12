import { writeFileSync } from 'fs';
import { got }from 'got';
import { parse } from 'parse5';
import { FrontendEpisode } from '../interfaces/frontend-episode.interface.js';
import xmlserializer from 'xmlserializer';
import { DOMParser as dom } from 'xmldom';
import * as xpath from 'xpath';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WebUtil {

    private static readonly logger = new Logger(WebUtil.name)

    private static currentURL: URL;


    private static validateAndSetURL(urlstring: string): boolean {
        try {
            WebUtil.currentURL = new URL(urlstring);
            return true;
        } catch(err) {
            if (err instanceof TypeError) {
                return false;
            } else {
                this.logger.error('WebUtil.validateAndSetURL unexpected error caught');
                this.logger.error(err);
                return false;
            }
        }
    }

    /**
     * Performs an http get call to {@link urlOfOneEpisode} and searches the HTML response using XPath for related episode names and links
     * @param {string} urlOfOneEpisode
     * @returns {FrontendEpisode[]} Found related episodes from the html of {@link urlOfOneEpisode}
     * @throws {TypeError} if {@link urlOfOneEpisode} is in invalid format
     */
    static async getAvailableEpisodes(urlOfOneEpisode: string): Promise<FrontendEpisode[]> {
        
        
        if (!WebUtil.validateAndSetURL(urlOfOneEpisode)) {
            throw new TypeError(`Invalid URL:${urlOfOneEpisode}`);
        }


        const response = await got(urlOfOneEpisode);

        const bodyString = "<html><body>\n" + response.body.split("<body>")[1];
        writeFileSync("last_response.html", bodyString);

        const result: FrontendEpisode[] = [];

        const document = parse(bodyString);
        const xhtml = xmlserializer.serializeToString(document);
        const domDoc = new dom().parseFromString(xhtml, 'text/xml');
        const query: xpath.XPathSelect = xpath.useNamespaces({ "x": "http://www.w3.org/1999/xhtml" });

        const episodeNodes: xpath.SelectedValue[] = query("//x:ul[@class='listing items lists']/x:li", domDoc);


        episodeNodes.forEach((episode) => {
            if (typeof episode === "object") {

                const currResponse: FrontendEpisode = { url: "undefined", name: "undefined" };

                //get the link to the page with the episode
                let resultNode = query("./x:a/@href", episode, true);
                if (typeof resultNode === "object") {
                    currResponse.url = resultNode.nodeValue ?? "undefined";
                    if (currResponse.url !== "undefinded") {
                        // the url is probably relative
                        if (!currResponse.url.startsWith("http")) {
                            switch (currResponse.url.charAt(0)) {
                                case "/": //relative to site root
                                    currResponse.url = WebUtil.currentURL.origin + currResponse.url;
                                    break;
                                case ".": //relative to folder
                                    this.logger.error('only site root relative urls currently supported');
                                    break;
                                default:
                                    this.logger.error('only site root relative urls currently supported');
                                    break;
                            }
                        }
                        //URLEncode as it will be passed as a http parameter
                        currResponse.url = encodeURIComponent(currResponse.url);
                    }
                } else {
                    this.logger.log(typeof (resultNode));
                    currResponse.url = `Unable to interpret resultNode<${resultNode}>`;
                    this.logger.log(currResponse.url);
                }

                //get the episode name
                resultNode = query("./x:a/x:div[@class='name']/text()", episode, true);
                if (typeof resultNode === "object") {
                    currResponse.name = resultNode.nodeValue?.trim() ?? "undefined";
                } else {
                    this.logger.log(typeof (resultNode));
                    currResponse.name = `Unable to interpret resultNode<${resultNode}>`;
                    this.logger.log(currResponse.name);
                }


                //@TODO: get image source


                result.push(currResponse);

            }
        });
        result.forEach((episode) => this.logger.log(JSON.stringify(episode)));

        return result;
    }
}