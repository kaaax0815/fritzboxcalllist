import { jest } from '@jest/globals';
import { join } from 'path';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const urllib = <any>jest.createMockFromModule('urllib');
import { promises } from 'fs';

let shouldFail = false;
let callList = false;

function expectToFail() {
  shouldFail = true;
}

function expectToPass() {
  shouldFail = false;
}

function acceptCallListOnce() {
  callList = true;
}

async function request(url: string) {
  url = url.replace('http://fritz.box/', '');
  url = url.replace('http://fritz.box:49000/', '');
  url = url.replace('https://s/', '');
  url = url.replace('https://s:49443/', '');
  url = url.split('?')[0];
  if (shouldFail) {
    url += '.fails';
  }
  if (callList && url.startsWith('upnp')) {
    callList = false;
    url += '.post';
  }
  const fileContent = (await promises.readFile(join(__dirname, '../../sample', url))).toString(
    'utf-8'
  );
  const fakeResponse = {
    data: fileContent
  };
  return fakeResponse;
}

urllib.request = request;

urllib.expectToFail = expectToFail;

urllib.expectToPass = expectToPass;

urllib.acceptCallListOnce = acceptCallListOnce;

module.exports = urllib;
