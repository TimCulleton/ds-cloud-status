import { IncomingMessage } from "http";
import https = require("https");
import { parse } from "node-html-parser";

// Get Ticket
// const passport = "https://eu1-dsi-iam.3dexperience.3ds.com/3DPassport/login?action=get_auth_params";
// https://eu2-supppd-realtime.3dexperience.3ds.com/supervision/api/v4/alerting/alertsbyequipments?group=PPD1R420&search=%203dgeoscisurveycstt210913&count=100&offset=0&loading=true&scrollTop=0

// https://eu1-dsi-iam.3dexperience.3ds.com/3DPassport/login?service=https://eu2-supppd-realtime.3dexperience.3ds.com/react/

// https://eu2-supppd-realtime.3dexperience.3ds.com/supervision/api/v4/alerting/alertsbyequipments?group=PPD1R420&search= 3dgeoscisurveycstt210913&count=100&offset=0&loading=true&scrollTop=0

export enum Service {
    Passport = "eu1-dsi-iam.3dexperience.3ds.com/3DPassport",
    Supervision = "eu2-supppd-realtime.3dexperience.3ds.com",
}

export interface RequestResponse {
    res: Readonly<IncomingMessage>;
    data?: string;
}

export function makeRequest(url: string, data?: any): Promise<RequestResponse>;
export function makeRequest(options: https.RequestOptions, data?: any): Promise<RequestResponse>;

export function makeRequest(options: any, data?: any): Promise<RequestResponse> {
    return new Promise<RequestResponse>((resolve, reject) => {
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
            req.write(data);
        }
        req.end();
    });
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
        path: "/supervision/api/v4/alerting/alertsbyequipments?group=PPD1R420&search=%203dgeoscisurveycstt210913&count=100&offset=0&loading=true&scrollTop=0",
    };

    const initialResponse = await makeRequest(options);
    if (initialResponse.res.statusCode === 302 && initialResponse.res.headers.location) {
        const challenge = await makeRequest(initialResponse.res.headers.location);
        console.info(challenge.data);
        return challenge.data || "";
    }

    return initialResponse.data || "";
}

export function getServiceStatus(): Promise<any> {
    // const requestArgs = new URLSearchParams({
    //     group: "PPD1R420",
    //     search: "3dgeoscisurveycstt210913",
    //     count: "100",
    // });

    const options: https.RequestOptions = {
        method: "GET",
        hostname: "eu2-supppd-realtime.3dexperience.3ds.com",
        path: "/supervision/api/v4/alerting/alertsbyequipments?group=PPD1R420&search=%203dgeoscisurveycstt210913&count=100&offset=0&loading=true&scrollTop=0",
    };

    return new Promise<any>((resolve, reject) => {
        const req = https.request(options, async (res) => {
            console.info(`statusCode: ${res.statusCode}`);

            // 302 - Need to login
            if (res.statusCode === 302) {
                console.info(`redirect: ${res.headers.location}`);
            } else {
                const buffer: string[] = [];
                res.on("data", async (d) => {
                    const rawResponse = d.toString();
                    buffer.push(rawResponse);
                });

                res.on("end", () => {
                    const data = buffer.join("");
                    console.info(data);
                    resolve(data);
                });
            }
        });
        req.on("error", (error) => {
            reject(error);
        });

        req.end();
    });
}
