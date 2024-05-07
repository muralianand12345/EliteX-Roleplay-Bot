const {
    Events
} = require('discord.js');

const tileWarModal = require('../../database/modals/tileWar.js');

async function autoDeleteWarReq(data, deleteTimeMinutes) {
    for (let i = 0; i < data.length; i++) {

        const wars = data[i].currenlyWar;

        for (let j = 0; j < wars.length; j++) {
            const war = wars[j];

            const warRequestedDate = new Date(war.warRequestedDate);
            const currentDate = new Date();
            const diffTime = Math.abs(currentDate - warRequestedDate);
            const diffMinutes = Math.ceil(diffTime / (1000 * 60));

            if (diffMinutes >= deleteTimeMinutes) {
                await tileWarModal.findOneAndUpdate({
                    'currenlyWar.warRequestedDate': war.warRequestedDate
                }, {
                    $pull: {
                        currenlyWar: {
                            warRequestedDate: war.warRequestedDate
                        }
                    }
                }); 
            }
        }
    }
}

module.exports = {
    name: Events.ClientReady,
    async execute(client) {

        const warReq = await tileWarModal.find({ 'currenlyWar.waractive': false, 'currenlyWar.pannelID': 'Still Pending' });

        if (warReq.length > 0) {

            const deleteTimeMinutes = client.config.dark.war.timer_days * 24 * 60;
            if (!deleteTimeMinutes) return;
            await autoDeleteWarReq(warReq, deleteTimeMinutes);
            setInterval(async () => {
                await autoDeleteWarReq(warReq, deleteTimeMinutes);
            }, 1000 * 60 * deleteTimeMinutes);
        }
    }
}