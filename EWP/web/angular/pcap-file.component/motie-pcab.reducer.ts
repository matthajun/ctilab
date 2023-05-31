/**
 * 장비 목록,추가, 수정, 삭제 리듀서
 * @function accountsReducer
 * */

import { MotiePcabState, MotiePcabContents } from './motie-pcab.model';
import { MotiePcabActionTypes, MotiePcabActions } from  './motie-pcab.actions'
import * as _ from 'lodash';

export const accInitialState: MotiePcabState = { loading: true };
export const selectorMotiePcab = state => state.system.pcab;


export function MotiePcabReducer(
  state = accInitialState, action: MotiePcabActions
): MotiePcabState {

  switch (action.type) {

    case MotiePcabActionTypes.MOTIEPCAB_READ_REQUEST:
      return {
        ...state,
        loading: true
      };

    case MotiePcabActionTypes.MOTIEPCAB_READ_SUCCESS:

      return {
        ...state,
        loading: false,
        contents: action.payload
      };

    case MotiePcabActionTypes.MOTIEPCAB_READ_FAIL:
      return {
        ...state,
        loading: false,
       // error: action.payload
      };

    case MotiePcabActionTypes.MOTIEPCAB_CONTENT_CLEAR:
      return accInitialState;

    default:
      return state;
  }
}
