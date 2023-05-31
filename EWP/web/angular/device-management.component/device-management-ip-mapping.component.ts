/**
 * 장비 관리 콤포넌트
 * @component DeviceManageComponent
 * @template './device-management.template.html',
 * @style './device-management.style.scss'
 * */

import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import {
  Component, ElementRef, HostListener, Inject, OnDestroy, OnInit, ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { Observable } from 'rxjs';
import { DeviceManageRow } from './device-management.model';
import { takeUntil, filter, map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as moment from 'moment';
import * as R from 'ramda';
import * as _ from 'lodash';
import { selectorDeviceIpManage } from './device-management-ip.reducer';
import {
  ActionDeviceManageCreate, ActionDeviceManageDelete, ActionDeviceIpManageRead, ActionDeviceManageRead,
  ActionDeviceManageUpdate, ActionDeviceIpManageUpdateClear, ActionDeviceIpManageClear, ActionDeviceIpManageUpdate,
  ActionDeviceIpManageUpdateMac
} from './device-management.actions';
import { GridOptions } from 'ag-grid';
import { Subject } from 'rxjs';
import { UpdateButtonComponent } from '../../../shared/ag-grid.component/update-button.component';
import { DeleteButtonComponent } from '../../../shared/ag-grid.component/delete-button.component';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { utilService } from '../../../core/service/util.service';
import { MessagesService } from '../../../core/service/messages';
import { roleCheckService } from '@app/shared/role-check.service';
import {DeviceManageDialog} from '@app/system-management/device/device-management/device-management.component';
import {AssetNewButtonComponent} from '@app/shared/ag-grid.component/asset-new-button.component';
import { AssetMappingButtonComponent } from '@app/shared/ag-grid.component/asset-mapping-button.component';
import { ApiService } from '@app/core/service/commons';
import {CryptoJsService} from "@app/core/service/cryptoJs.service";


@Component({
  selector: 'device-management-ip-mapping',
  templateUrl: './device-management-ip.template.html',
  styleUrls: ['./device-management.style.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DeviceManageIpMappingComponent implements OnInit, OnDestroy {

  @ViewChild('gridWrap') gridWrap: ElementRef;

  unsubscribe$: Subject<void> = new Subject<void>();
  currentRole: number = 0;

  gridSettingView: boolean = false;
  gridHeight: string = '300px';
  columnDefs: Array<any> = [];

  searchForm: FormGroup;
  searchField: string = '';
  searchValue: string = '';
  seachControl: any;
  searchFieldOptions: any = [];

  gridOptions: GridOptions;
  rowData$: any;
  params: any;
  // sortField:string = 'id';
  // sortOrder:string = 'desc';
  filter: any;
  currentPage: number = 1;

  loading: boolean = true;

  // Pagination Params
  totalCnt: number;
  pageSize: number = 10;
  pager: any = {
    currentPage: 1,
    endIndex: 1,
    endPage: 1,
    pageSize: 10,
    pages: [],
    startIndex: 0,
    startPage: 1,
    totalItems: 1,
    totalPages: 1
  };

  constructor(
    private store: Store<any>,
    public dialog: MatDialog,
    private fb: FormBuilder,
    private translate: TranslateService,
    private utilService: utilService,
    private role: roleCheckService,
    private cryptoJsService : CryptoJsService
  ) {
    let vm = this;
    this.gridOptions = <GridOptions>{
      enableColResize: true,
      enableSorting: true,
      enableFilter: true,
      groupHeaders: false,
      rowHeight: 30,
      headerHeight: 30,
      unSortIcon: true,
      rowStyle: { textAlign: 'center' },
      onGridReady: () => {
        this.onWindowRealese({});
      },
      onCellClicked: function(e) { // Grid Click Event
        vm.gridClick(e);
      }
    };

    // 검색 필드 Rx debounceTime 을 이용한 조회
    this.searchForm = this.fb.group({
      searchField: ['', Validators.required],
      searchValue: ['', Validators.required]
    });
    this.seachControl = this.searchForm.controls['searchValue'];
    this.seachControl.valueChanges.pipe(
      distinctUntilChanged(),
      debounceTime(500)
    ).subscribe(
      (value: string) => {
        // // console.log('sku changed to: ', value);
        this.searchValue = value;
        this.searchGrid();
      }
    );

    this.setColumnDef();
    translate.onLangChange.subscribe((event: LangChangeEvent) => {
      // console.log(event);
      this.setColumnDef();
    });
  }

  setColumnDef() {
    this.searchFieldOptions = [
      {
        label: this.translate.instant('motie_asset_manage.name'),
        field: 'motieAsset.assetNm',
        value_type: 'like'
      },
      {
        label: this.translate.instant('motie_asset_manage.ip'),
        field: 'assetIp',
        value_type: 'like'
      }
    ];
    let vm = this;
    this.columnDefs = [
      {
        headerName: this.translate.instant('motie_asset_ip_manage.power'), //'ID',
        field: 'powerGenName',
        width: 80,
        suppressFilter: true,
        colVisible: true/*,
        cellRenderer: function(params) {
          return params.data.power.name;
        }*/
      },
      {
        headerName: this.translate.instant('motie_asset_manage.name'), //'User Name',
        field: 'motieAsset.assetNm',
        width: 100,
        colVisible: true
      },
      {
        headerName: this.translate.instant('motie_asset_ip_manage.ip'), //'User Name',
        field: 'assetIp',
        width: 90,
        colVisible: true
      },
      /* 23.01.19, 맥주소 추가, 요청사항 */
      {
        headerName: this.translate.instant('맥주소'), //'User Name',
        field: 'deviceMac',
        width: 100,
        colVisible: true
      },
      {
        headerName: this.translate.instant('motie_asset_ip_manage.system_name'), //'User Name',
        field: 'systemNm',
        width: 100,
        colVisible: true
      },
      /* 22.05.05, 호기와 제조사 추가*/
      {
        headerName: this.translate.instant('호기'), //'User Name',
        field: 'assetHogiCodeName',
        width: 50,
        colVisible: true
      },
      {
        headerName: this.translate.instant('제조사'), //'User Name',
        field: 'makeId',
        width: 50,
        colVisible: true
      }];

    // 권한이 있을경우 수정 삭제 추가
    // if (this.roleCheck()) {
      this.columnDefs = [
        ...this.columnDefs,
        {
          headerName: this.translate.instant('buttons.asset_new'), // 'New',
          field: 'new',
          width: 50,
          colVisible: true,
          suppressSorting: true,
          suppressFilter: true,
          suppressResize: true,
          cellStyle: { textAlign: 'center', padding: '0' },
          cellRendererFramework: AssetNewButtonComponent
        },
        {
          headerName: this.translate.instant('buttons.asset_mapping'), // 'Delete',
          field: 'mapping',
          width: 50,
          colVisible: true,
          suppressSorting: true,
          suppressFilter: true,
          suppressResize: true,
          cellStyle: { textAlign: 'center', padding: '0' },
          cellRendererFramework: AssetMappingButtonComponent
        },
        {
          headerName: this.translate.instant('buttons.asset_ip_update'), // 'Update',
          field: 'update',
          width: 50,
          colVisible: true,
          suppressSorting: true,
          suppressFilter: true,
          suppressResize: true,
          cellStyle: { textAlign: 'center', padding: '0' },
          cellRendererFramework: AssetMappingButtonComponent
        }];
    // }

    this.onWindowRealese({});
  }

  ngOnInit(): void {
    this.gridHeight = this.gridWrap.nativeElement.clientHeight + 'px';

    this.store.dispatch( new ActionDeviceIpManageRead({filter:JSON.stringify({"where":{"assetId":null}})}));
    this.store.select(selectorDeviceIpManage)
      .pipe(
        takeUntil(this.unsubscribe$),
        filter((res) => {return res.contents !== undefined;}),
        map(res => res.contents)
      )
      .subscribe((datas: any) => {
        this.loading = datas.loading;
        if (datas.data != undefined) {
          _.map(datas.data.data, d => {
            if (d.assetIp != undefined && d.assetIp.length != 0) {
              d.assetIp = this.cryptoJsService.decrypt(d.assetIp)
            }
          });

          this.rowData$ = datas.data;
          this.totalCnt = datas.data.total_cnt;
          this.onWindowRealese({});
        }
      });

    this.params = { filter: JSON.stringify({assetId : null }) };
    this.store.dispatch(new ActionDeviceIpManageRead(this.params));
  }


  search(event: any) {
    let likeChange = (v) => {
      return { like: '%' + v + '%' };
    };
    this.filter = R.map(likeChange, event);
    this.params = { filter: JSON.stringify(Object.assign({ where: this.filter })) };
    this.store.dispatch(new ActionDeviceManageRead(this.params));
  }

  setCellVisible(col: string, reverse: boolean) {
    this.gridOptions.columnApi.setColumnVisible(col, reverse);
    this.gridOptions.api.sizeColumnsToFit();
  }

  sizeColumnsToFit() {
    this.gridOptions.api.sizeColumnsToFit();
  }

  autoSizeAll() {
    let allColumnIds = this.columnDefs.map(x => x.field);
    this.gridOptions.columnApi.autoSizeColumns(allColumnIds);
  }

  getData(event: any) {
    this.params = { filter: JSON.stringify({ }) };
    this.store.dispatch(new ActionDeviceIpManageRead(this.params));
  }

  searchFieldChange(event: any) {
    this.searchField = event.value;
    if (this.searchValue !== '' && this.searchField !== '') {
      this.searchGrid();
    }
  }

  searchGrid() {
    // console.log(this.searchField);
    if (this.searchField === '') {
      return false;
    }
    this.filter = { where: {} };
    if (this.searchValue !== '') {
      this.filter.where[this.searchField] = { like: '%' + this.searchValue + '%' };
    } //R.map(likeChange, event.value);
    this.params = { filter: JSON.stringify(Object.assign(this.filter, {})) };
    this.store.dispatch(new ActionDeviceIpManageRead(this.params));
  }

  clearValue() {
    this.seachControl.setValue('');
    this.searchValue = '';
  }

  ngOnDestroy() {
    this.store.dispatch(new ActionDeviceIpManageClear());
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  @HostListener('window:resize', ['$event'])
  onWindowRealese(e?: any) {
    setTimeout(() => {
      if (this.gridOptions.api) {
        this.gridOptions.api.sizeColumnsToFit();
        this.gridHeight = this.gridWrap.nativeElement.clientHeight + 'px';
      }
    }, 300);
  }


  createMotieAsset(d: DeviceManageRow, mode: string) {
    d.motieAssetIp = d.assetIp;
    d.assetMacAddrs = d.deviceMac;
    let dialogRef = this.dialog.open(DeviceManageDialog, { width: '500px', data: { mode: mode, data: d } });
    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        this.getData({});
      } //// console.log(result);
    });
  }

  mappingRow(d: any) {
    let dialogRef = this.dialog.open(DeviceManageIpMappingDialog, { width: '500px', data: { mode: 'mapping', data: d } });
    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        this.getData({});
      } //// console.log(result);
    });
  }

  UpdateRow(d: any, mode: string) {
    this.mappingCode(d);
    d.motieAssetIp = d.assetIp;
    d.assetMacAddrs = d.deviceMac;
    d.assetHogiCode = d.unitId;
    d.mnufcturCor = d.makeId;
    let dialogRef = this.dialog.open(DeviceManageIpCreateUpdateDialog, { width: '500px', data: { mode: mode, data: d } });
    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        this.getData({});
      } //// console.log(result);
    });
  }

  mappingCode(d) {
    if(d.unitId === '1호기'){
      d.unitId = '1';
    }
    else if (d.unitId === '2호기'){
      d.unitId = '2';
    }

    if (d.makeId === '보일러'){
      d.makeId = 'ABB';
    }
    else if (d.makeId === '터빈'){
      d.makeId = 'GE';
    }
  }

  gridClick(e) {
    // if( e.data.assetId <= 0) {
      if (e.colDef.field === 'mapping') {
        this.mappingRow(e.data);
      }
      else if (e.colDef.field === 'new') {
        this.createMotieAsset(e.data, e.colDef.field);
      }
      else if (e.colDef.field === 'update'){
        this.UpdateRow(e.data, e.colDef.field);
      }
    // }
  }

  roleCheck(): boolean {
    return this.role.checkRole();
  }

  searchFilter(e:any) {
    _.forEach(this.searchFieldOptions, (v) => {
      if(e[v.field] === undefined) {
        this.gridOptions.api.destroyFilter(v.field);
      } else {
        let agFilter:any = this.gridOptions.api.getFilterInstance(v.field);
        agFilter.setModel({
          type: v.value_type === 'like' ? 'contains' : 'equals',
          filter: e[v.field]
        });
        this.gridOptions.api.onFilterChanged();
      }
    });
  }

}


