import { Inject, Injectable, Logger } from '@nestjs/common';
import puppeteer_ext from 'puppeteer-extra';
import puppeteer from 'puppeteer';
// THIS MAN IS A GOD, TODO donate :)
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { HostDBService } from '../../host-db/host-db.service.js';


@Injectable()
export class PuppeteerMasterService {


  public constructor(
    @Inject('HostDBService')  
    private readonly hostDBService: HostDBService){}

  private readonly logger = new Logger(PuppeteerMasterService.name);
  // TODO add to config
  private readonly addBlockExtensionPath = '/home/manjinio/Documents/streamio/backend/puppeteer_extensions/uBlock0.chromium';

  async getDefaultBrowser(): Promise<puppeteer.Browser> {
    return puppeteer_ext.use(StealthPlugin()).launch({ executablePath: '/usr/lib/chromium/chromium', headless: false,
                      args: [`--disable-extensions-except=${this.addBlockExtensionPath}`, `--load-extension=${this.addBlockExtensionPath}`] , 
                      // FUCK these guys, TODO move to DB
                      slowMo: 150
                    });
  }

  async getVidDirectLink(url: string): Promise<string> {

    let results: string[] = [];


    this.logger.debug(`Getting direct link for<${url}>`);

    // Wait for browser launching.
    const browser = await this.getDefaultBrowser();
    // Wait for creating the new page.
    const page = await browser.newPage();

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.80 Safari/537.36 WAIT_UNTIL=load");
    await page.setViewport({ width: 1200, height: 800 });


    await page.setRequestInterception(true);

    page.on('request', (request) => {
      // TODO check how to implement this
      //if (request.resourceType() === "image") {
      //  request.abort();
      //} else {
        request.continue();
      //}
    });

    page.on('response', async (response) => {
      if (response.headers()['content-type']?.toLowerCase().includes('video')) {
        this.logger.debug('Received candidate response:');
        this.logger.debug(`FROM:<${response.url()}> HEADERS:\n${JSON.stringify(response.headers(), null, 2)}`);
      }
      if (response.url().includes("vidfiles.net")) {
        results.push(response.url());
        this.logger.log(`<< ${response.status()}, ${response.url()}`);
      }
    });

    await page.goto(url);

    const bigURL = new URL(url);

    console.log('hostname:' + bigURL.hostname)
    console.log('host:'+ bigURL.host)
    console.log('origin:' + bigURL.origin)

    const conf = this.hostDBService.getEntryForHostname(new URL(url).hostname);

    console.log('CONF: ' + JSON.stringify(conf, null, 4));

    const vidSelector = "div.play-video";

    await page.waitForSelector(vidSelector); // <-- wait until it exists
    this.logger.log('got div');

    await page.click(vidSelector);

    await page.waitForTimeout(500);
    await page.click(vidSelector);

    //await page.screenshot({path: 'screenshot.png'});

    await page.waitForTimeout(1000);


    await browser.close();

    return results[0];

  }
}
