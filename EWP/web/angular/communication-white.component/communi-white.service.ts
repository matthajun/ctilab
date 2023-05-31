/**
 * 통신 기반 화이트 템플릿 서비스
 * @class CommuniWhiteService
 * */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ApiService } from '../../core/service/commons';
import { RequestOptions } from "@angular/http";
import * as _ from 'lodash';
import { APP_PROD_SITE } from '@app/core/service/constants';

@Injectable()
export class CommuniWhiteService {

  headers: Headers;

  constructor(
    private httpClient: HttpClient,
    private api: ApiService
  ) {
    this.headers = new Headers();
  }

  register(param: any): Observable<any> {
    let _data = {
      data : param
    };
    return this.api.API('post', '/CommuniWhiteLists', param);
  }

  update(param: any): Observable<any> {
    let _data = {
      data : param
    };
    // return this.api.API('patch', '/MotieRuleSingles/updateMotieRuleSingle/' + _data.data.ruleId, _data);
    return this.api.API('patch', '/CommuniWhiteLists/updataCommuniWhiteList', _data);
  }

  /**
   * 삭제
   */
  delete( param: any): Observable<any> {
    /* let params = {
       ruleId:
     };*/
    let _data = {
      data : param
    };
    // return this.api.API('delete', '/MotieRuleSingles/' + id, params);
    return this.api.API('patch', '/CommuniWhiteLists/deleteMotieCommuniWhiteList',  _data);
  }

  read(params: any): Observable<any> {
    return this.api.API('get', '/CommuniWhiteLists', params);
  }
}
