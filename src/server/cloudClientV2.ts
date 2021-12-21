import { parse } from "node-html-parser";
import { URL } from "url";
import FormData = require("form-data");
import CloudTypes = require("./cloudTypes");
import httpsClient = require("./httpsClient");

export interface UserContext {
    username: string;
    password: string;
}

export interface LoginOptions extends UserContext {
    lt: string;
}

export interface CloudClientV2Options {
    userContext: UserContext;
}

export interface AlertsByEquipmentV4Options {
    group?: string;
    search?: string;
    count?: number;
    offset?: number;
}

export const SupervisionService = "https://eu2-supppd-realtime.3dexperience.3ds.com";

export class CloudClientV2 {
    private userContext: UserContext;

    cookies: httpsClient.CookieRecord;

    constructor(options?: Partial<CloudClientV2Options>) {
        this.cookies = {};
        this.userContext = { username: "", password: "" };
        if (options?.userContext) {
            this.setUserContext(options.userContext);
        }
    }

    setUserContext(userContext: UserContext): void {
        this.userContext = userContext;
        this.cookies = {};
    }

    async getAlertsByEquipmentsV4(options?: AlertsByEquipmentV4Options): Promise<CloudTypes.AlertsByEquipmentData> {
        const requestUrl = new URL(SupervisionService);
        requestUrl.pathname = "/supervision/api/v4/alerting/alertsbyequipments";

        if (options?.group) {
            requestUrl.searchParams.append("group", options.group);
        }

        if (options?.search) {
            requestUrl.searchParams.append("search", options.search);
        }

        if (options?.count) {
            requestUrl.searchParams.append("count", options.count.toString());
        }

        if (options?.offset) {
            requestUrl.searchParams.append("offset", options.offset.toString());
        }

        let response = await httpsClient.makeRequest({
            method: "GET",
            hostname: requestUrl.hostname,
            path: requestUrl.pathname + requestUrl.search,
            followRedirect: true,
            cookieRecord: this.cookies,
        });

        // Request successful - Return Parsed Result
        let responseContentType = response.res.headers["content-type"];
        if (responseContentType === "application/json") {
            return JSON.parse(response.data);
        }

        // Authenticate and request
        const rawChallenge = parse(response.data).querySelector("#configData")?.text;
        if (!rawChallenge) {
            throw Error("No Security Information");
        }
        const securityData: CloudTypes.LoginChallengeData = JSON.parse(rawChallenge);

        // Login and redirect
        const loginUrl = new URL(securityData.url);
        const loginFormData = new FormData();
        loginFormData.append("lt", securityData.lt);
        loginFormData.append("username", this.userContext.username);
        loginFormData.append("password", this.userContext.password);

        // // Login -> Redirect -> Redirect
        response = await httpsClient.makeRequest({
            method: "POST",
            hostname: loginUrl.hostname,
            path: loginUrl.pathname + loginUrl.search,
            followRedirect: true,
            cookieRecord: this.cookies,
        }, loginFormData);

        responseContentType = response.res.headers["content-type"];
        if (responseContentType === "application/json") {
            return JSON.parse(response.data);
        }
        throw new Error("Unknown error");
    }
}
