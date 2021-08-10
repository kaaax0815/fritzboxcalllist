// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { expectToFail } from 'urllib';

import FritzBox from './index';
import {
  buildPhonebookEntry,
  buildSoapAction,
  buildSoapMessage,
  fixPassword,
  generateInsecureResponse,
  parseXML,
  soapRequest,
  utf16le_md5_hex
} from './utils';

jest.mock('urllib');

const fritzbox = new FritzBox({ username: 'Test', password: 'Test' });

beforeAll(() => {
  return fritzbox.initialize();
});

test('generateInsecureResponse', () => {
  expect(generateInsecureResponse('challenge', 'password')).toBe(
    'challenge-086fa48e27e8826c94437d10380e11ba'
  );
  expect(generateInsecureResponse('ec9ef619', '57hsbj§$')).toBe(
    'ec9ef619-5b45550d9d5a4956449aea4574d3e110'
  );
});

test('fixPassword', () => {
  expect(fixPassword('password')).toBe('password');
  expect(fixPassword('password1')).toBe('password1');
  expect(fixPassword('password1@')).toBe('password1@');
  expect(fixPassword('password1@test')).toBe('password1@test');
  expect(fixPassword('😋s😋¶Ħ')).toBe('..s..¶.');
});

test('utf16le_md5_hex', () => {
  expect(utf16le_md5_hex('ashsadhjhagb')).toBe('cb9b86a5caf164041fc409c77910090d');
  expect(utf16le_md5_hex('string')).toBe('b80467f35b449736162b64cbaa3a2a2d');
  expect(utf16le_md5_hex('test')).toBe('c8059e2ec7419f590e79d7f1b774bfe6');
});

test('parseXML', async () => {
  const xmlString1 = '<u:xml><person type="3">Person1</person></u:xml>';
  const xmlString2 = '<root><dasfha type="f">adfasdva</dasfha><s><f></f></s></root>';
  expect(await parseXML(xmlString1)).toEqual({
    xml: { person: { $: { type: '3' }, _: 'Person1' } }
  });
  expect(await parseXML(xmlString2)).toEqual({
    root: { dasfha: { $: { type: 'f' }, _: 'adfasdva' }, s: { f: '' } }
  });
});

test('buildSoapMessage', async () => {
  const soapMessage1 = await buildSoapMessage.call(
    fritzbox,
    'GetInfo',
    'urn:X_AVM-DE_OnTel-com:serviceId:X_AVM-DE_OnTel1'
  );
  const soapMessage2 = await buildSoapMessage.call(
    fritzbox,
    'AddPhonebook',
    'urn:X_AVM-DE_OnTel-com:serviceId:X_AVM-DE_OnTel1',
    {
      NewPhonebookName: 'Test',
      NewPhonebookExtraID: ''
    }
  );
  expect(soapMessage1).toBe(
    '<?xml version="1.0"?><s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><u:GetInfo xmlns:u="urn:dslforum-org:service:X_AVM-DE_OnTel:1"/></s:Body></s:Envelope>'
  );
  expect(soapMessage2).toEqual(
    '<?xml version="1.0"?><s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body><u:AddPhonebook xmlns:u="urn:dslforum-org:service:X_AVM-DE_OnTel:1"><NewPhonebookName>Test</NewPhonebookName><NewPhonebookExtraID/></u:AddPhonebook></s:Body></s:Envelope>'
  );
  await expect(buildSoapMessage.call(fritzbox, '', 'S')).rejects.toThrowError(
    'Service S not found'
  );
  await expect(
    buildSoapMessage.call(
      fritzbox,
      'AddPhonebook',
      'urn:X_AVM-DE_OnTel-com:serviceId:X_AVM-DE_OnTel1',
      { InvalidArg: '' }
    )
  ).rejects.toThrowError('Invalid Argument InvalidArg for Action AddPhonebook');
  await expect(
    buildSoapMessage.call(
      fritzbox,
      'AddPhonebook',
      'urn:X_AVM-DE_OnTel-com:serviceId:X_AVM-DE_OnTel1',
      { NewPhonebookName: '' }
    )
  ).rejects.toThrowError('Missing Arguments: NewPhonebookExtraID');
  await expect(
    buildSoapMessage.call(
      fritzbox,
      'AddPhonebook',
      'urn:X_AVM-DE_OnTel-com:serviceId:X_AVM-DE_OnTel1'
    )
  ).rejects.toThrowError('Missing Argument NewPhonebookExtraID for Action AddPhonebook');
});

test('buildSoapAction', async () => {
  const soapAction = buildSoapAction.call(
    fritzbox,
    'GetPhonebookList',
    'urn:X_AVM-DE_OnTel-com:serviceId:X_AVM-DE_OnTel1'
  );
  expect(soapAction).toBe('urn:dslforum-org:service:X_AVM-DE_OnTel:1#GetPhonebookList');
  expect(() => buildSoapAction.call(fritzbox, '', 'S')).toThrow('Service S not found');
});

test('buildPhonebookEntry', () => {
  const phonebookEntry = buildPhonebookEntry({
    name: 'Test Person',
    numberInfo: [
      { number: '0552', type: 'work' },
      { number: '542', type: 'home' }
    ]
  });
  expect(phonebookEntry).toEqual(
    '<?xml version="1.0"?><contact><category>0</category><person><realName>Test Person</realName></person><telephony><number type="work">0552</number><number type="home">542</number></telephony></contact>'
  );
});

test('soapRequest', async () => {
  const soapResult = await soapRequest.call(
    fritzbox,
    'urn:X_AVM-DE_OnTel-com:serviceId:X_AVM-DE_OnTel1',
    'TEST',
    'TEST'
  );
  expect(soapResult).toEqual({ envelope: { body: 'Test' } });
  await expect(soapRequest.call(fritzbox, 'S', '', '')).rejects.toThrowError('Service S not found');
  expectToFail();
  await expect(
    soapRequest.call(fritzbox, 'urn:X_AVM-DE_OnTel-com:serviceId:X_AVM-DE_OnTel1', '', '')
  ).rejects.toThrowError(
    JSON.stringify({
      faultcode: 'FAULTCODE',
      faultstring: 'FAULTSTRING',
      errorcode: 'ERRORCODE',
      errordescription: 'ERRORDESCRIPTION'
    })
  );
});
