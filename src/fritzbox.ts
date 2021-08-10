import { Collection } from '@discordjs/collection';
import { request } from 'urllib';

import {
  ArgumentEntityOrArgument,
  CallListResponse,
  SCPDResult,
  SessionInfo,
  TR64Entity,
  TR64Response
} from './types';
import {
  buildSoapAction,
  buildSoapMessage,
  generateInsecureResponse,
  parseXML,
  soapRequest
} from './utils';

export class FritzBox {
  /** P-Adresse oder Hostname der FritzBox. Default: fritz.box */
  readonly address: string;
  /** Benutzername zur FritzBox */
  readonly username: string;
  /** Passwort zur FritzBox */
  readonly password: string;
  /** Ob HTTP oder HTTPS. Default: false */
  readonly secure: boolean;
  /** Holds Information about all TR64 Services */
  readonly tr64 = new Map<string, TR64Entity>();
  /** if sessionID and tr64 are initialized. False forces reinitialization */
  initialized = false;
  sessionID: string | undefined;
  /**
   * Stellt eine Verbindung zur FritzBox her
   * @param {string} [address] - IP-Adresse oder Hostname der FritzBox. Default: fritz.box
   * @param {string} username - Benutzername zur FritzBox
   * @param {string} password - Passwort zur FritzBox
   * @param {boolean} [secure] - Ob HTTP oder HTTPS. Default: false
   */
  constructor({
    address = 'fritz.box',
    username,
    password,
    secure = false
  }: {
    address?: string;
    username: string;
    password: string;
    secure?: boolean;
  }) {
    this.address = address;
    this.username = username;
    this.password = password;
    this.secure = secure;
    this.sessionID = undefined;
  }

  /**
   * Get Session ID
   * @returns {Promise<string | false>} The SID or false if not logged in
   */
  async getSessionID(): Promise<string | false> {
    const challengeXML = await request(this.apiUrl('/login_sid.lua?version=1'), {
      contentType: 'text'
    });
    const parsedChallengeXML = await parseXML<SessionInfo>(challengeXML.data);
    const challenge = parsedChallengeXML.sessioninfo.challenge;
    const response = generateInsecureResponse(challenge, this.password);
    const loginXML = await request(this.apiUrl('/login_sid.lua?version=1'), {
      method: 'POST',
      contentType: 'text',
      data: {
        username: this.username,
        response
      }
    });
    const parsedLoginXML = await parseXML<SessionInfo>(loginXML.data);
    const SID = parsedLoginXML.sessioninfo.sid;
    // Check if login was successful
    if (SID === '0000000000000000') {
      return false;
    } else {
      this.sessionID = SID;
      return SID;
    }
  }

  /**
   * Get Arguments for Action in Service
   * @param {string} action - Name of the Action
   * @param {string} serviceID - ID of the Service
   * @returns {Map<string, Argumentlist>} Map of arguments
   */
  async parseSCPD(
    action: string,
    serviceID: string
  ): Promise<Collection<string, ArgumentEntityOrArgument>> {
    let scpdURL = this.tr64.get(serviceID)?.scpdurl;
    if (!scpdURL) {
      throw new Error(`Service ${serviceID} not found`);
    }
    // Prepend the URL of the Fritzbox
    scpdURL = this.apiUrl(scpdURL, true);
    const result = (await request(scpdURL)).data.toString('utf-8');
    const parsedResult = await parseXML<SCPDResult>(result);
    if (!parsedResult.scpd.actionlist.action) {
      throw new Error(`Actions for Service ${serviceID} not found`);
    }
    const actionArguments = parsedResult.scpd.actionlist.action.find((v) => v.name === action)
      ?.argumentlist.argument;
    if (!actionArguments) {
      throw new Error(`Invalid Action ${action} for Service ${serviceID}`);
    }
    // Create Collection to store the data
    const scpd = new Collection<string, ArgumentEntityOrArgument>();
    if (!Array.isArray(actionArguments)) {
      return scpd.set(actionArguments.name, actionArguments);
    }
    for (const argument of actionArguments) {
      scpd.set(argument.name, argument);
    }
    return scpd;
  }

  /**
   * Initialize Session ID and TR64Desc
   * Also checks if login is correct and if TR64 is available
   * @returns {Promise<boolean>}
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return this.initialized;
    }
    const sessionID = await this.getSessionID();
    if (sessionID === false) {
      throw new Error('Could not login to FritzBox');
    }
    await this.parseTR64();
    return (this.initialized = true);
  }

  /**
   * Return URL for given Endpoint
   * @param {string} endpoint
   * @param {boolean} [tr64] if true, return TR64 URL
   * @returns {string} URL for given Endpoint
   * @protected
   */
  protected apiUrl(endpoint: string, tr64?: boolean): string {
    return `http${this.secure ? 's' : ''}://${this.address}${
      tr64 ? ':' + (this.secure ? '49443' : '49000') : ''
    }${endpoint}`;
  }

  /**
   * Parses TR64 and stores all Services and their Information
   * @returns {Promise<void>}
   * @protected
   */
  protected async parseTR64(): Promise<void> {
    const url = this.apiUrl('/tr64desc.xml', true);
    const result = (await request(url)).data.toString('utf-8');
    const parsedResult = await parseXML<TR64Response>(result);
    for (const Service of parsedResult.root.device.servicelist.service!) {
      this.tr64.set(Service.serviceid, Service);
    }
  }

  /**
   * Get Call List URL
   */
  async getCallListUrl(): Promise<string> {
    await this.initialize();
    const result = <CallListResponse>(
      await this.execAction('GetCallList', 'urn:X_AVM-DE_OnTel-com:serviceId:X_AVM-DE_OnTel1')
    );
    return result.envelope.body.getcalllistresponse.newcalllisturl;
  }

  /**
   * Get Call List as XML or CSV
   * @param {boolean} [xml=true] If you want XML. Default: true
   * @important In the CSV the first line is ta metatag not the actual header
   */
  async getCallList(xml = true): Promise<string> {
    await this.initialize();
    const url = await this.getCallListUrl();
    const result = await request(url + '&type=' + (xml ? 'xml' : 'csv'), {
      contentType: 'text'
    });
    return result.data.toString('utf-8');
  }

  /**
   * Execute SOAP Action
   * @param {string} action - Name of the Action
   * @param {string} serviceID - ID of the Service
   * @param {Record<string, unknown>} [args] - For some actions Arguments are needed
   */
  async execAction(
    action: string,
    serviceID: string,
    args?: Record<string, string>
  ): Promise<unknown> {
    await this.initialize();
    const soapMessage = await buildSoapMessage.call(this, action, serviceID, args);
    const soapAction = buildSoapAction.call(this, action, serviceID);
    const result = await soapRequest.call(this, serviceID, soapMessage, soapAction);
    return result;
  }
}

export default FritzBox;
