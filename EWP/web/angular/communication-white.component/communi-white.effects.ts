/**
 * 통신 기반 화이트 목록,추가, 수정, 삭제 이펙트
 * @class CommuniWhiteEffects
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
  CommuniWhiteActionTypes,
  ActionCommuniWhiteDeleteSuccess,
  ActionCommuniWhiteDeleteFail,
  ActionCommuniWhiteReadSuccess,
  ActionCommuniWhiteReadFail,
  ActionCommuniWhiteUpdateSuccess,
  ActionCommuniWhiteUpdateFail, ActionCommuniWhiteCreateSuccess, ActionCommuniWhiteCreateFail
} from './communi-white.actions';
import { CommuniWhiteService } from './communi-white.service';
import { ActionHttpErrorMessage, ActionSuccessMessage } from '../../core/service/messages.reducer';
import {
  ActionLogSystemCreateFail,
  ActionLogSystemCreateSuccess,
  ActionLogSystemDeleteFail,
  ActionLogSystemDeleteSuccess,
  ActionLogSystemUpdateFail,
  ActionLogSystemUpdateSuccess,
  LogSystemActionTypes
} from "@app/detection/log_system/log_system.actions";
// import { ApiService } from "../../core/service/commons";


@Injectable()
export class CommuniWhiteEffects {
  constructor(
    private actions$: Actions<Action>,
    private service: CommuniWhiteService,
  ){ }


  @Effect()
  getContent$(): Observable<Action> {
  // getBlackList$(): Observable<Action> {
    return this.actions$.ofType(CommuniWhiteActionTypes.COMMUNI_WHITE_READ_REQUEST).pipe(
      distinctUntilChanged(),
      debounceTime(500),
      switchMap((action:any) => this.service.read(action.payload).pipe(
        map(res => new ActionCommuniWhiteReadSuccess(res)),
        catchError(err => of(new ActionCommuniWhiteReadFail(err), new ActionHttpErrorMessage(err)))
        )
      )
    )
  };

  /*
 * Create Effect
 * */
  @Effect()
  addContent$(): Observable<Action> {
    return this.actions$.ofType(CommuniWhiteActionTypes.COMMUNI_WHITE_CREATE_REQUEST).pipe(
      distinctUntilChanged(),
      debounceTime(500),
      switchMap((action:any) => this.service.register(action.payload).pipe(
        switchMap(res => [
          new ActionCommuniWhiteCreateSuccess(res),
          new ActionSuccessMessage({message:'통신 기반 화이트 리스트 추가 완료 되었습니다.', title:'통신 기반 화이트 리스트 추가 완료'})
        ]),
        catchError(err => of(new ActionCommuniWhiteCreateFail(err), new ActionHttpErrorMessage(err))
        )
        )
      ))
  };

  /*
 * Delete Effect
 * */
  @Effect()
  deleteContent$(): Observable<Action> {
    return this.actions$.ofType(CommuniWhiteActionTypes.COMMUNI_WHITE_DELETE_REQUEST).pipe(
      distinctUntilChanged(),
      debounceTime(500),
      switchMap((action:any) => this.service.delete(action.payload).pipe(
        switchMap(res => [
          new ActionCommuniWhiteDeleteSuccess(res),
          new ActionSuccessMessage({message:'통신 기반 화이트 리스트 삭제가 완료 되었습니다,', title:'통신 기반 화이트 리스트 삭제완료'})
        ]),
        catchError(err => of(new ActionCommuniWhiteDeleteFail(err), new ActionHttpErrorMessage(err))
        )
        )
      ))
  };

  @Effect()
  updateLogSystem$(): Observable<Action> {
    return this.actions$.ofType(CommuniWhiteActionTypes.COMMUNI_WHITE_UPDATE_REQUEST).pipe(
      distinctUntilChanged(),
      debounceTime(500),
      switchMap((action:any) => this.service.update(action.payload).pipe(
        switchMap(res => [
          new ActionCommuniWhiteUpdateSuccess(res.data),
          new ActionSuccessMessage({message:'통신 기반 화이트 리스트가 수정되었습니다.', title:'통신 기반 화이트 리스트 수정 완료'})
        ]),
        catchError(err => of(new ActionCommuniWhiteUpdateFail(err), new ActionHttpErrorMessage(err)))
        )
      )
    )
  };
}

