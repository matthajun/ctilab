/**
 * 리포트 템플릿 목록,추가, 수정, 삭제 리듀서
 * @function CommuniWhiteReducer
 * */
import {CommuniWhiteState} from './communi-white.model';
import {CommuniWhiteActions, CommuniWhiteActionTypes} from './communi-white.actions';
import {ColorKeywords} from "three";


export const bwInitialState: any = {
  contents : null,
  update: null
};

export const selectorCommuniWhite = state => state.known_rule.communi_white;


export function CommuniWhiteReducer(
  state: CommuniWhiteState = bwInitialState,
  action: CommuniWhiteActions
): CommuniWhiteState {
  switch (action.type) {
    case CommuniWhiteActionTypes.COMMUNI_WHITE_READ_REQUEST:
      return {
        ...state,
        contents: {
          contents: null,
          error: null,
          loading: true,
          query: action.payload
        }
      };

    case CommuniWhiteActionTypes.COMMUNI_WHITE_READ_SUCCESS:
      return {
        ...state,
        contents: {
          contents: action.payload,
          error: null,
          loading: false,
          query: null
        }
      };

    case CommuniWhiteActionTypes.COMMUNI_WHITE_READ_FAIL:
      return {
        ...state,
        contents: {
          contents: null,
          error: action.payload,
          loading: false,
          query: null
        }
      };

    case CommuniWhiteActionTypes.COMMUNI_WHITE_DELETE_SUCCESS:
      return {
        ...state,
        update : action.payload
      };

    case CommuniWhiteActionTypes.COMMUNI_WHITE_DELETE_FAIL:
      return {
        ...state
      };

    case CommuniWhiteActionTypes.COMMUNI_WHITE_UPDATE_REQUEST:
      return {
        ...state,
        update: {
          contents:null,
          error: null,
          loading: true,
          query: action.payload
        }
      };

    case CommuniWhiteActionTypes.COMMUNI_WHITE_UPDATE_SUCCESS:
      return {
        ...state,
        update: {
          contents: action.payload,
          error: null,
          loading: false,
          query: null
        }
      };

    case CommuniWhiteActionTypes.COMMUNI_WHITE_UPDATE_FAIL:
      return {
        ...state,
        update: {
          loading: false,
          contents: null,
          error: action.payload,
          query: null
        }
      };

    case CommuniWhiteActionTypes.COMMUNI_WHITE_UPDATE_CLEAR:
      return {
        ...state,
        update: {
          loading: false,
          contents: null,
          error: null,
          query: null
        }
      };

    case CommuniWhiteActionTypes.COMMUNI_WHITE_CONTENT_CLEAR:
      return {
        ...state,
        contents: null,
        update: null
      };

    default:
      return state;
  }
}
