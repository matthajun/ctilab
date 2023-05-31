/**
 * 장비 목록,추가, 수정, 삭제 리듀서
 * @function accountsReducer
 * */

import { DeviceManageState, DeviceManageContents } from './device-management.model';
import { DeviceManageActionTypes, DeviceManageActions } from  './device-management.actions'
import * as _ from 'lodash';

export const accInitialState: DeviceManageState = { loading: true };
export const selectorDeviceManage = state => state.home.devs;
export const selectorDeviceManageUpdate = state => state.home.devs.update;
export const selectorDeviceManageFileUpdate = state => state.home.devs.update;

export function deviceManageReducer(
  state = accInitialState, action: DeviceManageActions
): DeviceManageState {

  switch (action.type) {

    case DeviceManageActionTypes.DEVICEMANAGE_READ_REQUEST:
      return {
        ...state,
        loading: true
      };

    case DeviceManageActionTypes.DEVICEMANAGE_UPDATE_READ_REQUEST:
      return {
        ...state,
        loading: true
      };

    case DeviceManageActionTypes.DEVICEMANAGE_READ_SUCCESS:
      return {
        ...state,
        loading: false,
        contents: action.payload
      };

    case DeviceManageActionTypes.DEVICEMANAGE_READ_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    case DeviceManageActionTypes.DEVICEMANAGE_CREATE_REQUEST:
      return {
        ...state,
        loading: true
      };

    case DeviceManageActionTypes.DEVICEMANAGE_CREATE_SUCCESS:
      return {
        ...state,
        loading: false,
        update: action.payload
      };

    case DeviceManageActionTypes.DEVICEMANAGE_CREATE_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    case DeviceManageActionTypes.DEVICEMANAGE_UPDATE_REQUEST:
      return {
        ...state,
        loading: true
      };

    case DeviceManageActionTypes.DEVICEMANAGE_UPDATE_SUCCESS:
      return {
        ...state,
        loading: false,
        update: action.payload
      };

    case DeviceManageActionTypes.DEVICEMANAGE_UPDATE_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    /*
     * Log Source delete
     * */
    case DeviceManageActionTypes.DEVICEMANAGE_DELETE_REQUEST:
      return {
        ...state,
        loading: true
      };

    case DeviceManageActionTypes.DEVICEMANAGE_DELETE_SUCCESS:
      return {
        ...state,
        loading: false,
        update: action.payload
      };

    case DeviceManageActionTypes.DEVICEMANAGE_DELETE_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    case DeviceManageActionTypes.DEVICEMANAGE_UPDATE_CLEAR:
      return {
        ...state,
        update: undefined
      };

    case DeviceManageActionTypes.DEVICEMANAGE_CONTENT_CLEAR:
      return accInitialState;

    case DeviceManageActionTypes.DEVICEMANAGE_FILE_UPDATE_REQUEST:
      return {
        ...state,
        loading: true
      };

    case DeviceManageActionTypes.DEVICEMANAGE_FILE_UPDATE_SUCCESS:
      return {
        ...state,
        loading: false,
        update: 'UPDATE'
      };

    case DeviceManageActionTypes.DEVICEMANAGE_FILE_UPDATE_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    case DeviceManageActionTypes.DEVICEMANAGE_FILE_UPDATE_CLEAR:
      return {
        ...state,
        update: undefined
      };
    default:
      return state;
  }




}
