import cloudClient = require("../../src/server/cloudClient");

describe("Cloud Client Tests", () => {
    it("Debug Tests", async () => {
        try {
            const data = await cloudClient.getServiceStatus();
            expect(data).toBeTruthy();
        } catch (e) {
            console.error(e);
            expect(true).toBeFalsy();
        }
    });
});
