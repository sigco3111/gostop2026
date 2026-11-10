import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer-core';
const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const p=await b.newPage();await p.setViewport({width:3978,height:2196,deviceScaleFactor:1});await p.goto(pathToFileURL(resolve('assets/licensed/hwatu/Hwatu_overview.svg')).href);await p.evaluate(()=>{document.documentElement.setAttribute('width','3978');document.documentElement.setAttribute('height','2196');});await p.screenshot({path:'/downloads/korean-hwatu-reference/overview.png'});await b.close();
