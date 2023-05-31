/**
 * 장비 관리 이펙트
 * @class DeviceManageEffects
 * */
import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import {
  map,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError
} from 'rxjs/operators';
import {
  ActionDeviceManageDeleteSuccess,
  ActionDeviceManageDeleteFail,
  ActionDeviceManageUpdateSuccess,
  ActionDeviceManageUpdateFail,
  ActionDeviceManageCreateSuccess,
  ActionDeviceManageCreateFail,
  ActionDeviceManageReadSuccess,
  ActionDeviceManageReadFail,
  DeviceManageActionTypes,
  ActionDeviceIpManageReadSuccess,
  ActionDeviceIpManageReadFail,
  ActionDeviceIpManageUpdateSuccess,
  ActionDeviceIpManageUpdateFail,
  ActionDeviceManageFileUploadSuccess, ActionDeviceManageFileUploadFail
} from './device-management.actions';
import { ApiService } from '../../../core/service/commons';
import { ActionHttpErrorMessage, ActionSuccessMessage } from '../../../core/service/messages.reducer';

@Injectable()
export class DeviceManageEffects {
  constructor(
    private actions$: Actions<Action>,
    private api: ApiService
  ){ }

  /**
   * 장비 추가
   * @function addContent$
   * @params name, description
   * */
  @Effect()
  addContent$(): Observable<Action> {
    return this.actions$.ofType(DeviceManageActionTypes.DEVICEMANAGE_CREATE_REQUEST).pipe(
      distinctUntilChanged(),
      debounceTime(500),
      switchMap((action: any) =>
        this.api.API('post', '/MotieAssets/createMotieAsset' , {params: action.payload}).pipe(
          switchMap(res => [
            new ActionDeviceManageCreateSuccess(res),
            new ActionSuccessMessage({message:'자산 추가 완료!', title:'자산 추가 완료!'})
          ]),
          catchError(err => of(new ActionDeviceManageCreateFail(err), new ActionHttpErrorMessage(err)))
        )
      )
    )
  };

  /**
   * 장비 수정
   * @function updateContent$
   * @params name, description
   * */
  @Effect()
  updateContent$(): Observable<Action> {
    return this.actions$.ofType(DeviceManageActionTypes.DEVICEMANAGE_UPDATE_REQUEST).pipe(
      distinctUntilChanged(),
      debounceTime(500),
      switchMap((action: any) =>
        this.api.API('patch', '/MotieAssets/updateMotieAsset' , {params: action.payload}).pipe(
          switchMap(res => [
            new ActionDeviceManageUpdateSuccess(res),
            new ActionSuccessMessage({message:'자산 수정 완료!', title:'자산 수정 완료!'})
          ]),
          catchError(err => of(new ActionDeviceManageUpdateFail(err), new ActionHttpErrorMessage(err)))
        )
      )
    )
  };

  /**
   * 장비 삭제
   * @function deleteContent$
   * @params id
   * */
  @Effect()
  deleteContent$(): Observable<Action> {
    return this.actions$.ofType(DeviceManageActionTypes.DEVICEMANAGE_DELETE_REQUEST).pipe(
      distinctUntilChanged(),
      debounceTime(500),
      switchMap((action:any) =>
        this.api.API('patch', '/MotieAssets/deleteMotieAsset' , {param: action.payload}).pipe(
          switchMap(res => [
            new ActionDeviceManageDeleteSuccess(res),
            new ActionSuccessMessage({message:'장비 삭제가 완료되었습니다.', title:'장비 삭제 완료!'})
          ]),
          catchError(err => of(new ActionDeviceManageDeleteFail(err), new ActionHttpErrorMessage(err)))
        )
      )
    )
  };

  /**
   * 장비 읽기
   * @function getContent$
   * @params filter {"something":"value"}
   * */
  @Effect()
  getContent$(): Observable<Action> {
    return this.actions$.ofType(DeviceManageActionTypes.DEVICEMANAGE_READ_REQUEST).pipe(
      distinctUntilChanged(),
      debounceTime(500),
      switchMap((action:any) =>
        this.api.API('get', '/MotieAssets', action.payload).pipe(
          map(res => new ActionDeviceManageReadSuccess(res)),
          catchError(err => of(new ActionDeviceManageReadFail(err), new ActionHttpErrorMessage(err)))
        )
      )
    )
  };

