import express = require("express");
import { CloudClientV2 } from "./clients/cloudClientV2";

const app = express();
const cloudClient = new CloudClientV2({
    userContext: {
        username: "hq9",
        password: "---",
    },
});

const getAlerts = async () => cloudClient.getAlertsByEquipmentsV4({
    group: "PPD1R420",
    search: "3dgeoscisurveycstt210913",
    count: 100,
    offset: 0,
});

app.get("/", async (req, res) => {
    console.info(`Getting Alerts`);
    const alerts = await getAlerts();
    res.send(JSON.stringify(alerts || {}, null, 2));
});

app.listen(8081, () => {
    console.log(`Server started`);
});
