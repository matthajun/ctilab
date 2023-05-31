/**
 * 장비 목록,추가, 수정, 삭제 리듀서
 * @function accountsReducer
 * */

import { DeviceManageState, DeviceManageContents } from './device-management.model';
import { DeviceManageActionTypes, DeviceManageActions } from  './device-management.actions'

export const accInitialState: DeviceManageState = { loading: true };
export const selectorDeviceIpManage = state => state.home.motieips;

export function deviceManageIpReducer(
  state = accInitialState, action: DeviceManageActions
): DeviceManageState {

  switch (action.type) {

    case DeviceManageActionTypes.DEVICEMANAGEIP_READ_REQUEST:
      return {
        ...state,
        loading: true
      };
    case DeviceManageActionTypes.DEVICEMANAGEIP_UPDATE_READ_REQUEST:
      return {
        ...state,
        loading: true
      };

    case DeviceManageActionTypes.DEVICEMANAGEIP_READ_SUCCESS:
      return {
        ...state,
        loading: false,
        contents: action.payload
      };

    case DeviceManageActionTypes.DEVICEMANAGEIP_READ_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload
      };


    case DeviceManageActionTypes.DEVICEMANAGEIP_UPDATE_REQUEST:
      return {
        ...state,
        loading: true
      };

    case DeviceManageActionTypes.DEVICEMANAGEIP_UPDATE_SUCCESS:
      return {
        ...state,
        loading: false,
        update: action.payload
      };

    case DeviceManageActionTypes.DEVICEMANAGEIP_UPDATE_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    case DeviceManageActionTypes.DEVICEMANAGEIP_UPDATE_CLEAR:
      return {
        ...state,
        update: undefined
      };

    default:
      return state;
  }
}
