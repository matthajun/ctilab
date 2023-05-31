/**
 * 장비 목록,추가, 수정, 삭제 액션
 * @actionType MotiePcabActionTypes
 * @action MotiePcabActions
 * */
import { Action } from '@ngrx/store';
import { HttpErrorResponse } from '@angular/common/http';


export enum MotiePcabActionTypes {

  MOTIEPCAB_READ_REQUEST        = '[MOTIEPCAB] MotiePcab_Read_Request',
  MOTIEPCAB_READ_SUCCESS        = '[MOTIEPCAB] MotiePcab_Read_Success',
  MOTIEPCAB_READ_FAIL           = '[MOTIEPCAB] MotiePcab_Read_Fail',
  MOTIEPCAB_CONTENT_CLEAR           = '[MOTIEPCAB] MotiePcab_Read_Fail',

}

export class ActionMotiePcabRead implements Action {
  readonly type = MotiePcabActionTypes.MOTIEPCAB_READ_REQUEST;
  constructor(public payload:any) {}
}

export class ActionMotiePcabReadSuccess implements Action {
  readonly type = MotiePcabActionTypes.MOTIEPCAB_READ_SUCCESS;
  constructor(public payload: any) {}
}

export class ActionMotiePcabReadFail implements Action {
  readonly type = MotiePcabActionTypes.MOTIEPCAB_READ_FAIL;
  constructor(public payload: HttpErrorResponse) {}
}

export class ActionMotiePcabClear implements Action {
  readonly type = MotiePcabActionTypes.MOTIEPCAB_CONTENT_CLEAR;
  constructor() {}
}


export type MotiePcabActions =
  | ActionMotiePcabRead
  | ActionMotiePcabReadSuccess
  | ActionMotiePcabReadFail
  | ActionMotiePcabClear

  ;
