/**
 * 장비 관리 이펙트
 * @class MotiePcabEffects
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
  ActionMotiePcabReadSuccess,
  ActionMotiePcabReadFail,
  MotiePcabActionTypes,
} from './motie-pcab.actions';
import { ApiService } from '../../core/service/commons';
import { ActionHttpErrorMessage, ActionSuccessMessage } from '../../core/service/messages.reducer';

@Injectable()
export class MotiePcabEffects {
  constructor(
    private actions$: Actions<Action>,
    private api: ApiService
  ){ }


  /**
   * 장비 읽기
   * @function getContent$
   * @params filter {"something":"value"}
   * */
  @Effect()
  getContent$(): Observable<Action> {
    return this.actions$.ofType(MotiePcabActionTypes.MOTIEPCAB_READ_REQUEST).pipe(
      distinctUntilChanged(),
      debounceTime(500),
      switchMap((action:any) =>
        this.api.API('get', '/MotieAmlyPackets', action.payload).pipe(
          map(res => { return new ActionMotiePcabReadSuccess(res)}),
          catchError(err => of(new ActionMotiePcabReadFail(err), new ActionHttpErrorMessage(err)))
        )
      )
    )
  };

  /**
   * 장비 읽기
   * @function getRow$
   * @params filter {"something":"value"}
   * */
/*  @Effect()
  getRow$(): Observable<Action> {
    return this.actions$.ofType(MotiePcabActionTypes.MOTIEPCAB_UPDATE_READ_REQUEST).pipe(
      distinctUntilChanged(),
      debounceTime(500),
      switchMap((action:any) =>
        this.api.API('get', '/MotieAmlyPackets', action.payload).pipe(
          map(res => new ActionMotiePcabReadSuccess(res)),
          catchError(err => of(new ActionMotiePcabReadFail(err), new ActionHttpErrorMessage(err)))
        )
      )
    )
  };*/


}
