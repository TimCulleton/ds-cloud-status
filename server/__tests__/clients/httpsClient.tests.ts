import { ClientRequest, IncomingMessage } from "http";
import https = require("https");
import FormData = require("form-data");
import httpsClient = require("../../src/clients/httpsClient");

describe("httpsClient Tests", () => {
    it(`Process Cookies - Response Containing Cookies`, () => {
        const mockResponse: Partial<IncomingMessage> = {
            headers: {
                "set-cookie": [
                    "JSESSIONID=1ED1B62777D3F55C45245DC0F1C31E51; Path=/; Secure; HttpOnly; SameSite=None",
                    "afs=faa36cd5-319d-4ec2-8fb7-2e3e4261cb0e; Expires=Thu, 30-Oct-2031 00:08:44 GMT; Path=/; Secure; HttpOnly; SameSite=None",
                    "SERVERID=PASSPORT_HttpdTomcatServer_3; path=/; HttpOnly; Secure; SameSite=None",
                ],
            },
        };

        const options: httpsClient.ProcessCookieOptions = {
            hostName: "google.com",
            response: mockResponse as IncomingMessage,
            cookieRecord: {},
        };
        httpsClient.processCookies(options);

        const record = options.cookieRecord["google.com"];
        const cookies = Object.keys(record);
        expect(cookies.length).toBe(3);
        expect(cookies[0]).toBe("JSESSIONID=1ED1B62777D3F55C45245DC0F1C31E51");
        expect(cookies[1]).toBe("afs=faa36cd5-319d-4ec2-8fb7-2e3e4261cb0e");
        expect(cookies[2]).toBe("SERVERID=PASSPORT_HttpdTomcatServer_3");
    });

    it(`Process Cookies - Response No Cookies`, () => {
        const mockResponse: Partial<IncomingMessage> = {
            headers: {
            },
        };

        const options: httpsClient.ProcessCookieOptions = {
            hostName: "google.com",
            response: mockResponse as IncomingMessage,
            cookieRecord: {},
        };
        httpsClient.processCookies(options);

        const record = options.cookieRecord["google.com"];
        expect(record).toBeFalsy();
    });

    it(`Get Cookies From Response - Cookies`, () => {
        const mockResponse: Partial<IncomingMessage> = {
            headers: {
                "set-cookie": [
                    "JSESSIONID=1ED1B62777D3F55C45245DC0F1C31E51; Path=/; Secure; HttpOnly; SameSite=None",
                    "afs=faa36cd5-319d-4ec2-8fb7-2e3e4261cb0e; Expires=Thu, 30-Oct-2031 00:08:44 GMT; Path=/; Secure; HttpOnly; SameSite=None",
                    "SERVERID=PASSPORT_HttpdTomcatServer_3; path=/; HttpOnly; Secure; SameSite=None",
                ],
            },
        };
        const cookies = httpsClient.getCookiesFromResponse(mockResponse as IncomingMessage);
        expect(cookies.length).toBe(3);
        expect(cookies[0]).toBe("JSESSIONID=1ED1B62777D3F55C45245DC0F1C31E51");
        expect(cookies[1]).toBe("afs=faa36cd5-319d-4ec2-8fb7-2e3e4261cb0e");
        expect(cookies[2]).toBe("SERVERID=PASSPORT_HttpdTomcatServer_3");
    });

    it(`Get Cookies From Response - No Cookies`, () => {
        const mockResponse: Partial<IncomingMessage> = {
            headers: {
            },
        };
        const cookies = httpsClient.getCookiesFromResponse(mockResponse as IncomingMessage);
        expect(cookies.length).toBeFalsy();
    });

    it(`Initialize Request Options - URL`, () => {
        const url = `https://eu1-dsi-iam.3dexperience.3ds.com/3DPassport/login?service=https://eu2-supppd-realtime.3dexperience.3ds.com/react/`;

        let requestOptions: httpsClient.MakeRequestOptions = {
            url,
        };
        requestOptions = httpsClient.initializeRequestOptions(requestOptions);
        expect(requestOptions.hostname).toBe("eu1-dsi-iam.3dexperience.3ds.com");
        expect(requestOptions.path).toBe("/3DPassport/login?service=https://eu2-supppd-realtime.3dexperience.3ds.com/react/");
    });

    it(`Initialize Request Options - Form Data Headers`, () => {
        const formData = new FormData();
        formData.append("test", "abc");
        formData.append("unitTests", "32");

        let requestOptions: httpsClient.MakeRequestOptions = {};
        requestOptions = httpsClient.initializeRequestOptions(requestOptions, formData);
        expect(requestOptions.headers).toBeTruthy();
    });

    it(`Initialize Request Options - Cookies`, () => {
        const cookieRecord = {
            "eu1-dsi-iam.3dexperience.3ds.com": {
                "JSESSIONID=X": true,
                "afs=faa36cd5": true,
                "SERVERID=PASSPORT": true,
            },
        };

        const requestOptions: httpsClient.MakeRequestOptions = {
            hostname: "eu1-dsi-iam.3dexperience.3ds.com",
            cookieRecord,
        };
        httpsClient.initializeRequestOptions(requestOptions);
        expect(requestOptions.headers).toBeTruthy();
        expect(requestOptions?.headers?.Cookie).toBe([
            "JSESSIONID=X",
            "afs=faa36cd5",
            "SERVERID=PASSPORT",
        ].join(";"));
    });

    it(`Request - Get 200`, async () => {
        let onDataCallback: (chunk: any) => void;
        let onEndCallback: () => void;
        const mockResponse: Partial<IncomingMessage> = {
            on: (event, callback) => {
                if (event === "data") {
                    onDataCallback = callback;
                } else if (event === "end") {
                    onEndCallback = callback as any;
                }

                return undefined as any;
            },
            statusCode: 200,
            headers: {},
        };

        let onErrorCallback: (e: any) => void = undefined as any;
        const mockRequest: Partial<ClientRequest> = {
            on: (e, callback) => {
                if (e === "error") {
                    onErrorCallback = callback as any;
                }
                return undefined as any;
            },

            end: () => undefined,
        };

        let requestOptions: httpsClient.MakeRequestOptions = undefined as any;
        const spyHttpsRequest = jest.spyOn(https, "request").mockImplementation((options: any, callback: any) => {
            requestOptions = options;
            callback(mockResponse);
            return mockRequest as any;
        });
        const spyEnd = jest.spyOn(mockRequest, "end");

        const makeRequestOptions: httpsClient.MakeRequestOptions = {
            method: "GET",
            hostname: "eu1-dsi-iam.3dexperience.3ds.com",
            path: "/3DPassport/login?service=https://eu2-supppd-realtime.3dexperience.3ds.com",
        };

        const makeRequestAndWait = () => {
            const requestPromise = httpsClient.makeRequest(makeRequestOptions);
            onDataCallback("Test");
            onEndCallback();
            return requestPromise;
        };

        const responseData = await makeRequestAndWait();
        expect(spyHttpsRequest).toHaveBeenCalled();
        expect(requestOptions).toBe(makeRequestOptions);
        expect(spyEnd).toHaveBeenCalled();
        expect(onErrorCallback).toBeTruthy();

        expect(responseData.res).toBe(mockResponse);
        expect(responseData.data).toBe("Test");
        expect(responseData.cookies).toBeTruthy();
    });
});
