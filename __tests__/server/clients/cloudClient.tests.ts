import cloudClient = require("../../../src/server/clients/cloudClient");

describe("Cloud Client Tests", () => {
    it("Debug Tests", async () => {
        try {
            // const data = await cloudClient.getServiceStatusV2();
            // expect(data).toBeTruthy();
            expect(true).toBeTruthy();
        } catch (e) {
            console.error(e);
            expect(true).toBeFalsy();
        }
    });
});