//아이피 관리 페이지의 '자산매핑' 다이얼로그 컴포넌트(자산생성은 본ts 파일)
@Component({
  selector: 'device-management-ip-mapping-dialog',
  templateUrl: './device-management-ip.dialog.template.html',
  styleUrls: ['./device-management.style.scss']
})
export class DeviceManageIpMappingDialog implements OnInit, OnDestroy {
  title: any;
  Form: FormGroup;
  motieAssetList: any;
  unsubscribe$: Subject<void> = new Subject<void>();

  //@ViewChild('ipValue') ipValue: ElementRef;
  //@ViewChild('nameValue') nameValue: ElementRef;
  //@ViewChild('descriptionValue') descriptionValue: ElementRef;

  constructor(
    private store: Store<any>,
    public dialogRef: MatDialogRef<DeviceManageIpMappingDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { mode: string; data: any; },
    private translate: TranslateService,
    private fb: FormBuilder,
    private utilService: utilService,
    private msgs: MessagesService,
    private api: ApiService
  ) {
    this.title = translate.instant('buttons.asset_mapping');
    this.createForm();
  }

  createForm() { //자산ip의 id킷값 추가
    //const ipPattern = '(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)';
    this.Form = this.fb.group({
      assetId: ['' , Validators.required],
      assetIp: [this.data.data.assetIp, Validators.required],
      id: [this.data.data.id, Validators.required],
      deviceMac: [this.data.data.deviceMac]
    });
  }

