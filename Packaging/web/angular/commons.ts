import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { API_BASE_URL, CURRENT_MENU } from './constants';
import { LocalStorageService } from "@app/core";

@Injectable({
    providedIn:'root'
})
export class ApiService {
    token: string;
    path: string;
    baseUrl:string;
    headers: Headers;
    paramsLink:string = '?';

    constructor(
        private httpClient: HttpClient,
        private router:Router,
        private localStorageService: LocalStorageService
    ) {

    }

    API(type: string, path: string, params?: any): Observable<any> {
        this.baseUrl = `${API_BASE_URL}/api`;
        this.path = path;
        this.paramsLink = this.path.indexOf('?') === -1 ? '?' : '&';
        this.token = this.localStorageService.getItem('APPS.LOGINS.CONTENTS') !== undefined ? this.localStorageService.getItem('APPS.LOGINS.CONTENTS').id : '';

        if(this.token === '') {
            this.router.navigate(['/login']);
        }

        let url = `${this.baseUrl}${this.path}${this.paramsLink}`;

        if(this.path !== '/accounts/login') {
            url += `access_token=`  + this.token;
        }

        url = url.replace(/"/gi, '');

        let headerProperties = { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff', 'Access-Control-Allow-Origin': '*' };
        const menuId = this.localStorageService.getItem(CURRENT_MENU);

        if (menuId) {
            headerProperties['X-Menu-By'] = menuId.toString();
        }

        switch (type) {
            case 'get': {
                let parameters = new HttpParams();

                for (let key in params) {
                    if (params.hasOwnProperty(key)) {
                        let val = params[key];

                        parameters = parameters.append(key, val);
                    }
                }

                return this.httpClient.get(url, { params: parameters, headers: new HttpHeaders(headerProperties), withCredentials: true });
            }

            case 'post': {
                return this.httpClient.post(url, params, { headers: new HttpHeaders(headerProperties), withCredentials: true });
            }

            case 'put': {
                return this.httpClient.put(url, { ...params, headers: new HttpHeaders(headerProperties), withCredentials: true });
            }

            case 'delete': {
                let parameters = new HttpParams();

                for (let key in params) {
                    if (params.hasOwnProperty(key)) {
                        let val = params[key];

                        parameters = parameters.append(key, val);
                    }
                }

                return this.httpClient.delete(url, { params: parameters, headers: new HttpHeaders(headerProperties), withCredentials: true });
            }

            case 'patch': {
                return this.httpClient.patch(url, { ...params, headers: new HttpHeaders(headerProperties), withCredentials: true });
            }
        }
    }

    eventSource (path: string, params?: any){
        this.baseUrl = `${API_BASE_URL}/api`;
        this.path = path;
        this.paramsLink = this.path.indexOf('?') === -1 ? '?' : '&';
        this.token = this.localStorageService.getItem('APPS.LOGINS.CONTENTS') !== undefined ? this.localStorageService.getItem('APPS.LOGINS.CONTENTS').id : '';

        let url = `${this.baseUrl}${this.path}${this.paramsLink}`;
        url += `access_token=${this.token}`;
        url = url.replace(/"/gi, '');

        return new EventSource(url);
    }

    downloadApi(type: string, path: string, params ?: any) {
        this.baseUrl = `${API_BASE_URL}/api`;
        this.path = path;
        this.paramsLink = this.path.indexOf('?') === -1 ? '?' : '&';
        this.token = this.localStorageService.getItem('APPS.LOGINS.CONTENTS') != undefined ? this.localStorageService.getItem('APPS.LOGINS.CONTENTS').id : '';

        if (this.token === '') {
            this.router.navigate(['/login']);
        }

        let url = `${this.baseUrl}${this.path}${this.paramsLink}access_token=${this.token}`;
        let str = "";

        for (var key in params) {
            if (str != "") {
                str += "&";
            }

            str += key + "=" + encodeURIComponent(params[key]);
        }

        url = url + '&' + str;
        url = url.replace(/"/gi, '');
        window.location.href = url;
    }

    pullPathAPI(type: string, path: string, params ?: any): Observable<any> {
        this.token = this.localStorageService.getItem('APPS.LOGINS.CONTENTS') !== undefined ? this.localStorageService.getItem('APPS.LOGINS.CONTENTS').id : '';

        switch (type) {
            case 'get': {
                return this.httpClient.get(path, params);
            }

            case 'post': {
                return this.httpClient.post(path, params);
            }

            case 'put': {
                return this.httpClient.put(path, params);
            }

            case 'delete': {
                return this.httpClient.delete(path, params);
            }

            case 'patch': {
                return this.httpClient.patch(path, params);
            }

            default:
                return;
        }
    }

    DummyAPI(type: string, path: string, params ?: any): Observable<any> {
        const fileName = path.split('/');
        const filePATH = '/assets/' + fileName[fileName.length - 1] + '.json';

        switch (type) {
            case 'get': {
                return this.httpClient.get(filePATH, params);
            }

            case 'post': {
                return this.httpClient.post(filePATH, params);
            }
            default:
                return;
        }
    }
}
