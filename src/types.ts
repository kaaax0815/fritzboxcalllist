/** Typings for Call List SOAP Response */
export type CallListResponse = Envelope<{
  getcalllistresponse: { newcalllisturl: string; $: { 'xmlns:u': string } };
}>;

/** Partial Typing for any SOAP Response */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyResponse = Envelope<any>;

/** Base Typing for SOAP Response */
export interface Envelope<T> {
  envelope: { $: { 'xmlns:s': string; 's:encodingStyle': string }; body: T };
}

/** Typings for parsed SessionInfo */
export interface SessionInfo {
  sessioninfo: {
    sid: string;
    challenge: string;
    blocktime: string;
    rights: string;
    users: Array<string | { _: string; $: { last: 1 } }>;
  };
}

/** Typings for parsed Call List CSV */
export interface CSVEntry {
  Typ: number;
  Datum: string;
  Name: string | null;
  Rufnummer: number;
  Nebenstelle: string | null;
  'Eigene Rufnummer': string;
  Dauer: string;
}

export interface CallList {
  root: Root;
}
export interface Root {
  timestamp: string;
  call?: CallEntity[] | null;
}
export interface CallEntity {
  id: string;
  /**
   * 1 = Incoming, 2 = Missed, 3 = Rejected, 4 = Outgoing, 5 = Incoming, 6 = Outgoing
   * 5 & 6 happen when the call is still going while you downloaded the call list
   */
  type: string;
  called: string;
  caller: string;
  callernumber?: string | null;
  name: string;
  numbertype: string;
  device: string;
  port: string;
  date: string;
  duration: string;
  count: string;
  path: string;
  callednumber?: string | null;
}

/** Typings for TR64 Result */
export interface TR64Response {
  root: Root;
}
export interface Root {
  $: $;
  specversion: Specversion;
  systemversion: Systemversion;
  device: Device;
}
export interface $ {
  xmlns: string;
}
export interface Specversion {
  major: string;
  minor: string;
}
export interface Systemversion {
  hw: string;
  major: string;
  minor: string;
  patch: string;
  buildnumber: string;
  display: string;
}
export interface Device {
  devicetype: string;
  friendlyname: string;
  manufacturer: string;
  manufacturerurl: string;
  modeldescription: string;
  modelname: string;
  modelnumber: string;
  modelurl: string;
  udn: string;
  iconlist: Iconlist;
  servicelist: Servicelist;
  devicelist: Devicelist;
  presentationurl: string;
}
export interface Iconlist {
  icon: Icon;
}
export interface Icon {
  mimetype: string;
  width: string;
  height: string;
  depth: string;
  url: string;
}
export interface Servicelist {
  service?: TR64Entity[] | null;
}
export interface TR64Entity {
  servicetype: string;
  serviceid: string;
  controlurl: string;
  eventsuburl: string;
  scpdurl: string;
}
export interface Devicelist {
  device?: DeviceEntity[] | null;
}
export interface DeviceEntity {
  devicetype: string;
  friendlyname: string;
  manufacturer: string;
  manufacturerurl: string;
  modeldescription: string;
  modelname: string;
  modelnumber: string;
  modelurl: string;
  udn: string;
  upc: string;
  servicelist: Servicelist;
  devicelist?: Devicelist1 | null;
}
export interface Devicelist1 {
  device: Device1;
}
export interface Device1 {
  devicetype: string;
  friendlyname: string;
  manufacturer: string;
  manufacturerurl: string;
  modeldescription: string;
  modelname: string;
  modelnumber: string;
  modelurl: string;
  udn: string;
  upc: string;
  servicelist: Servicelist;
}

/** Typings for SCPD Result */
export interface SCPDResult {
  scpd: Scpd;
}
export interface Scpd {
  $: $;
  specversion: Specversion;
  actionlist: Actionlist;
  servicestatetable: Servicestatetable;
}
export interface $ {
  xmlns: string;
}
export interface Specversion {
  major: string;
  minor: string;
}
export interface Actionlist {
  action?: ActionEntity[] | null;
}
export interface ActionEntity {
  name: string;
  argumentlist: Argumentlist;
}
export interface Argumentlist {
  argument?: ArgumentEntityOrArgument[] | null | ArgumentEntityOrArgument;
}
export interface ArgumentEntityOrArgument {
  name: string;
  direction: string;
  relatedstatevariable: string;
}
export interface Servicestatetable {
  statevariable?: StatevariableEntity[] | null;
}
export interface StatevariableEntity {
  $: $1;
  name: string;
  datatype: string;
  defaultvalue?: string | null;
  allowedvaluelist?: Allowedvaluelist | null;
}
export interface $1 {
  sendEvents: string;
}
export interface Allowedvaluelist {
  allowedvalue?: string[] | null;
}
