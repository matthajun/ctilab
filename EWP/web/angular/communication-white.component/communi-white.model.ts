
/**
 * 통신기반 화이트 목록,추가, 수정, 삭제 모델
 * */
import { HttpErrorResponse } from '@angular/common/http'


export interface CommuniWhiteState {
  contents?: CommuniWhiteContentState;
  update?: CommuniWhiteUpdateState;
}

export interface CommuniWhiteContentState {
  query:any;
  contents?: Array<CommuniWhiteRow>;
  error?: HttpErrorResponse;
  loading: boolean;
}

export interface CommuniWhiteUpdateState {
  query:any;
  contents?: any;
  error?: HttpErrorResponse;
  loading: boolean;
}

export interface CommuniWhiteRow {
  id? : string;
  unit?: string;
  make?: string;
  powerGenId?: string;
  stationId?: string;
  protocolType?: string;
  detailProtocol?: string;
  name : string;
  srcIp?: string;
  dstIp?: string;
  srcPort?: string;
  dstPort?: string;
  state?: string;
  lstUser?: string;
  fstDttm?: string;
  lstDttm?: string;
  fstUser?: string;
  deploy?: string;
  status? :boolean;
}

