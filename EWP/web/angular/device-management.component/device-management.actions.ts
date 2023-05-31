/**
 * 장비 목록,추가, 수정, 삭제 액션
 * @actionType DeviceManageActionTypes
 * @action DeviceManageActions
 * */
import { Action } from '@ngrx/store';
import { HttpErrorResponse } from '@angular/common/http';


export enum DeviceManageActionTypes {
  DEVICEMANAGE_CREATE_REQUEST      = '[DEVICEMANAGE] DeviceManage_Create_Request',
  DEVICEMANAGE_CREATE_SUCCESS      = '[DEVICEMANAGE] DeviceManage_Create_Success',
  DEVICEMANAGE_CREATE_FAIL         = '[DEVICEMANAGE] DeviceManage_Create_Fail',
  DEVICEMANAGE_READ_REQUEST        = '[DEVICEMANAGE] DeviceManage_Read_Request',
  DEVICEMANAGE_UPDATE_READ_REQUEST = '[DEVICEMANAGE] DeviceManage_Update_Read_Request',
  DEVICEMANAGE_READ_SUCCESS        = '[DEVICEMANAGE] DeviceManage_Read_Success',
  DEVICEMANAGE_READ_FAIL           = '[DEVICEMANAGE] DeviceManage_Read_Fail',
  DEVICEMANAGE_UPDATE_REQUEST      = '[DEVICEMANAGE] DeviceManage_Update_Request',
  DEVICEMANAGE_UPDATE_SUCCESS      = '[DEVICEMANAGE] DeviceManage_Update_Success',
  DEVICEMANAGE_UPDATE_FAIL         = '[DEVICEMANAGE] DeviceManage_Update_Success',
  DEVICEMANAGE_DELETE_REQUEST      = '[DEVICEMANAGE] DeviceManage_Delete_Request',
  DEVICEMANAGE_DELETE_SUCCESS      = '[DEVICEMANAGE] DeviceManage_Delete_Success',
  DEVICEMANAGE_DELETE_FAIL         = '[DEVICEMANAGE] DeviceManage_Delete_Fail',
  DEVICEMANAGE_UPDATE_CLEAR        = '[DEVICEMANAGE] DeviceManage_Update_clear',
  DEVICEMANAGE_CONTENT_CLEAR       = '[DEVICEMANAGE] Content_Clear',
  DEVICEMANAGEIP_READ_REQUEST        = '[DEVICEMANAGEIP] DeviceManageIp_Read_Request',
  DEVICEMANAGEIP_READ_SUCCESS        = '[DEVICEMANAGEIP] DeviceManageIp_Read_Success',
  DEVICEMANAGEIP_READ_FAIL           = '[DEVICEMANAGEIP] DeviceManageIp_Read_Fail',
  DEVICEMANAGEIP_UPDATE_CLEAR      =    '[DEVICEMANAGEIP]  DeviceManageIp_Update_clear',
  DEVICEMANAGEIP_UPDATE_READ_REQUEST =   '[DEVICEMANAGEIP]  DeviceManageIp_Update_Read_Request',
  DEVICEMANAGEIP_CONTENT_CLEAR =   '[DEVICEMANAGEIP]  DeviceManageIp_Content_Clear',
  DEVICEMANAGEIP_UPDATE_REQUEST = '[DEVICEMANAGE] DeviceManageIp_Update_Request',
  DEVICEMANAGEIP_UPDATE_MAC_REQUEST = '[DEVICEMANAGE] DeviceManageIp_Update_Mac_Request',
  DEVICEMANAGEIP_UPDATE_SUCCESS      = '[DEVICEMANAGE] DeviceManageIp_Update_Success',
  DEVICEMANAGEIP_UPDATE_FAIL         = '[DEVICEMANAGE] DeviceManageIp_Update_Success',
  DEVICEMANAGE_FILE_UPDATE_REQUEST = '[DEVICEMANAGE] DeviceManage_File_Update_Request',
  DEVICEMANAGE_FILE_UPDATE_SUCCESS      = '[DEVICEMANAGE] DeviceManage_File_Update_Success',
  DEVICEMANAGE_FILE_UPDATE_FAIL         = '[DEVICEMANAGE] DeviceManage_File_Update_Fail',
  DEVICEMANAGE_FILE_UPDATE_CLEAR      =    '[DEVICEMANAGEIP]  DeviceManage_File_Update_clear',
}

