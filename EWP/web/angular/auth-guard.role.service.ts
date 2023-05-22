import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot
    , Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {LocalStorageService} from '@app/core';
import {Observable, of} from 'rxjs';
import {MessagesService} from '@app/core/service/messages';
import {utilService} from "../service/util.service";
import {TranslateService} from '@ngx-translate/core';

@Injectable({
    providedIn: 'root'
})
export class AuthGuardRoleService implements CanActivate {
    // navigationContent: any;
    // userInfo: any;

    constructor(
        private store: Store<any>,
        private localStorage: LocalStorageService,
        private msgs: MessagesService,
        private utilService: utilService,
        private translate: TranslateService,
        private router:Router
    ) {
    }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> {
        const navigationContent = this.utilService.getState(this.store, 'apps.navis.content');
        const userInfo = this.utilService.getState(this.store, 'apps.logins.user');

        if (!userInfo) {
            this.router.navigate(['/login']);
            return of(false)
        }

        if (userInfo.id === 1 || state.url === '/home/index/main' || userInfo.role === '1') {
            return new Observable<boolean>(subscriber => subscriber.next(true));
        }

        // 허용된 URL을 확인하는 recursive func
        const allowedPermission = (menu, parentPath) => {
            if (menu.length === 0) {
                return false;
            }

            for (let i = 0; i < menu.length; i++) {
                let allow = false;
                if (menu[i].children.length === 0) {
                    allow = menu[i].dashboard ?
                        state.url === `/home/contents/${menu[i].path_name}`
                        : state.url.startsWith(`${parentPath}/${menu[i].path_name}`);
                } else {
                    allow = allowedPermission(menu[i].children, `${parentPath}/${menu[i].path_name}`);
                }
                if (allow) {
                    return true;
                }
            }

            return false;
        };

        if (allowedPermission(navigationContent, '/home')) {
            return new Observable<boolean>(subscriber => subscriber.next(true));
        } else {
            this.msgs.warning({
                title: this.translate.instant('auth_guard.msgs_title'),
                message: this.translate.instant('auth_guard.msgs_message')
            });
        }
    }
}
