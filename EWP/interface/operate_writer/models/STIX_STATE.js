const Sequelize = require('sequelize');

module.exports = class STIX_STATE extends Sequelize.Model {
    static init(sequelize) {
        return super.init({
            flag: {
                type: Sequelize.STRING(10),
                allowNull: true,
            },
            timeAgent: {
                type: Sequelize.STRING(20),
                allowNull: true,
            },
            timezone: {
                type: Sequelize.STRING(20),
                allowNull: true,
                defaultValue: 'KST'
            },
            ipAgent: {
                type: Sequelize.STRING(10),
                allowNull: true,
                defaultValue: '',
            },
            nameAgent: {
                type: Sequelize.STRING(20),
                allowNull: true,
                defaultValue: '',
            },
            vendorAgent: {
                type: Sequelize.STRING(20),
                allowNull: true,
                defaultValue: '',
            },
            typeAgent: {
                type: Sequelize.STRING(20),
                allowNull: true,
                defaultValue: '',
            },
            versionAgent: {
                type: Sequelize.STRING(20),
                allowNull:true,
                defaultValue: '',
            },
            idOrganizationAgent: {
                type: Sequelize.STRING(20),
                allowNull: true,
            },
            nameOperator: {
                type: Sequelize.STRING(20),
                allowNull: true,
                defaultValue: '',
            },
            nameUnit: {
                type: Sequelize.STRING(10),
                allowNull: true,
                defaultValue: 'DANGJIN',
            },
            location: {
                type: Sequelize.STRING(20),
                allowNull: true,
                defaultValue: '',
            },
            original: {
                type: Sequelize.STRING(100),
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
            usageDisk: {
                type: Sequelize.STRING(20),
                allowNull: true,
            },
            tempCPU: {
                type: Sequelize.STRING(20),
                allowNull: true,
                defaultValue: '',
            },
            trans_tag: {
                type: Sequelize.STRING(20),
                allowNull: true,
                defaultValue: 'C',
            },
        }, {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'STIX_STATE',
            tableName: 'stix_state',
            paranoid: true,
            charset: 'utf8',
            collate: 'utf8_general_ci',
        });
    }
};