  ngOnInit() {
    this.store.select(selectorDeviceIpManage)
      .pipe(
        takeUntil(this.unsubscribe$),
        filter(res => res.update !== undefined),
        map(res => res.update)
      )
      .subscribe((datas: any) => {
        this.store.dispatch(new ActionDeviceIpManageUpdateClear());
        this.dialogRef.close('success');
      });
    this.getMotieList();
  }

  getMotieList() {
    let param = '';
    this.api.API('get', '/MotieAssets', '').pipe(
      distinctUntilChanged(),
      debounceTime(500),
      map(res => res)
    )
      .subscribe(res => {

        let d = res.data.data;
        if(this.data.data.keeperKey !== null && this.data.data.keeperKey !== ''){
          d = _.filter(d, {'keeperKey': this.data.data.keeperKey.substring(0,6)});
        }else {
          d = _.filter(d, {powerGenId: this.data.data.powerGenId});
        }
        this.motieAssetList = this.getMappingName(d);
      }, err => {
        this.msgs.error(err);
      });
  }

  getMappingName(d) { //당진 자산페이지 개선
    for (let item of d){
      item.assetNm = item.assetHogiCode + '호기 ' +item.mnufcturCor + ' - ' + item.assetNm;
    }
    return d;
  }

  onSubmit() {
    if (!this.Form.dirty && !this.Form.valid) {
      return;
    }
    this.data.data = this.prepareSaveDept();
    if (this.data.data.assetId.trim() === '') { // 공백만 있을경우
      this.msgs.warning({ title: '장비명 입력값 확인', message: '장비명 입력값을 확인하시기 바랍니다.' });
    } else {
      this.data.data.state = 'U';
      this.store.dispatch(new ActionDeviceIpManageUpdate(this.data.data));
    }
  }

