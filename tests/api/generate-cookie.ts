import { readFileSync } from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();
import * as crypto from 'crypto';
import { CookieJar } from 'tough-cookie';
import { Buffer } from 'buffer';
import NodeCache from 'node-cache';

const myCache = new NodeCache({ stdTTL: 300000 }); // 5 minutes TTL

// CONSTANTS
const APP_OCTET = "application/octet-stream";
const BASE64 = "base64";
const ISSUER_URL = "http://alb-cognito-mock-nginx:8080/mock";
const MOCK_CONFIG_PATH = "../../docs/mock-cognito-config.json";

const mockDefaults: Record<string, Record<string, string>> = {
  accessToken: {
      iss: ISSUER_URL,
      exp: "+24h",
      auth_time: "-1h",
      iat: "-2m",
  },
  identityToken: {
      iss: ISSUER_URL,
      exp: "+24h",
      auth_time: "-1h",
      iat: "-2m",
  }
};

let commonOffsetTimeBase = Date.now(); // re-used for each token generation to allow a common reference point

async function bytesToBase64DataUrl(bytes: Uint8Array, type: string = APP_OCTET): Promise<string> {
  const base64Data = Buffer.from(bytes).toString(BASE64);
  return `data:${type};${BASE64},${base64Data}`;
}

async function dataUrlToBytes(dataUrl: string): Promise<Uint8Array> {
  const res = await fetch(dataUrl);
  return new Uint8Array(await res.arrayBuffer());
}

async function base64ToArrayBuffer(base64: string): Promise<ArrayBuffer> {
  const dataUrl = `data:${APP_OCTET};${BASE64},${base64}`;
  const bytes = await dataUrlToBytes(dataUrl);
  return bytes.buffer as ArrayBuffer;
}

function base64urlEncodeFromBase64(str: string): string {
  return str
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
}

async function bytesToBase64UrlEncoding(bytes: Uint8Array): Promise<string> {
  const dataUrl = await bytesToBase64DataUrl(bytes);
  const base64string = dataUrl.replace(`data:${APP_OCTET};${BASE64},`, "");
  return base64urlEncodeFromBase64(base64string);
}

async function stringToBase64UrlEncoding(str: string): Promise<string> {
  const bytes = new TextEncoder().encode(str);
  return await bytesToBase64UrlEncoding(bytes);
}

async function pemToArrayBuffer(pem: string): Promise<ArrayBuffer> {
  const b64Lines = pem.split('\n');
  const b64Prefix = '-----BEGIN PRIVATE KEY-----';
  const b64Suffix = '-----END PRIVATE KEY-----';
  const b64 = b64Lines
      .filter(line => line.trim() !== b64Prefix && line.trim() !== b64Suffix)
      .join('');
  return await base64ToArrayBuffer(b64);
}

function translateTimestampText(claimName: string, text: string): number | undefined {
  const dateRegExp = /^[0-9]{4}-[0-9]{2}-[0-9]{2}(T|[ \t]+)[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,6})?[ \t]*Z$/;

  const trimmedText = text.trim();

  if (dateRegExp.test(trimmedText)) {
      const d = new Date(trimmedText);
      return Math.floor(d.getTime() / 1000);
  }

  const offsetRegExp = /^(?<sign>\+|-)[\t ]*(?<digits>[0-9]+)[\t ]*(?<unit>s|m|h|d)?$/;
  if (offsetRegExp.test(trimmedText)) {
      const m = trimmedText.match(offsetRegExp);
      if (!m) return undefined;
      const sign = m[1];
      const digits = m[2];
      let unit = m[3];
      if (unit === undefined) unit = "s";
      let multiplier = (sign === '-') ? -1 : 1;
      switch (unit) {
          case 's':
              break;
          case 'm':
              multiplier *= 60;
              break;
          case 'h':
              multiplier *= 60 * 60;
              break;
          case 'd':
              multiplier *= 60 * 60 * 24;
              break;
          default:
              break;
      }

      const offset = multiplier * Number.parseInt(digits);
      const timestamp = (
          Math.floor(commonOffsetTimeBase / 1000) + offset
      );

      return timestamp;
  }

  const integerRegExp = /[0-9]+$/;
  if (!integerRegExp.test(trimmedText)) {
      console.error(`Unable to parse value for ${claimName} as integer: ${trimmedText}`);
      return undefined;
  }

  const n = Number.parseInt(trimmedText);
  if (!Number.isInteger(n)) {
      console.error(`Unable to parse value for ${claimName} as integer: ${trimmedText}`);
      return undefined;
  }
  return n;
}

