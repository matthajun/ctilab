/**
 * 장비 관리 모델
 * */
export interface DeviceManageState {
  contents?: DeviceManageContents;
  error?: any;
  update?: any;
  loading:boolean;
}

export interface DeviceManageContents {
  data?: Array<DeviceManageRow>;
  total_cnt?: number;
}

//자산ip의 id킷값 추가
export interface DeviceManageRow {
  id: number;
  assetId?: number;
  assetNm: string;
  stationId: string;
  powerGenId: string;
  //hostInfo: string;
  motieAssetIp: string;
  mnufcturCor: string;
  assetType: string;
  assetProtocol: string;
  assetSnNum: string;
  assetFirmwareVer: string;
  assetModelNm: string;
  assetPosition: string;
  assetHogiCode: string;
  assetHighClassCode: string;
  assetClassCode: string;
  responsibilityUser: string;
  operatorUser: string;
  operatorDeptId: string;
  acquireDate: string;
  assetUseYsno: string;
  assetMacAddr: string;
  //assetImportanceId: string;
  fstUser: string;
  lstUser: string;
  fstDttm: string;
  lstDttm: string;
  assetIp: string;
  os: string;
  state?: string;
  assetMacAddrs: string;
  assetIps: string;
  deviceMac : string;
}
