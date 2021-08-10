// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { acceptCallListOnce, expectToFail, expectToPass } from 'urllib';

import FritzBox from './index';

const fritzbox = new FritzBox({ username: 'Test', password: 'Test' });

jest.mock('urllib');

beforeAll(async () => {
  expect(fritzbox.initialized).toBe(false);
  await fritzbox.initialize();
});

test('Properties', () => {
  expect(fritzbox.address).toBe('fritz.box');
  expect(fritzbox.username).toBe('Test');
  expect(fritzbox.password).toBe('Test');
  expect(fritzbox.secure).toBe(false);
  expect(fritzbox.tr64.size).toBe(23);
  expect(fritzbox.initialized).toBe(true);
  expect(fritzbox.sessionID).toBe('0000000001000000');
});

test('GetSessionID', async () => {
  expectToFail();
  await expect(fritzbox.getSessionID()).resolves.toBe(false);
});

test('parseSCPD', async () => {
  expectToPass();
  await expect(fritzbox.parseSCPD('', 'S')).rejects.toThrowError('Service S not found');
  expectToFail();
  await expect(
    fritzbox.parseSCPD('', 'urn:X_AVM-DE_OnTel-com:serviceId:X_AVM-DE_OnTel1')
  ).rejects.toThrowError(
    'Actions for Service urn:X_AVM-DE_OnTel-com:serviceId:X_AVM-DE_OnTel1 not found'
  );
  expectToPass();
  await expect(
    fritzbox.parseSCPD('A', 'urn:X_AVM-DE_OnTel-com:serviceId:X_AVM-DE_OnTel1')
  ).rejects.toThrowError(
    'Invalid Action A for Service urn:X_AVM-DE_OnTel-com:serviceId:X_AVM-DE_OnTel1'
  );
});

test('initialize', async () => {
  expectToPass();
  await expect(fritzbox.initialize()).resolves.toBe(true);
  expectToFail();
  await fritzbox.getSessionID();
  fritzbox.initialized = false;
  await expect(fritzbox.initialize()).rejects.toThrowError('Could not login to FritzBox');
});

test('apiUrl', () => {
  const fritzbox2 = new FritzBox({
    address: 's',
    username: 'Test',
    password: 'Test',
    secure: true
  });
  expectToPass();
  fritzbox2.initialize();
});

test('getCallListUrl', async () => {
  expectToPass();
  acceptCallListOnce();
  await expect(fritzbox.getCallListUrl()).resolves.toBe('/upnp/control/calllist.xml?');
});

test('getCallList', async () => {
  expectToPass();
  acceptCallListOnce();
  await expect(fritzbox.getCallList()).resolves.toBe('<root></root>');
  acceptCallListOnce();
  await expect(fritzbox.getCallList(false)).resolves.toBe('<root></root>');
});