export class ActionDeviceManageRead implements Action {
  readonly type = DeviceManageActionTypes.DEVICEMANAGE_READ_REQUEST;
  constructor(public payload:any) {}
}

export class ActionDeviceManageReadSuccess implements Action {
  readonly type = DeviceManageActionTypes.DEVICEMANAGE_READ_SUCCESS;
  constructor(public payload: any) {}
}

export class ActionDeviceManageReadFail implements Action {
  readonly type = DeviceManageActionTypes.DEVICEMANAGE_READ_FAIL;
  constructor(public payload: HttpErrorResponse) {}
}

export class ActionDeviceIpManageReadFail implements Action {
  readonly type = DeviceManageActionTypes.DEVICEMANAGEIP_READ_FAIL;
  constructor(public payload: HttpErrorResponse) {}
}

export class ActionDeviceIpManageRead implements Action {
  readonly type = DeviceManageActionTypes.DEVICEMANAGEIP_READ_REQUEST;
  constructor(public payload:any) {}
}

export class ActionDeviceIpManageReadUpdate implements Action {
  readonly type = DeviceManageActionTypes.DEVICEMANAGEIP_UPDATE_READ_REQUEST;
  constructor(public payload:any) {}
}

export class ActionDeviceIpManageUpdateClear implements Action {
  readonly type = DeviceManageActionTypes.DEVICEMANAGEIP_UPDATE_CLEAR;
  constructor() {}
}

export class ActionDeviceIpManageReadSuccess implements Action {
  readonly type = DeviceManageActionTypes.DEVICEMANAGEIP_READ_SUCCESS;
  constructor(public payload: any) {}
}

export class ActionDeviceManageReadUpdate implements Action {
  readonly type = DeviceManageActionTypes.DEVICEMANAGE_UPDATE_READ_REQUEST;
  constructor(public payload:any) {}
}

export class ActionDeviceManageCreate implements Action {
  readonly type = DeviceManageActionTypes.DEVICEMANAGE_CREATE_REQUEST;
  constructor(public payload: any) {}
}

export class ActionDeviceManageCreateSuccess implements Action {
  readonly type = DeviceManageActionTypes.DEVICEMANAGE_CREATE_SUCCESS;
  constructor(public payload: any) {}
}

export class ActionDeviceManageCreateFail implements Action {
  readonly type = DeviceManageActionTypes.DEVICEMANAGE_CREATE_FAIL;
  constructor(public payload:HttpErrorResponse) {}
}

export class ActionDeviceManageUpdate implements Action {
  readonly type = DeviceManageActionTypes.DEVICEMANAGE_UPDATE_REQUEST;
  constructor(public payload: any) {}
}

export class ActionDeviceManageUpdateSuccess implements Action {
  readonly type = DeviceManageActionTypes.DEVICEMANAGE_UPDATE_SUCCESS;
  constructor(public payload: HttpErrorResponse) {}
}

export class ActionDeviceManageUpdateFail implements Action {
  readonly type = DeviceManageActionTypes.DEVICEMANAGE_UPDATE_FAIL;
  constructor(public payload: HttpErrorResponse) {}
}

export class ActionDeviceManageDelete implements Action {
  readonly type = DeviceManageActionTypes.DEVICEMANAGE_DELETE_REQUEST;
  constructor(public payload: any) {}
}

export class ActionDeviceManageDeleteSuccess implements Action {
  readonly type = DeviceManageActionTypes.DEVICEMANAGE_DELETE_SUCCESS;
  constructor(public payload: any) {}
}

