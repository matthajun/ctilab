const Sequelize = require('sequelize');

module.exports = class KDN_MANAG_I003_DISK_INFO extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            message_id: {
                type: Sequelize.STRING(10),
                allowNull: false,
                defaultValue: 'I003',
            },
            operate_info_id: {
                type: Sequelize.STRING(20),
                allowNull: false,
            },
            send_time: {
                type: Sequelize.STRING(20),
                allowNull: true,
            },
            partition_name: {
                type: Sequelize.STRING(20),
                allowNull: true,
            },
            total_size: {
                type: Sequelize.STRING(20),
                allowNull: true,
            },
            use_size: {
                type: Sequelize.STRING(20),
                allowNull: true,
            },
            free_size: {
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
        }, {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'KDN_MANAG_I003_DISK_INFO',
            tableName: 'kdn_manag_I003_disk_info',
            paranoid: true,
            charset: 'utf8',
            collate: 'utf8_general_ci',
        });
    }
};
