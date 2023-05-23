const Sequelize = require('sequelize');

module.exports = class KDN_MANAG_I003 extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            message_id: {
                type: Sequelize.STRING(10),
                allowNull: false,
                defaultValue: 'I003',
            },
            operate_info_id: {
                type: Sequelize.STRING(20),
                allowNull: true,
            },
            send_time: {
                type: Sequelize.STRING(20),
                allowNull: true,
            },
            usageCPU: {
                type: Sequelize.STRING(20),
                allowNull: true,
            },
            usageMemory: {
                type: Sequelize.STRING(20),
                allowNull: true,
            },
            Memory_capacity: {
                type: Sequelize.STRING(20),
                allowNull: true,
            },
            usageDisk: {
                type: Sequelize.STRING(20),
                allowNull: true,
            },
            date_time: {
                type: Sequelize.STRING(30),
                allowNull: true,
            },
            trans_tag: {
                type: Sequelize.STRING(10),
                allowNull: false,
                defaultValue: 'C',
            },
            trans_tag_s: {
                type: Sequelize.STRING(10),
                allowNull: false,
                defaultValue: 'C',
            },
        }, {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'KDN_MANAG_I003',
            tableName: 'kdn_manag_I003',
            paranoid: true,
            charset: 'utf8',
            collate: 'utf8_general_ci',
        });
    }
};
