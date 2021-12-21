/**
 * Data that is contained in 'data' element from a html response
 */
export interface LoginChallengeData {
    authorizeRememberMe: boolean;
    allowRemoteLogin: boolean;
    footnoteNls: string;
    browserLocale: string;
    trackerJs: string;
    isExistingUrl: string;
    lt: string;
    compassImgUrl: string;
    captchaType: string;
    captchaClientId: string;
    i18nConfig: {
        defaultLanguage: string;
        supportedLanguages: string[];
    };
    needHelpUrl: string;
    serviceName: string;
    url: string;
    availableSN: {
        twitter: string;
    }
    needsCaptcha: boolean;
    cookieDomain: string;
    gdprEnabled: boolean;
    loginTicketUrl: string;
    liveConnectUrl: string;
    notificationMsgs: string[];
    errorMsgs: string[];
    i18nApiUrl: string;
    captchaRegister: string;
}

export interface AlertsByEquipmentData {
    total: number;
    count: number;
    equipment: Array<EquipmentServiceData | EquipmentVMServiceData>;
    position: number;
}

export interface EquipmentServiceData {
    serviceInstanceDatacenter: string;
    serviceInstanceID: string;
    type: string;
    equipmentType: string;
    servicePublicIP: string;
    serviceInstanceStateStartTime: number;
    serviceControllerID: string;
    serviceDefinitionName: string;
    serviceInstanceAdminTenantOID: string;
    serviceDefinitionVersion: string;
    serviceInstanceName: string;
    serviceInstanceState: string;
    serviceInstanceStateCheckTime: number;
    alerts: {
        alert: EquipmentAlert[];
    };
    serviceInstanceCluster: string;
    serviceControllerURI: string;
}

export interface EquipmentVMServiceData {
    vmInstanceName: string;
    serviceInstanceDatacenter: string;
    serviceInstanceID: string;
    type: string;
    equipmentType: string;
    servicePublicIP: string;
    vmInstanceNumber: number;
    vmHAMode: string;
    vmPublicIP: string;
    vmPublicDNS: string;
    vmPrivateIP: string;
    serviceInstanceStateStartTime: number;
    serviceControllerID: string;
    vmName: string;
    serviceDefinitionName: string;
    serviceInstanceAdminTenantOID: string;
    vmID: string;
    serviceDefinitionVersion: string;
    serviceInstanceName: string;
    serviceInstanceState: string;
    serviceInstanceStateCheckTime: number;
    alerts: {
        alert: EquipmentAlert[];
    };
    serviceInstanceCluster: string;
    vmIaaSID: string;
    serviceControllerURI: string;
}

export interface EquipmentAlert {
    acknowledged: boolean;
    deactivateMsg: string;
    documentationURI: string;
    deactivator: string;
    message: string;
    realState: string;
    deactivated: boolean;
    acknowledgeMsg: number;
    alertName: string;
    startTime: number;
    acknowledger: string;
    alertID: string;
    state: string;
    acknowledgeST: number;
    deactivateST: number;
}

export function isEquipmentVM(equipment: any): equipment is EquipmentVMServiceData {
    // eslint-disable-next-line @typescript-eslint/dot-notation
    return !!equipment["vmInstanceName"];
}
