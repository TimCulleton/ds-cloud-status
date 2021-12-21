import { IncomingMessage } from "http";
import https = require("https");
import FormData = require("form-data");

/**
 * Simple Record that will group cookies by hostname
 * Hostname -> Cookie
 */
export type CookieRecord = Record<string, Record<string, boolean>>;

export interface RequestResponse {
    /** Https Response */
    res: Readonly<IncomingMessage>;
    /** Data String received from request */
    data: string;
    /** Cookie Record keeping track of 'set-cookie' header results */
    cookies: CookieRecord;
}
export interface MakeRequestOptions extends https.RequestOptions {
    /**
     * If true this will attempt to auto follow a 302 Redirect request
     */
    followRedirect?: boolean;
    /**
     * Convenience property that will allow for a full url path to be
     * set instead of host name, path
     */
    url?: string;

    /** Cookie Record keeping track of 'set-cookie' header results */
    cookieRecord?: CookieRecord;
}

export interface ProcessCookieOptions {
    hostName: string;
    response: IncomingMessage;
    cookieRecord: CookieRecord;
}

/**
 * Extract the 'set-cookie' from the response headers if present.
 * These cookies will then be stored in the cookie record grouped by
 * the request hostname
 * @param options
 */
export function processCookies(options: ProcessCookieOptions): void {
    if (options.response.headers["set-cookie"]) {
        const { hostName } = options;

        if (!options.cookieRecord[hostName]) {
            options.cookieRecord[hostName] = {};
        }
        const cookieRecord = options.cookieRecord[hostName];
        options.response.headers["set-cookie"].forEach((cookie) => {
            const cookieValue = cookie.split(";")[0];
            cookieRecord[cookieValue] = true;
        });
    }
}

/**
 * Helper method to get the
 * @param response
 * @returns
 */
export function getCookiesFromResponse(response: IncomingMessage): string[] {
    if (response.headers["set-cookie"]) {
        return response.headers["set-cookie"]?.map((cookie) => cookie.split(";")[0]);
    }
    return [];
}

export function initializeRequestOptions(options: MakeRequestOptions, data?: FormData): MakeRequestOptions {
    // Apply hostname and path using url
    if (options.url) {
        const url = new URL(options.url);
        options.hostname = url.hostname;
        options.path = url.pathname + url.search;
    }

    let headers = options.headers || {};

    // Apply Form Data Headers
    if (data) {
        headers = Object.assign(headers, data.getHeaders());
        (options as https.RequestOptions).headers = headers;
    }

    // Apply cookies
    const cookieTokens = options.cookieRecord && options.hostname && options.cookieRecord[options.hostname]
        ? Object.keys(options.cookieRecord[options.hostname])
        : [];
    if (cookieTokens.length) {
        const originalCookie = headers.Cookie || "";
        headers.Cookie = originalCookie + cookieTokens.join(";");
    }

    // Set headers back to options
    options.headers = headers;
    return options;
}

/**
 * Make a request using the underlying NodeJS https library
 * Cookies will stored in cookie record if the response header contains 'set-cookie'
 * @param options
 * @param data
 * @returns
 */
export function request(options: MakeRequestOptions, data?: FormData): Promise<RequestResponse> {
    initializeRequestOptions(options, data);

    return new Promise<RequestResponse>((resolve, reject) => {
        console.info(`Making Request: ${options.hostname}${options.path}`);
        const req = https.request(options, (res) => {
            const responseData: RequestResponse = {
                res,
                data: "",
                cookies: options.cookieRecord || {},
            };

            const buffer: string[] = [];
            res.on("data", async (d) => {
                const rawResponse = d.toString();
                buffer.push(rawResponse);
            });

            res.on("end", () => {
                responseData.data = buffer.join("");
                processCookies({
                    hostName: options.hostname || "",
                    response: res,
                    cookieRecord: responseData.cookies,
                });
                resolve(responseData);
            });
        });

        req.on("error", (e) => {
            reject(e);
        });

        if (data) {
            data.pipe(req);
        }
        req.end();
    });
}

/**
 * Make a request using the underlying NodeJS https library
 * Cookies will stored in cookie record if the response header contains 'set-cookie'
 * This will allow for following redirects in that when a 302 and location header is present
 * a GET request will be made.
 * @param options
 * @param data
 * @returns
 */
export async function makeRequest(options: MakeRequestOptions, data?: FormData): Promise<RequestResponse> {
    const responseData = await request(options, data);
    if (responseData.res.statusCode === 302 && options.followRedirect && responseData.res.headers.location) {
        const redirectUrl = new URL(responseData.res.headers.location);

        return makeRequest({
            method: "GET",
            hostname: redirectUrl.hostname,
            path: redirectUrl.pathname + redirectUrl.search,
            followRedirect: true,
            cookieRecord: responseData.cookies,
        });
    }
    return responseData;
}