function addClaim(optionGroup: string, claimName: string, claimWriter: (val: string) => void) {
  const rawValue = mockDefaults[optionGroup][claimName];
  if (rawValue !== undefined) {
    claimWriter(rawValue);
  }
}

function addTimestampClaim(target: Record<string, any>, optionGroup: string, claimName: string) {
  addClaim(optionGroup, claimName, (rawValue) => {
      const value = translateTimestampText(claimName, rawValue);
      if (value !== undefined) target[claimName] = value;
  });
}

function addTextClaim(target: Record<string, any>, optionGroup: string, claimName: string) {
  addClaim(optionGroup, claimName, (rawValue) => {
      target[claimName] = rawValue.trim();
  });
}

function buildJwtHeader(optionGroup: string) {
  return { alg: 'RS256', typ: 'JWT', kid: '1234567890' };
}

function buildJwtData(payload: Record<string, any>, optionGroup: string) {
  addTimestampClaim(payload, optionGroup, "iat");
  addTimestampClaim(payload, optionGroup, "exp");
  addTimestampClaim(payload, optionGroup, "auth_time");
  addTextClaim(payload, optionGroup, "iss");

  return payload;
}

async function createJwt(payload: Record<string, any>, privateKey: string, optionGroup: string): Promise<string> {
  const header = buildJwtHeader(optionGroup);
  const extendedPayload = buildJwtData(Object.assign({}, payload), optionGroup);
  
  const encodedHeader = await stringToBase64UrlEncoding(JSON.stringify(header));
  const encodedPayload = await stringToBase64UrlEncoding(JSON.stringify(extendedPayload));

  const token = `${encodedHeader}.${encodedPayload}`;
  const signature = await signToken(token, privateKey);
  return `${token}.${signature}`;
}

async function signToken(token: string, privateKey: string): Promise<string> {
  const keyBuffer = await pemToArrayBuffer(privateKey);
  const key = await crypto.subtle.importKey(
      'pkcs8',
      keyBuffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
  );
  const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      new TextEncoder().encode(token)
  );
  return await bytesToBase64UrlEncoding(new Uint8Array(signature));
}

async function fetchPrivateKey(): Promise<string> {
  const keyPath = process.env.SIG_KEY_PATH;
  if (!keyPath) {
    throw new Error('SIG_KEY_PATH environment variable is not set');
  }
  return readFileSync(path.resolve(keyPath, 'private.key'), 'utf-8');
}

const setCookies = async (jwtAccessToken: string, identity: string, jwtData: string, baseUrl: string): Promise<CookieJar> => {
  const jar = new CookieJar();
  await jar.setCookie(`staizen_devops_mock_accesstoken=${jwtAccessToken}; path=/`, baseUrl);
  await jar.setCookie(`staizen_devops_mock_identity=${identity}; path=/`, baseUrl);
  await jar.setCookie(`staizen_devops_mock_data=${jwtData}; path=/`, baseUrl);
  return jar;
}

/**
 * Generate cookies programmatically mirroring the mock server
 * @param baseUrl - url path to generate the cookies
 * @param groups - Array of permission groups to assign
 * @returns `cookieJar`
 */
export async function generateDynamicCookies(baseUrl: string, groups: string[] = []): Promise<CookieJar | undefined> {
  const cachedKey = `${baseUrl}-${groups.join(',')}`;
  const cachedData = myCache.get<CookieJar>(cachedKey);
  if (cachedData) {
    return cachedData;
  }

  // Load base mock configuration
  const configPath = path.resolve(__dirname, MOCK_CONFIG_PATH);
  const mockConfig = JSON.parse(readFileSync(configPath, "utf-8"));

  const accessToken = { ...mockConfig.accessTokenClaims };
  const idTokenClaims = { ...mockConfig.idTokenClaims };

  // Set the specific groups for this test context or use defaults if not provided
  if (groups && groups.length > 0) {
    accessToken["cognito:groups"] = groups;
  }

  // Clear app_roles so they don't break App access
  idTokenClaims["custom:app_roles"] = "[]";

  const identity = idTokenClaims["custom:oid"];

  try {
      commonOffsetTimeBase = Date.now(); // reset common base time for offsets
      const secret = await fetchPrivateKey();
      const jwtAccessToken = await createJwt(accessToken, secret, "accessToken");
      const jwtData = await createJwt(idTokenClaims, secret, "identityToken");
      const cookieJar = await setCookies(jwtAccessToken, identity, jwtData, baseUrl);
      myCache.set(cachedKey, cookieJar);
      return cookieJar;
  } catch (err) {
      console.error(err);
      throw err;
  }
}