  /**
   * 장비 읽기
   * @function getRow$
   * @params filter {"something":"value"}
   * */
  @Effect()
  getRow$(): Observable<Action> {
    return this.actions$.ofType(DeviceManageActionTypes.DEVICEMANAGE_UPDATE_READ_REQUEST).pipe(
      distinctUntilChanged(),
      debounceTime(500),
      switchMap((action:any) =>
        this.api.API('get', '/MotieAssets', action.payload).pipe(
          map(res => new ActionDeviceManageReadSuccess(res)),
          catchError(err => of(new ActionDeviceManageReadFail(err), new ActionHttpErrorMessage(err)))
        )
      )
    )
  };

  /**
   * 자산 일괄 등록(파일 임폴트)
   * @function updateFile$
   * @params name, description
   * */
  @Effect()
  updateFile$(): Observable<Action> {
    return this.actions$.ofType(DeviceManageActionTypes.DEVICEMANAGE_FILE_UPDATE_REQUEST).pipe(
      distinctUntilChanged(),
      debounceTime(500),
      switchMap((action: any) =>
        this.api.API('post', '/MotieAssets/createMotieAssetExcel' , {params: action.payload}).pipe(
          switchMap(res => [
            new ActionDeviceManageFileUploadSuccess(res),
            new ActionSuccessMessage({message:'자산 일관등록이 완료되었습니다.', title:'자산 일괄 등록 완료'})
          ]),
          catchError(err => of(new ActionDeviceManageFileUploadFail(err), new ActionHttpErrorMessage(err)))
        )
      )
    )
  };

  /**
   * 장비 ip 읽기
   * @function getRow$
   * @params filter {"something":"value"}
   * */
  @Effect()
  getIpRow$(): Observable<Action> {
    return this.actions$.ofType(DeviceManageActionTypes.DEVICEMANAGEIP_UPDATE_READ_REQUEST).pipe(
      distinctUntilChanged(),
      debounceTime(500),
      switchMap((action:any) =>
        this.api.API('get', '/MotieAssetIps', action.payload).pipe(
          map(res => new ActionDeviceIpManageReadSuccess(res)),
          catchError(err => of(new ActionDeviceIpManageReadFail(err), new ActionHttpErrorMessage(err)))
        )
      )
    )
  };

  /**
   * 장비 읽기
   * @function getContent$
      * @params filter {"something":"value"}
  * */
  @Effect()
    getIpContent$(): Observable<Action> {
      return this.actions$.ofType(DeviceManageActionTypes.DEVICEMANAGEIP_READ_REQUEST).pipe(
        distinctUntilChanged(),
        debounceTime(500),
        switchMap((action:any) =>
          this.api.API('get', '/MotieAssetIps', action.payload).pipe(
            map(res =>{ return new ActionDeviceIpManageReadSuccess(res);}),
            catchError(err => of(new ActionDeviceIpManageReadFail(err), new ActionHttpErrorMessage(err)))
          )
        )
      )
  };

  /**
   * 장비 IP 수정
   * @function updateContent$
   * @params name, description
   * */
  @Effect()
  updateIpContent$(): Observable<Action> {
    return this.actions$.ofType(DeviceManageActionTypes.DEVICEMANAGEIP_UPDATE_REQUEST).pipe(
      distinctUntilChanged(),
      debounceTime(500),
      switchMap((action: any) =>
        this.api.API('patch', '/MotieAssetIps/updateMotieAssetIp' , {params: action.payload}).pipe(
          switchMap(res => [
            new ActionDeviceIpManageUpdateSuccess(res),
            new ActionSuccessMessage({message:'자산ip 맵핑 완료!', title:'자산ip 맵핑 완료!'})
          ]),
          catchError(err => of(new ActionDeviceIpManageUpdateFail(err), new ActionHttpErrorMessage(err)))
        )
      )
    )
  };

  /**
   * 장비 IP 수정
   * @function updateContent$
   * @params name, description
   * */
  @Effect()
  updateIpMacContent$(): Observable<Action> {
      return this.actions$.ofType(DeviceManageActionTypes.DEVICEMANAGEIP_UPDATE_MAC_REQUEST).pipe(
        distinctUntilChanged(),
        debounceTime(500),
        switchMap((action: any) =>
          this.api.API('patch', '/MotieAssetIps/updateMotieAssetIpMac' , {params: action.payload}).pipe(
            switchMap(res => [
              new ActionDeviceIpManageUpdateSuccess(res),
              new ActionSuccessMessage({message:'IP/Mac 수정 완료!', title:'IP/Mac 수정 완료!'})
            ]),
          catchError(err => of(new ActionDeviceIpManageUpdateFail(err), new ActionHttpErrorMessage(err)))
        )
      )
    )
  };
}
