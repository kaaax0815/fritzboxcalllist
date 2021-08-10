import { createHash } from 'crypto';
import { extend } from 'underscore';
import { request } from 'urllib';
import { Parser as XMLParser, processors } from 'xml2js';
import xmlbuilder from 'xmlbuilder';

import FritzBox from './fritzbox';

/**
 * Generates Insecure Response
 * @param {string} challenge
 * @param {string} password
 * @returns {string} response
 * @see <https://avm.de/fileadmin/user_upload/Global/Service/Schnittstellen/AVM_Technical_Note_-_Session_ID_english_2021-05-03.pdf>
 */
export function generateInsecureResponse(challenge: string, password: string): string {
  const together = `${challenge}-${fixPassword(password)}`;
  const response = `${challenge}-${utf16le_md5_hex(together)}`;
  return response;
}

/**
 * Replaces all Unicode characters > 255 with a `.`.
 * @param {string} input password
 * @returns {string} less secure password
 */
export function fixPassword(input: string): string {
  let result = '';

  for (let i = 0; i < input.length; i++) {
    result += input.charCodeAt(i) > 255 ? '.' : input.charAt(i);
  }

  return result;
}

/**
 * ucs-2 encoded string → MD5 → hex
 * @param {string} string challenge and password together
 * @returns {string} hex
 */
export function utf16le_md5_hex(string: string): string {
  return createHash('md5').update(Buffer.from(string, 'ucs-2')).digest('hex');
}

/**
 * Parse XML String
 * @param {string} xml
 * @returns {Promise<any>} parsed object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseXML<T = any>(string: string): Promise<T> {
  const xmlParser = new XMLParser({
    normalizeTags: true,
    async: true,
    explicitArray: false,
    tagNameProcessors: [processors.stripPrefix]
  });
  return xmlParser.parseStringPromise(string);
}

export async function buildSoapMessage(
  this: FritzBox,
  action: string,
  serviceID: string,
  args?: Record<string, string>
): Promise<string> {
  const fqaction = 'u:' + action;
  const service = this.tr64.get(serviceID)?.servicetype;
  if (!service) {
    throw new Error(`Service ${serviceID} not found`);
  }
  const actionArgs = await this.parseSCPD(action, serviceID);
  if (args) {
    // check if action wants given arguments
    const argsArray: string[] = [];
    for (const arg in args) {
      argsArray.push(arg);
      if (!actionArgs.has(arg)) {
        throw new Error(`Invalid Argument ${arg} for Action ${action}`);
      }
    }
    const missingArgs = actionArgs.filter((v, k) => v.direction === 'in' && !argsArray.includes(k));
    if (missingArgs.size > 0) {
      throw new Error(`Missing Arguments: ${missingArgs.map((v, k) => k).join(', ')}`);
    }
  } else {
    actionArgs.forEach((v, k) => {
      if (v.direction === 'in') {
        throw new Error(`Missing Argument ${k} for Action ${action}`);
      }
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const root: any = {
    's:Envelope': {
      '@s:encodingStyle': 'http://schemas.xmlsoap.org/soap/encoding/',
      '@xmlns:s': 'http://schemas.xmlsoap.org/soap/envelope/',
      's:Body': {}
    }
  };
  root['s:Envelope']['s:Body'][fqaction] = {
    '@xmlns:u': service
  };
  extend(root['s:Envelope']['s:Body'][fqaction], args);
  const xml = xmlbuilder.create(root);
  return xml.end();
}

/**
 * Build SOAP Action
 * @param {string} action The Action
 * @param {string} serviceID The Service ID
 * @returns {string} SOAP Action
 */
export function buildSoapAction(this: FritzBox, action: string, serviceID: string): string {
  const service = this.tr64.get(serviceID)?.servicetype;
  if (!service) {
    throw new Error(`Service ${serviceID} not found`);
  }
  return `${service}#${action}`;
}

/**
 * Build Phonebook Entry
 * @param {string} name The name of the person
 * @param {{number: string;type: 'home' | 'work' | 'mobile' | 'fax_work';}[]} numberInfo Phone number Info of the person
 * @returns {string} Phonebook Entry
 */
export function buildPhonebookEntry({
  name,
  numberInfo
}: {
  name: string;
  numberInfo: {
    number: string;
    type: 'home' | 'work' | 'mobile' | 'fax_work';
  }[];
}): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const root: any = {
    contact: {
      category: 0,
      person: {
        realName: name
      },
      telephony: {
        number: []
      }
    }
  };
  for (const number of numberInfo) {
    root.contact.telephony.number.push({
      '@type': number.type,
      '#text': number.number
    });
  }
  const xml = xmlbuilder.create(root);
  return xml.end();
}

/**
 * Make Soap Request
 * @param {string} url - URL of the SOAP-Endpoint
 * @param {string} serviceID - Service ID
 * @param {string} soapMessage - SOAP-Message
 * @param {string} soapAction - SOAP-Action
 * @returns {Promise<T>} XML Response as Object
 */
export async function soapRequest<T>(
  this: FritzBox,
  serviceID: string,
  soapMessage: string,
  soapAction: string
): Promise<T> {
  let url = this.tr64.get(serviceID)?.controlurl;
  if (!url) {
    throw new Error(`Service ${serviceID} not found`);
  }
  // Prepend the URL of the Fritzbox
  url = this.apiUrl(url, true);
  // SOAP Request with built data
  const response = await request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: soapAction
    },
    digestAuth: `${this.username}:${this.password}`,
    data: soapMessage,
    dataType: 'text'
  });
  const parsedResponse = await parseXML(response.data);
  // If a error happened
  if (parsedResponse.envelope.body.fault) {
    const {
      faultcode,
      faultstring,
      detail: {
        upnperror: { errorcode, errordescription }
      }
    } = parsedResponse.envelope.body.fault;
    throw new Error(JSON.stringify({ faultcode, faultstring, errorcode, errordescription }));
  }
  return parsedResponse;
}