export class ActionDeviceManageDeleteFail implements Action {
  readonly type = DeviceManageActionTypes.DEVICEMANAGE_DELETE_FAIL;
  constructor(public payload: HttpErrorResponse) {}
}

export class ActionDeviceManageUpdateClear implements Action {
  readonly type = DeviceManageActionTypes.DEVICEMANAGE_UPDATE_CLEAR;
  constructor() {}
}

export class ActionDeviceManageClear implements Action {
  readonly type = DeviceManageActionTypes.DEVICEMANAGE_CONTENT_CLEAR;
  constructor() {}
}

export class ActionDeviceIpManageClear implements Action {
  readonly type = DeviceManageActionTypes.DEVICEMANAGEIP_CONTENT_CLEAR;
  constructor() {}
}

export class ActionDeviceIpManageUpdate implements Action {
  readonly type = DeviceManageActionTypes.DEVICEMANAGEIP_UPDATE_REQUEST;
  constructor(public payload: any) {}
}

export class ActionDeviceIpManageUpdateMac implements Action {
      readonly type = DeviceManageActionTypes.DEVICEMANAGEIP_UPDATE_MAC_REQUEST;
      constructor(public payload: any) {}
}

export class ActionDeviceIpManageUpdateSuccess implements Action {
  readonly type = DeviceManageActionTypes.DEVICEMANAGEIP_UPDATE_SUCCESS;
  constructor(public payload: any) {}
}

export class ActionDeviceIpManageUpdateFail implements Action {
  readonly type = DeviceManageActionTypes.DEVICEMANAGEIP_UPDATE_FAIL;
  constructor(public payload: HttpErrorResponse) {}
}

export class ActionDeviceManageFileUpload implements Action {
  readonly type = DeviceManageActionTypes.DEVICEMANAGE_FILE_UPDATE_REQUEST;
  constructor(public payload: any) {}
}

export class ActionDeviceManageFileUploadSuccess implements Action {
  readonly type = DeviceManageActionTypes.DEVICEMANAGE_FILE_UPDATE_SUCCESS;
  constructor(public payload: any) {}
}

export class ActionDeviceManageFileUploadFail implements Action {
  readonly type = DeviceManageActionTypes.DEVICEMANAGE_FILE_UPDATE_FAIL;
  constructor(public payload: HttpErrorResponse) {}
}

export class ActionDeviceManageFileUploadClear implements Action {
  readonly type = DeviceManageActionTypes.DEVICEMANAGE_FILE_UPDATE_CLEAR;
  constructor() {}
}





export type DeviceManageActions =
  | ActionDeviceManageRead
  | ActionDeviceManageReadSuccess
  | ActionDeviceManageReadFail
  | ActionDeviceManageReadUpdate
  | ActionDeviceManageCreate
  | ActionDeviceManageUpdate
  | ActionDeviceManageUpdateSuccess
  | ActionDeviceManageUpdateFail
  | ActionDeviceManageCreateSuccess
  | ActionDeviceManageCreateFail
  | ActionDeviceManageDelete
  | ActionDeviceManageDeleteSuccess
  | ActionDeviceManageDeleteFail
  | ActionDeviceManageUpdateClear
  | ActionDeviceManageClear
  | ActionDeviceIpManageRead
  | ActionDeviceIpManageReadSuccess
  | ActionDeviceIpManageReadFail
  | ActionDeviceIpManageUpdateClear
  | ActionDeviceIpManageReadUpdate
  | ActionDeviceIpManageClear
  | ActionDeviceIpManageUpdate
  | ActionDeviceIpManageUpdateMac
  | ActionDeviceIpManageUpdateSuccess
  | ActionDeviceIpManageUpdateFail
  | ActionDeviceManageFileUpload
  | ActionDeviceManageFileUploadSuccess
  | ActionDeviceManageFileUploadFail
  | ActionDeviceManageFileUploadClear
  ;
