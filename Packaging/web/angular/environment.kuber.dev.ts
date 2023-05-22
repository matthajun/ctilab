const packageJson = require('../../package.json');

export const environment = {
    appName: 'DTI Closed Alpha',
    appFullName: 'DTI.ai',
    copyright: 'CTILab Co., Ltd',
    envName: 'K8s Dev',
    production: true,
    hmr: false,
    apiUrl: 'https://localhost',
    apiPort: 3003,
    versions: {
        app: packageJson.version,
        angular: packageJson.dependencies['@angular/core'],
        ngrx: packageJson.dependencies['@ngrx/store'],
        material: packageJson.dependencies['@angular/material'],
        bootstrap: packageJson.dependencies.bootstrap,
        rxjs: packageJson.dependencies.rxjs,
        angularCli: packageJson.devDependencies['@angular/cli'],
        typescript: packageJson.devDependencies['typescript']
    },
    showBugReportButton: true,
    NodeServer: true
};
