/**
 * 장비 관리 모델
 * */
export interface MotiePcabState {
  contents?: MotiePcabContents;
  error?: any;
  update?: any;
  loading:boolean;
}

export interface MotiePcabContents {
  data?: Array<MotiePcabRow>;
  total_cnt?: number;
}

export interface MotiePcabRow {
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
}
