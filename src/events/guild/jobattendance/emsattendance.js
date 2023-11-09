const {
    Events
} = require("discord.js");

const { google } = require("googleapis");
const fs = require("fs");
const path = require('path');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {

        function convert_duration_to_hours(durationString) {

            const hoursRegex = /(\d+) hours?/;
            const minutesRegex = /(\d+(?:\.\d+)?) minutes?/;
            const secondsRegex = /(\d+(?:\.\d+)?) seconds?/;

            let hours = 0;
            let minutes = 0;
            let seconds = 0;

            const hoursMatch = durationString.match(hoursRegex);
            if (hoursMatch) hours = parseInt(hoursMatch[1]);

            const minutesMatch = durationString.match(minutesRegex);
            if (minutesMatch) minutes = parseFloat(minutesMatch[1]);

            const secondsMatch = durationString.match(secondsRegex);
            if (secondsMatch) seconds = parseFloat(secondsMatch[1]);

            const totalHours = hours + minutes / 60 + seconds / 3600;
            return totalHours;
        }

        if (client.config.ENABLE.AUTOATTENDANCE === false) return;
        if (message.channel.id !== client.auto.ATTENDANCE.ATTCHAN) return;
        if (!message.author.bot) return;

        const attEmbed = message.embeds[0];
        if (!attEmbed) return;

        const attEmbedDesc = attEmbed.description;
        const nameRegex = /Name:\s*\*\*(.*?)\*\*/;
        const citizenidRegex = /citizenid:\s*\*\*(.*?)\*\*/;
        const durationRegex = /Shift duration:\s*\*\*__(.*?)__\*\*/;

        const nameMatch = attEmbedDesc.match(nameRegex);
        const citizenIDMatch = attEmbedDesc.match(citizenidRegex);
        const durationMatch = attEmbedDesc.match(durationRegex);

        const name = nameMatch ? nameMatch[1] : null;
        const citizenid = citizenIDMatch ? citizenIDMatch[1] : null;
        var duration = durationMatch ? durationMatch[1] : null;

        if (duration) duration = convert_duration_to_hours(duration);
        if (!name || !citizenid) return;

        //Google Sheets API
        const credentialsPath = path.resolve(__dirname, '../../../../credentials.json');
        const credentials = JSON.parse(fs.readFileSync(credentialsPath));
        const sheets = google.sheets("v4");

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        const clientAuthorized = await auth.getClient();

        const currentDate = new Date();
        const month = currentDate.toLocaleString('default', { month: 'long' });
        const sheetName = `${month} Attendance`;

        const spreadsheetId = client.auto.ATTENDANCE.SHEETID;

        const sheetsResponse = await sheets.spreadsheets.get({
            auth: clientAuthorized,
            spreadsheetId,
        });

        const sheetsList = sheetsResponse.data.sheets;
        //let sheetId = null;
        const sheetExists = sheetsList.some(sheet => sheet.properties.title === sheetName);

        if (!sheetExists) {
            //const createSheetResponse = await sheets.spreadsheets.batchUpdate({
            sheets.spreadsheets.batchUpdate({
                auth: clientAuthorized,
                spreadsheetId,
                resource: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: sheetName,
                            },
                        },
                    }],
                },
            });
            //sheetId = createSheetResponse.data.replies[0].addSheet.properties.sheetId;

            const defaultHeaders = client.auto.ATTENDANCE.HEADER;
            const defaultValues = [defaultHeaders];
            sheets.spreadsheets.values.update({
                auth: clientAuthorized,
                spreadsheetId,
                range: `${sheetName}!A1:C1`,
                valueInputOption: "RAW",
                resource: {
                    values: defaultValues,
                },
            });
        } /*else {
            const existingSheet = sheetsList.find(sheet => sheet.properties.title === sheetName);
            sheetId = existingSheet.properties.sheetId;
        }*/

        const range = `${sheetName}`;

        //Add data to the sheet
        const response = sheets.spreadsheets.values.get({
            auth: clientAuthorized,
            spreadsheetId: spreadsheetId,
            range,
        });

        const sheetValues = response.data.values;
        const existingCitizenIndex = sheetValues.findIndex(row => row[1] === citizenid);

        if (existingCitizenIndex !== -1) {
            const existingRow = sheetValues[existingCitizenIndex];

            const existingDuration = parseFloat(existingRow[2]);
            const newDuration = parseFloat(duration);
            const updatedDuration = existingDuration + newDuration;
            existingRow[2] = updatedDuration.toString();
            existingRow[0] = name;

            sheets.spreadsheets.values.update({
                auth: clientAuthorized,
                spreadsheetId: spreadsheetId,
                range: `${sheetName}!A${existingCitizenIndex + 1}:C${existingCitizenIndex + 1}`, // Use the range variable
                valueInputOption: "RAW",
                resource: {
                    values: [existingRow],
                },
            });
        } else {
            const newRow = [name, citizenid, duration];

            sheets.spreadsheets.values.append({
                auth: clientAuthorized,
                spreadsheetId: spreadsheetId,
                range,
                valueInputOption: "RAW",
                resource: {
                    values: [newRow],
                },
            });
        }
    }
};