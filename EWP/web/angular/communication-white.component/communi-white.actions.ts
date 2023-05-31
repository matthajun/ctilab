import { Action } from '@ngrx/store';
import { HttpErrorResponse } from '@angular/common/http';
import { CommuniWhiteRow } from './communi-white.model';
import {
  ActionLogSystemCreate, ActionLogSystemCreateFail,
  ActionLogSystemCreateSuccess,
  LogSystemActionTypes
} from "@app/detection/log_system/log_system.actions";


export enum CommuniWhiteActionTypes {
  COMMUNI_WHITE_CREATE_REQUEST   = '[COMMUNI_WHITE] Communi_White_Create_Request',
  COMMUNI_WHITE_CREATE_SUCCESS   = '[COMMUNI_WHITE] Communi_White_Create_Success',
  COMMUNI_WHITE_CREATE_FAIL      = '[COMMUNI_WHITE] Communi_White_Create_Fail',
  COMMUNI_WHITE_READ_REQUEST         = '[COMMUNI_WHITE] White_List_Read_Request',
  COMMUNI_WHITE_READ_SUCCESS         = '[COMMUNI_WHITE] White_List_Read_Success',
  COMMUNI_WHITE_READ_FAIL            = '[COMMUNI_WHITE] White_List_Read_Fail',
  COMMUNI_WHITE_UPDATE_REQUEST = '[COMMUNI_WHITE] Communi_White_Update_Request',
  COMMUNI_WHITE_UPDATE_SUCCESS = '[COMMUNI_WHITE] Communi_White_Update_Success',
  COMMUNI_WHITE_UPDATE_FAIL    = '[COMMUNI_WHITE] Communi_White_Update_Fail',
  COMMUNI_WHITE_UPDATE_CLEAR   = '[COMMUNI_WHITE] Communi_White_Update_Clear',
  COMMUNI_WHITE_CONTENT_CLEAR       = '[COMMUNI_WHITE] Content_Clear',
  COMMUNI_WHITE_DELETE_REQUEST = '[COMMUNI_WHITE] Communi_White_Delete_Request',
  COMMUNI_WHITE_DELETE_SUCCESS = '[COMMUNI_WHITE] Communi_White_Delete_Success',
  COMMUNI_WHITE_DELETE_FAIL = '[COMMUNI_WHITE] Communi_White_Delete_Fail'
}


export class ActionCommuniWhiteRead implements Action {
  readonly type = CommuniWhiteActionTypes.COMMUNI_WHITE_READ_REQUEST;
  constructor(public payload: any) {}
}

export class ActionCommuniWhiteReadSuccess implements Action {
  readonly type = CommuniWhiteActionTypes.COMMUNI_WHITE_READ_SUCCESS;
  constructor(public payload: any) {}
}

export class ActionCommuniWhiteReadFail implements Action {
  readonly type = CommuniWhiteActionTypes.COMMUNI_WHITE_READ_FAIL;
  constructor(public payload: HttpErrorResponse) {}
}

export class ActionCommuniWhiteCreate implements Action {
  readonly type = CommuniWhiteActionTypes.COMMUNI_WHITE_CREATE_REQUEST;
  constructor(public payload:any) {}
}

export class ActionCommuniWhiteCreateSuccess implements Action {
  readonly type = CommuniWhiteActionTypes.COMMUNI_WHITE_CREATE_SUCCESS;
  constructor(public payload: any) {}
}

export class ActionCommuniWhiteCreateFail implements Action {
  readonly type = CommuniWhiteActionTypes.COMMUNI_WHITE_CREATE_FAIL;
  constructor(public payload: HttpErrorResponse) {}
}


export class ActionCommuniWhiteUpdate implements Action {
  readonly type = CommuniWhiteActionTypes.COMMUNI_WHITE_UPDATE_REQUEST;
  constructor(public payload: CommuniWhiteRow) {}
}

export class ActionCommuniWhiteUpdateSuccess implements Action {
  readonly type = CommuniWhiteActionTypes.COMMUNI_WHITE_UPDATE_SUCCESS;
  constructor(public payload: any) {}
}

export class ActionCommuniWhiteUpdateFail implements Action {
  readonly type = CommuniWhiteActionTypes.COMMUNI_WHITE_UPDATE_FAIL;
  constructor(public payload: HttpErrorResponse) {}
}

export class ActionCommuniWhiteUpdateClear implements Action {
  readonly type = CommuniWhiteActionTypes.COMMUNI_WHITE_UPDATE_CLEAR;
  constructor() {}
}

export class ActionBlackListClear implements Action {
  readonly type = CommuniWhiteActionTypes.COMMUNI_WHITE_CONTENT_CLEAR;
  constructor() {}
}
export class ActionCommuniWhiteDelete implements Action {
  readonly type = CommuniWhiteActionTypes.COMMUNI_WHITE_DELETE_REQUEST;
  constructor(public payload: any) {}
}

export class ActionCommuniWhiteDeleteSuccess implements Action {
  readonly type = CommuniWhiteActionTypes.COMMUNI_WHITE_DELETE_SUCCESS;
  constructor(public payload: any) {}
}

export class ActionCommuniWhiteDeleteFail implements Action {
  readonly type = CommuniWhiteActionTypes.COMMUNI_WHITE_DELETE_FAIL;
  constructor(public payload: HttpErrorResponse) {}
}


export type CommuniWhiteActions =

  | ActionCommuniWhiteDelete
  | ActionCommuniWhiteDeleteSuccess
  | ActionCommuniWhiteDeleteFail
  | ActionCommuniWhiteRead
  | ActionCommuniWhiteReadSuccess
  | ActionCommuniWhiteReadFail
  | ActionCommuniWhiteCreate
  | ActionCommuniWhiteCreateSuccess
  | ActionCommuniWhiteCreateFail
  | ActionCommuniWhiteUpdate
  | ActionCommuniWhiteUpdateSuccess
  | ActionCommuniWhiteUpdateFail
  | ActionCommuniWhiteUpdateClear
  | ActionBlackListClear;