  prepareSaveDept(): any { //자산ip의 id킷값 추가
    const formModel = this.Form.value;
    const saveDept: {
      assetId: string;
      assetIp: string;
      id: number;
    } = {
      assetId         : formModel.assetId,
      assetIp         : formModel.assetIp,
          id            : formModel.id
    };
    return saveDept;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  get f(): any {
    return this.Form.controls;
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}


//아이피 관리 페이지의 '자산 생성/수정' 다이얼로그 컴포넌트
@Component({
      selector: 'device-management-ip-create-update-dialog',
      templateUrl: './device-management-ip.create.update.dialog.template.html',
      styleUrls: ['./device-management.style.scss']
})
export class DeviceManageIpCreateUpdateDialog implements OnInit, OnDestroy {
      title: any;
      Form: FormGroup;
      unsubscribe$: Subject<void> = new Subject<void>();

      ipMsg: string;
      ipValidation: boolean;

      @ViewChild('ipValue') ipValue: ElementRef;
      @ViewChild('stationIdValue') stationIdValue: ElementRef;
      @ViewChild('powerGenIdValue') powerGenIdValue: ElementRef;

      constructor(
            private store: Store<any>,
            public dialogRef: MatDialogRef<DeviceManageIpCreateUpdateDialog>,
            @Inject(MAT_DIALOG_DATA) public data: { mode: string; data: any; },
            private translate: TranslateService,
            private fb: FormBuilder,
            private utilService: utilService,
            private msgs: MessagesService,
            private api: ApiService
      ) {
            this.title = translate.instant('buttons.asset_ip_update');
            this.createForm();
      }

      /*  cmncode list
      */
      pwrInfoList: any;
      stationNmList: any;
      powerGenNmList: any;
      cmnCodeList: { hogiCmnCodeList: any, divGubunCmnCodeList, assetImportanceCodeList: any ,assetProtocolCodeList: any ,osCodeList: any
            ,manufCodeList:any , highClassCodeList:any}
            = {
            hogiCmnCodeList: { param: { where: { gubunKey: 'div_hogi', object: 'DTI' } } ,codeList:[] },
            divGubunCmnCodeList: { param: { where: { gubunKey: 'div_gubun', object: 'DTI' } } ,codeList:[]},
            assetImportanceCodeList: { param: { where: { gubunKey: 'asset_importance', object: 'DTI' } } ,codeList:[]},
            assetProtocolCodeList: { param: { where: { gubunKey: 'asset_protocol', object: 'DTI' } } ,codeList:[]},
            osCodeList: { param: { where: { gubunKey: 'div_os', object: 'DTI' } } ,codeList:[]},
            manufCodeList: { param: { where: { gubunKey: 'div_manuf', object: 'DTI' } } ,codeList:[]},
            highClassCodeList: { param: { where: { gubunKey: 'div_high_gubun', object: 'DTI' } } ,codeList:[]}
      };

      createForm() {
        this.Form = this.fb.group({
            mnufcturCor: [this.data.data.mnufcturCor],
            assetHogiCode: [this.data.data.assetHogiCode],
            motieAssetIp: [this.data.data.motieAssetIp, Validators.required],
            id: [this.data.data.id, Validators.required],
            assetMacAddrs: [this.data.data.assetMacAddrs, Validators.required]
        });
      }

      ngOnInit() {
        this.store.select(selectorDeviceIpManage)
        .pipe(
          takeUntil(this.unsubscribe$),
          filter(res => res.update !== undefined),
          map(res => res.update)
        )
        .subscribe((datas: any) => {
          this.store.dispatch(new ActionDeviceIpManageUpdateClear());
          this.dialogRef.close('success');
        });
        //this.getPwrInfo('/MotiePwrInfos', '');
        this.getCmnCode();
      }

      getCmnCode() {
        for (const [k, v] of Object.entries(this.cmnCodeList)) {
          this.api.API('get', '/MotieCmnCodes', {filter:JSON.stringify(v.param)}).pipe(
            distinctUntilChanged(),
            debounceTime(500),
            map(res => res)
          )
          .subscribe(res => {
            v.codeList = res;
          }, err => {
            this.msgs.error(err);
          });
        }
      }

      // getPwrInfo(path: string, param: any) {
      //   this.api.API('get', path, param).pipe(
      //     distinctUntilChanged(),
      //     debounceTime(500),
      //     map(res => res)
      //   )
      //   .subscribe(res => {
      //     this.pwrInfoList = res;
      //     this.stationNmList = _.filter(this.pwrInfoList, { 'gubun': 'S' });
      //     if (this.data.data.stationId !== null) {
      //       this.stationIdChange(this.data.data.stationId);
      //     }
      //   }, err => {
      //     this.msgs.error(err);
      //   });
      // }
      //
      // stationIdChange(newValue) {
      //   this.powerGenNmList = _.filter(this.pwrInfoList, (d) => {
      //     return d.gubun === 'P' && d.powerGenId !== null && d.powerGenId.includes(newValue);
      //   });
      // }

      /*ip validate 체크*/
      ipValidate() {
        const arrAssetIp = this.Form.controls.motieAssetIp.value.split(',');
        for (let assetIp of arrAssetIp) {
          if (!/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
                .test(assetIp)) {
            this.ipMsg = this.translate.instant('motie_asset_manage.ip_msg');
            this.ipValidation = false;
            return false;
            break;
          } else {
            this.ipMsg = '';
            this.ipValidation = true;
          }
        }
        return true;
      }

      /* MAC validate 체크 */
      MacValidate() {
        const regx = /^([0-9a-f]{2}[:-]){5}([0-9a-f]{2})$/;
        return regx.test(this.Form.value.assetMacAddrs);
      }

      onSubmit() {
        if (!this.Form.dirty && !this.Form.valid) {
          return;
        }
        this.data.data = this.prepareSaveDept();
        if(!this.ipValidate()) {
          this.msgs.warning({ title: 'IP 입력값 확인', message: 'IP 입력값을 확인하시기 바랍니다.' });
          this.ipValue.nativeElement.focus();
        }
        else if(!this.MacValidate()){
          this.msgs.warning({ title: 'MAC ADDRESS 입력값 확인', message: 'MAC ADDRESS 입력값을 확인하시기 바랍니다.' });
          this.ipValue.nativeElement.focus();
        }
        else {
          this.store.dispatch(new ActionDeviceIpManageUpdateMac(this.data.data));
        }
      }

      prepareSaveDept(): any {
        const formModel = this.Form.value;
        const saveDept: {
                  mnufcturCor          : string;
                  assetHogiCode        : string;
                  motieAssetIp         : string;
                  id                   : number;
                  assetMacAddrs         : string;
            }
            = {
                  mnufcturCor          : formModel.mnufcturCor        as string,
                  assetHogiCode        : formModel.assetHogiCode      as string,
                  motieAssetIp         : formModel.motieAssetIp       as string,
                  id                   : formModel.id                 as number,
                  assetMacAddrs         : formModel.assetMacAddrs       as string,
            };
        return saveDept;
      }

      onNoClick(): void {
        this.dialogRef.close();
      }

      get f(): any {
        return this.Form.controls;
      }

      ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
      }
}
