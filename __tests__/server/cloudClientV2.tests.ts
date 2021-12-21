import { CloudClientV2 } from "../../src/server/clients/cloudClientV2";

describe("Cloud Client V2 Tests", () => {
    let cloudClient: CloudClientV2;

    xit("Debug Valid test", async () => {
        cloudClient = new CloudClientV2({
            userContext: {
                username: "hq9",
                password: "XXXX",
            },
        });
        const alertData = await cloudClient.getAlertsByEquipmentsV4({
            group: "PPD1R420",
            search: "3dgeoscisurveycstt210913",
            count: 100,
            offset: 0,
        });

        expect(alertData).toBeTruthy();

        const alertData2 = await cloudClient.getAlertsByEquipmentsV4({
            group: "PPD1R420",
            search: "3dgeoscisurveycstt210913",
            count: 100,
            offset: 0,
        });
        expect(alertData2).toBeTruthy();
    });
});
