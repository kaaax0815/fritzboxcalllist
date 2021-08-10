import dasTelefonbuchReverseLookup, { reverseLookupResult } from 'das-telefonbuch-scraper';
import Papa from 'papaparse';
import { Parser, ParserOptions as XMLParserOptions } from 'xml2js';

/**
 * Parse CSV
 * @param {string} xml the csv string
 * @param {CSVParserOptions} options the parser options
 * @returns {Promise<T[]>} the parsed csv
 */
export function CSVtoObject<T = unknown>(
  csv: string,
  parseConfig?: CSVParserOptions
): Promise<T[]> {
  return new Promise((resolve) => {
    Papa.parse<T>(csv, {
      ...parseConfig,
      complete: (results) => resolve(results.data)
    });
  });
}

/**
 * Parse XML
 * @param {string} xml the xml string
 * @param {XMLParserOptions} options the parser options
 * @returns {Promise<T>} the parsed xml
 */
export function XMLtoObject<T = unknown>(xml: string, parseConfig?: XMLParserOptions): Promise<T> {
  const parser = new Parser({ ...parseConfig });
  return parser.parseStringPromise(xml);
}

/**
 * Lookup Phone Number on Das Telefonbuch
 * @param {string | number} number Phone Number
 * @returns {Promise<reverseLookupResult>} Lookup Result
 */
export function reverseLookup(name: string | number): Promise<reverseLookupResult> {
  return dasTelefonbuchReverseLookup(name);
}

/**
 * Removes First Line from a Text
 * @param {string} input the input
 * @param {string} [newline="\n"] the newline character. Default: \n
 * @returns {string} the input without the first line
 */
export function removeFirstLine(input: string, newline = '\n'): string {
  const lines = input.split(newline);
  lines.splice(0, 1);
  return lines.join(newline);
}

export interface CSVParserOptions {
  header?: boolean;
  skipEmptyLines?: boolean;
  delimiter?: string;
  dynamicTyping?: boolean;
  trimHeaders?: boolean;
}
