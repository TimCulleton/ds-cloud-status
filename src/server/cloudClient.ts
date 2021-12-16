import https = require("https");

// Get Ticket
// const passport = "https://eu1-dsi-iam.3dexperience.3ds.com/3DPassport/login?action=get_auth_params";
// https://eu2-supppd-realtime.3dexperience.3ds.com/supervision/api/v4/alerting/alertsbyequipments?group=PPD1R420&search=%203dgeoscisurveycstt210913&count=100&offset=0&loading=true&scrollTop=0

export function getServiceStatus(): Promise<any> {
    const requestArgs = new URLSearchParams({
        group: "PPD1R420",
        search: "%203dgeoscisurveycstt210913",
        count: "100",
    });

    const options: https.RequestOptions = {
        hostname: "eu1-dsi-iam.3dexperience.3ds.com",
        path: `/supervision/api/v4/alerting/alertsbyequipments?${requestArgs.toString()}`,
    };

    return new Promise<any>((resolve, reject) => {
        const req = https.request(options, (res) => {
            console.info(`statusCode: ${res.statusCode}`);

            res.on("data", (d) => {
                const rawResponse = d.toString();
                resolve(rawResponse);
            });
        });
        req.on("error", (error) => {
            reject(error);
        });

        req.end();
    });
}
