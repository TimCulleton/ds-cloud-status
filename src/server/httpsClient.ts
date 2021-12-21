import { IncomingMessage } from "http";
import https = require("https");
import FormData = require("form-data");

export type CookieRecord = Record<string, Record<string, boolean>>;

export interface RequestResponse {
    res: Readonly<IncomingMessage>;
    data: string;
    cookies: CookieRecord;
}

export interface RequestRedirectResponse {
    requests: RequestResponse[];
    cookies: CookieRecord;
}

export interface MakeRequestOptions extends https.RequestOptions {
    followRedirect?: boolean;
    url?: string;
    cookieRecord?: CookieRecord;
}

interface ProcessCookieOptions {
    hostName: string;
    response: IncomingMessage;
    cookieRecord: CookieRecord;
}

function processCookies(options: ProcessCookieOptions): void {
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

export function getCookiesFromResponse(response: IncomingMessage): string[] {
    if (response.headers["set-cookie"]) {
        return response.headers["set-cookie"]?.map((cookie) => cookie.split(";")[0]);
    }
    return [];
}

export function request(options: MakeRequestOptions, data?: FormData): Promise<RequestResponse> {
    // Apply Form Data Headers
    if (data) {
        const originalHeaders = (options as https.RequestOptions).headers || {};
        const headers = Object.assign(originalHeaders, data.getHeaders());
        (options as https.RequestOptions).headers = headers;
    }

    // Apply hostname and path using url
    if (options.url) {
        const url = new URL(options.url);
        options.hostname = url.hostname;
        options.path = url.pathname + url.search;
    }

    // Apply cookies
    const cookieTokens = options.cookieRecord && options.hostname && options.cookieRecord[options.hostname]
        ? Object.keys(options.cookieRecord[options.hostname])
        : [];
    if (cookieTokens.length) {
        const header = options.headers || {};
        options.headers = header;
        const originalCookie = header.Cookie || "";
        header.Cookie = originalCookie + cookieTokens.join(";");
    }

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
