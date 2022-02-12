import { Injectable, Logger } from '@nestjs/common';
import puppeteer from 'puppeteer';

@Injectable()
export class StreamioPuppeteerService {

  private static readonly logger = new Logger(StreamioPuppeteerService.name);

  static async getDefaultBrowser(): Promise<puppeteer.Browser> {
    return puppeteer.launch({ executablePath: '/usr/lib/chromium/chromium', headless: true });
  }

  static async getVidDirectLink(url: string): Promise<string> {

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
      //if (request.resourceType() === "image") {
      //  request.abort();
      //} else {
        request.continue();
      //}
    });

    page.on('response', (response) => {
      if (response.url().startsWith("https://fstreaming.net")) {
        results.push(response.url());
        this.logger.log('<<', response.status(), response.url());
      }
    });

    await page.goto(url);

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
