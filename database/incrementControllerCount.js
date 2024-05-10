const { ControllerStatsTable } = require('./database-models');

async function incrementControllerCount(interaction) {
    const controllerTag = await ControllerStatsTable.findOne({ where: { storedControllerId: interaction.user.id } });

    const controllerName = interaction.member.nickname ?? interaction.member.displayName;

    if (!controllerTag) {
        await ControllerStatsTable.create({
            storedControllerId: interaction.user.id,
            storedControllerCount: 1,
            storedControllerName: controllerName,
        });
    } else {
        const currentControllerCount = controllerTag.get('storedControllerCount');
        await ControllerStatsTable.update({ storedControllerCount: currentControllerCount + 1, storedControllerName: controllerName }, { where: { storedControllerId: interaction.user.id } });
    }
}

module.exports = {
    incrementControllerCount,
};