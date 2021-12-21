import { IncomingMessage } from "http";
import https = require("https");
import { parse } from "node-html-parser";
import FormData = require("form-data");
import { URL } from "url";
import CloudTypes = require("./cloudTypes");

// Get Ticket
// const passport = "https://eu1-dsi-iam.3dexperience.3ds.com/3DPassport/login?action=get_auth_params";
// https://eu2-supppd-realtime.3dexperience.3ds.com/supervision/api/v4/alerting/alertsbyequipments?group=PPD1R420&search=%203dgeoscisurveycstt210913&count=100&offset=0&loading=true&scrollTop=0

// https://eu1-dsi-iam.3dexperience.3ds.com/3DPassport/login?service=https://eu2-supppd-realtime.3dexperience.3ds.com/react/

// https://eu2-supppd-realtime.3dexperience.3ds.com/supervision/api/v4/alerting/alertsbyequipments?group=PPD1R420&search=3dgeoscisurveycstt210913&count=100&offset=0&loading=true&scrollTop=0
// https://eu2-supppd-realtime.3dexperience.3ds.com/supervision/api/v4/alerting/alertsbyequipments?group=PPD1R420&search=3dgeoscisurveycstt210913&count=100&offset=0

export enum Service {
    Passport = "eu1-dsi-iam.3dexperience.3ds.com/3DPassport",
    Supervision = "eu2-supppd-realtime.3dexperience.3ds.com",
}

export interface RequestResponse {
    res: Readonly<IncomingMessage>;
    data?: string;
}

export function makeRequest(url: string, data?: FormData): Promise<RequestResponse>;
export function makeRequest(options: https.RequestOptions, data?: FormData): Promise<RequestResponse>;

export function makeRequest(options: any, data?: FormData): Promise<RequestResponse> {
    return new Promise<RequestResponse>((resolve, reject) => {
        // Apply Form Data Headers
        if (data && typeof options === "object") {
            const originalHeaders = (options as https.RequestOptions).headers || {};
            const headers = Object.assign(originalHeaders, data.getHeaders());
            (options as https.RequestOptions).headers = headers;
        }

        const req = https.request(options, (res) => {
            const responseData: RequestResponse = {
                res,
                data: undefined,
            };

            const buffer: string[] = [];
            res.on("data", async (d) => {
                const rawResponse = d.toString();
                buffer.push(rawResponse);
            });

            res.on("end", () => {
                responseData.data = buffer.join("");
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

export function isResponseLoginChallenge(response: IncomingMessage): boolean {
    return response.statusCode === 302 && /\/cas\/login\?/.test(response.headers.location || "");
}

export async function performLoginFromChallenge(response: RequestResponse): Promise<string> {
    if (response.res.headers.location) {
        // const cookies: Record<string, Record<string, string>> = {};

        const getLoginChallengeData = await makeRequest(response.res.headers.location);
        const loginPage = parse(getLoginChallengeData.data as string);
        const rawConfigData = loginPage.querySelector("#configData")?.rawText;
        const configData: CloudTypes.LoginChallengeData = rawConfigData ? JSON.parse(rawConfigData) : {};
        const loginFormData = new FormData();
        loginFormData.append("username", "hq9");
        loginFormData.append("password", "XXXX");
        loginFormData.append("lt", configData.lt);

        // Login
        const loginUrl = new URL(configData.url);
        const loginCookies = getLoginChallengeData.res.headers["set-cookie"]?.map((cookie) => cookie.split(";")[0]) || [];
        // cookies[loginUrl.hostname] = loginCookies.reduce((acc, cookie) => {
        //     acc[cookie] = cookie;
        //     return acc;
        // }, {} as Record<string, string>);

        const loginResult = await makeRequest({
            method: "POST",
            hostname: loginUrl.hostname,
            path: loginUrl.pathname + loginUrl.search,
            headers: {
                Cookie: loginCookies?.join(";") || "",
            },
        }, loginFormData);
        console.info(`Status: ${loginResult.res.statusCode} Loc: ${loginResult.res.headers.location}`);

        // Redirct back to original request
        const requestUrl = new URL(loginResult.res.headers.location || "");
        const requestCookie = loginResult.res.headers["set-cookie"]?.map((cookie) => cookie.split(";")[0]);
        const requestResult = await makeRequest({
            method: "GET",
            hostname: requestUrl.hostname,
            path: requestUrl.pathname + requestUrl.search,
            headers: {
                Cookie: requestCookie?.join(";"),
            },
        });
        console.info(requestResult.data);

        const finalUrl = new URL(requestResult.res.headers.location || "");
        const finalCookies = requestResult.res.headers["set-cookie"]?.map((cookie) => cookie.split(";")[0]);
        const finalRequest = await makeRequest({
            method: "GET",
            hostname: finalUrl.hostname,
            path: finalUrl.pathname + finalUrl.search,
            headers: {
                Cookie: finalCookies?.join(";"),
            },
        });

        const alerts = JSON.parse(finalRequest.data || "") as CloudTypes.AlertsByEquipmentData;
        const names = alerts.equipment.map((item) => {
            if (CloudTypes.isEquipmentVM(item)) {
                return item.vmInstanceName;
            }
            return item.serviceDefinitionName;
        });
        console.info(names);

        return finalRequest.data || "";
    }
    return undefined as any;
}

export function parseGetServiceStatus(content: string): Promise<string> {
    try {
        return Promise.resolve(JSON.parse(content));
    } catch (e) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const loginChallenge = parse(content);
        const rawConfigData = loginChallenge.querySelector("#configData")?.rawText;
        const configData = rawConfigData ? JSON.parse(rawConfigData) : {};
        return Promise.resolve(configData);
    }
}

export async function getServiceStatusV2(): Promise<string> {
    const options: https.RequestOptions = {
        method: "GET",
        hostname: "eu2-supppd-realtime.3dexperience.3ds.com",
        path: "/supervision/api/v4/alerting/alertsbyequipments?group=PPD1R420&search=3dgeoscisurveycstt210913&count=100&offset=0",
    };

    const initialResponse = await makeRequest(options);
    if (isResponseLoginChallenge(initialResponse.res)) {
        const challenge = await performLoginFromChallenge(initialResponse);
        console.info(challenge);
        return challenge || "";
    }

    return initialResponse.data || "";
}
