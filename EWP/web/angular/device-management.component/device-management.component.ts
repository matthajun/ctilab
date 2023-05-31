/**
 * 장비 관리 콤포넌트
 * @component DeviceManageComponent
 * @template './device-management.template.html',
 * @style './device-management.style.scss'
 * */

import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDatepicker } from '@angular/material';
import {
  Component, ElementRef, HostListener, Inject, OnDestroy, OnInit, Renderer, ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { Observable } from 'rxjs';
import { DeviceManageRow } from './device-management.model';
import { takeUntil, filter, map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import {select, Store} from '@ngrx/store';
import * as moment from 'moment';
import * as R from 'ramda';
import * as _ from 'lodash';
import {selectorDeviceManage, selectorDeviceManageFileUpdate} from './device-management.reducer';
import {
  ActionDeviceManageCreate, ActionDeviceManageDelete, ActionDeviceManageRead,
  ActionDeviceManageUpdate, ActionDeviceManageUpdateClear, ActionDeviceManageClear,
  ActionDeviceManageFileUpload, ActionDeviceManageFileUploadClear, ActionDeviceIpManageRead
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
import { ApiService } from '@app/core/service/commons';
import {FileUploader} from "ng2-file-upload";
import {API_BASE_URL} from "@app/core/service/constants";
import * as fs from 'file-saver';

@Component({
  selector: 'device-management',
  templateUrl: './device-management.template.html',
  styleUrls: ['./device-management.style.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DeviceManageComponent implements OnInit, OnDestroy {

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


  template: any;
  powerSupply: any = []; // 계통운영센터

  msg:any = { name: '자산 일괄' };
  swalOptions:any = { confirmButtonText: '확인', backdrop: false};
  @ViewChild('uploadFileSwalComplete') private uploadFileSwalComplete: SwalComponent;

  constructor(
    private store: Store<any>,
    public dialog: MatDialog,
    private fb: FormBuilder,
    private translate: TranslateService,
    private utilService: utilService,
    private api:ApiService,
    private role: roleCheckService,
    private cryptoJsService: CryptoJsService
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
      rowStyle: { textAlign: 'left' },
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
    this.swalOptions = {
      confirmButtonText: this.translate.instant('buttons.confirm'),
      cancelButtonText: this.translate.instant('buttons.cancel'),
    };

    this.searchFieldOptions = [
      {
        label: this.translate.instant('motie_asset_manage.name'),
        field: 'assetNm',
        value_type: 'like'
      },
      {
        label: this.translate.instant('motie_asset_manage.ip'),
        field: 'assetIps',
        value_type: 'like'
      }
    ];
    let vm = this;
    this.columnDefs = [
      {
        headerName: this.translate.instant('motie_asset_manage.power'), //'ID',
        field: 'powerGenName',
        width: 120,
        suppressFilter: true,
        colVisible: true/*,
        cellRenderer: function(params) {
          return params.data.power.name;
        }*/
      },
      {
        headerName: this.translate.instant('motie_asset_manage.hogi'), //'User Name',
        field: 'assetHogiCodeName',
        width: 80,
        colVisible: true
      },

      {
        headerName: this.translate.instant('motie_asset_manage.asset_high_class_code'), //'User Name',
        field: 'assetHighClassName',
        width: 80,
        colVisible: true
      },
      {
        headerName: this.translate.instant('motie_asset_manage.dev_type'), //'User Name',
        field: 'mnufcturCor',
        width: 100,
        colVisible: true
      },
      {
        headerName: this.translate.instant('motie_asset_manage.assetClass'), //'User Name',
        field: 'assetClassName',
        width: 150,
        colVisible: true
      },
      {
        headerName: this.translate.instant('motie_asset_manage.name'), //'User Name',
        field: 'assetNm',
        width: 150,
        colVisible: true
      },
      {
        headerName: this.translate.instant('motie_asset_manage.asset_position'), //'User Name',
        field: 'assetPosition',
        width: 100,
        colVisible: true
      },
      {
        headerName: this.translate.instant('motie_asset_manage.ip'), //'User Name',
        field: 'assetIps',
        width: 250,
        colVisible: true
        /*cellRenderer: function(d) {
          let assetIps = [];
          d.data.motieAssetIp.map(ip => assetIps.push(ip.assetIp));
          return assetIps.toString();
        }*/
      },
      {
        headerName: this.translate.instant('motie_asset_manage.fstDttm'), // 'Create Date',
        field: 'fstDttm',
        width: 130,
        colVisible: true,
        suppressFilter: true,
        cellRenderer: function(params) {
          //return params.value
         return params.value == null ? params.value : moment(params.value).utc().format('YYYY-MM-DD HH:mm:ss');
        }
      },
      {
        headerName: this.translate.instant('motie_asset_manage.lstDttm'), // 'Last Updated',
        field: 'lstDttm',
        width: 130,
        colVisible: false,
        hide: true,
        suppressFilter: true,
        cellRenderer: function(params) {
          return params.value == null ? params.value : moment(params.value).utc().format('YYYY-MM-DD HH:mm:ss');
        }
      }];

    // 권한이 있을경우 수정 삭제 추가
    // if (this.roleCheck()) {
      this.columnDefs = [
        ...this.columnDefs,
        {
          headerName: this.translate.instant('buttons.update'), // 'Update',
          field: 'modi',
          width: 50,
          colVisible: true,
          suppressSorting: true,
          suppressFilter: true,
          suppressResize: true,
          cellStyle: { textAlign: 'center', padding: '0' },
          cellRendererFramework: UpdateButtonComponent
        },
        {
          headerName: this.translate.instant('buttons.delete'), // 'Delete',
          field: 'del',
          width: 50,
          colVisible: true,
          suppressSorting: true,
          suppressFilter: true,
          suppressResize: true,
          cellStyle: { textAlign: 'center', padding: '0' },
          cellRendererFramework: DeleteButtonComponent
        }
        ];
    // }

    this.onWindowRealese({});
  }

  ngOnInit(): void {

    this.gridHeight = this.gridWrap.nativeElement.clientHeight + 'px';

    //this.store.dispatch( new ActionDeviceManageRead({}));
    this.params = { filter: JSON.stringify({}) };
    this.store.dispatch(new ActionDeviceManageRead(this.params));

    this.store.select(selectorDeviceManage)
      .pipe(
        takeUntil(this.unsubscribe$),
        filter((res) => {
          return res.contents !== undefined;
        }),
        map(res => res.contents)
      )
      .subscribe((datas: any) => {
        this.loading = datas.loading;
        if (datas.data != undefined) {
          _.map(datas.data.data , d => {
            const assetIps = [];
            _.map(d.motieAssetIp , ip => {
              assetIps.push(this.cryptoJsService.decrypt(ip.assetIp));
            });
            d.assetIps = assetIps.toString();
            // 아이피리스트 가독성을 위한 파이프 삽입
            d.assetIps = d.assetIps.replace( /,/g, '  |  ');

            const macAddrs = [];
            _.map(d.motieAssetIp , mac => {
              macAddrs.push(mac.deviceMac);
            });
            d.assetMacAddrs = macAddrs.toString();
            d.assetMacAddrs = d.assetMacAddrs.replace( /,/g, ' | ');
          });
          this.rowData$ = datas.data;
          this.pager.totalCnt = datas.data.total_cnt;
          this.onWindowRealese({});
        }
      });
  }

  getTemplate() {
    let template = this.utilService.getState(this.store, 'home').template.contents;
    if (template === undefined || template.contents === undefined) {
      setTimeout(() => {
        this.getTemplate();
      }, 1);
    } else {
      this.template = template.contents.data;
      // console.log(this.template);
    }
  }

  findTemplate(id: number) {
    let template: any = _.find(this.template, { templateId: id });
    return template.name + '(' + template.company + ', ' + template.product + ')';
  }

  search(event: any) {
    let likeChange = (v) => {
      return { like: '%' + v + '%' };
    };
    this.filter = R.map(likeChange, event);
    this.params = { filter: JSON.stringify(Object.assign({ where: this.filter })) };
    this.store.dispatch(new ActionDeviceManageRead(this.params));
  }

  // updateUser(d:any) {
  //   // console.log(d);
  // }

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
    this.params = { filter: JSON.stringify({ order: 'assetId desc' }) };
    this.store.dispatch(new ActionDeviceManageRead(this.params));
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
    this.store.dispatch(new ActionDeviceManageRead(this.params));
  }

  clearValue() {
    this.seachControl.setValue('');
    this.searchValue = '';
  }

  ngOnDestroy() {
    // this.store.dispatch( new ActionDeviceManageClear());
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.store.dispatch(new ActionDeviceManageClear());
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


  updateRow(d: DeviceManageRow, mode: string) {
    let dialogRef = this.dialog.open(DeviceManageDialog, { width: '1000px', data: { mode: mode, data: d } });
    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        this.getData({});
      } //// console.log(result);
    });
  }

  deleteItem(d: DeviceManageRow) {
    this.store.dispatch(new ActionDeviceManageDelete(d));
  }

  gridClick(e) {
    if (e.colDef.field === 'del') {
      if (Array.isArray(e.data.motieAssetIp)) {
        let assetIps = [];
        e.data.motieAssetIp.map(ip => assetIps.push(ip.assetIp));
        e.data.motieAssetIp = assetIps.toString();
      }
      this.updateRow(e.data, e.colDef.field);
    }
    if (e.colDef.field === 'modi') {
      if (Array.isArray(e.data.motieAssetIp)) {
        let assetIps = [];
        e.data.motieAssetIp.map(ip => assetIps.push(ip.assetIp));
        e.data.motieAssetIp = assetIps.toString();
      }
      this.updateRow(e.data, e.colDef.field);
    }
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

  //자산 csv 다운로드
  downloadDevice(type:string) {
    let params = {
      ...this.rowData$,
      rowData$: JSON.stringify(this.rowData$),
      doc_type: type
    };
    this.api.downloadApi('get', '/Exports/deviceExport', params);
  }

  downloadFile() {
    let fileUrl =
      !env.production
        ? `${API_BASE_URL}/api/fileData/excel/download`
        : `/api/fileData/excel/download`;
    let token:string;
    this.store.pipe(select(selectorLogins)).subscribe(res => {
      token = res.contents.id
    });
    let accessToken = `?access_token=${token}`;
    window.open(`${fileUrl}/motie_sample_file.xlsx${accessToken}`);
  }

  uploadFile() {
    let dialogRef = this.dialog.open(DeviceManagementFileUploadDialog, { width: '600px', data: this.rowData$, disableClose: true});
    dialogRef.afterClosed().subscribe(result => {
      if (result == 'success') {
        this.getData({});
      }
    });
  }
}


@Component({
  selector: 'device-manage-dialog',
  templateUrl: './device-management.dialog.template.html',
  styleUrls: ['./device-management.style.scss']
})
export class DeviceManageDialog implements OnInit, OnDestroy {
  title: any;
  Form: FormGroup;
  assetNm: string = this.data.data.assetNm;
  unsubscribe$: Subject<void> = new Subject<void>();
  template: any;
  powerSupply: any;

  ipMsg: string;
  ipValidation: boolean;

  MacerrorMassage : boolean = false;
  IperrorMassage : boolean = false;

  @ViewChild('ipValue') ipValue: ElementRef;
  @ViewChild('assetNmValue') assetNmValue: ElementRef;
  @ViewChild('stationIdValue') stationIdValue: ElementRef;
  @ViewChild('powerGenIdValue') powerGenIdValue: ElementRef;
  @ViewChild('descriptionValue') descriptionValue: ElementRef;

  constructor(
    private store: Store<any>,
    public dialogRef: MatDialogRef<DeviceManageDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { mode: string; data: DeviceManageRow; },
    private translate: TranslateService,
    private fb: FormBuilder,
    private utilService: utilService,
    private msgs: MessagesService,
    private api: ApiService,
    private cryptoJsService : CryptoJsService
  ) {
    if (this.data.mode === 'new') {
      this.title = translate.instant('buttons.add');
    } else if (this.data.mode === 'modi') {
      this.ipValidation = true;
      this.title = translate.instant('buttons.modify');
    } else if (this.data.mode === 'del') {
      this.title = translate.instant('buttons.delete');
    }
    this.createForm();
  }


  /*
  * cmncode list
  * */
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
    let objAcquireDate;
    if (this.data.data.acquireDate !== null && this.data.data.acquireDate !== undefined) {
      let arrAcquireDate = this.data.data.acquireDate.split('-');
      objAcquireDate = { year: parseInt(arrAcquireDate[0]), month: parseInt(arrAcquireDate[1]), day: parseInt(arrAcquireDate[2]) };
    }

    let array = this.data.data.motieAssetIp.split(',');
    let ips = '';
    array.forEach((d,i) => {
      if(i == array.length - 1) {
        ips +=  this.cryptoJsService.decrypt(d);
      } else {
        ips +=  this.cryptoJsService.decrypt(d) + ',';
      }
    });

    this.data.data.motieAssetIp = ips;

    const ipPattern = '(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)';
    this.Form = this.fb.group({ //자산ip의 id킷값 추가
      assetId: [this.data.data.assetId],
      assetNm: [this.data.data.assetNm, Validators.required],
      stationId: [this.data.data.stationId, Validators.required],
      // hostInfo: [this.data.data.hostInfo, Validators.required],
      mnufcturCor: [this.data.data.mnufcturCor, Validators.required],
      assetType: [this.data.data.assetType, Validators.required],
      assetProtocol: [this.data.data.assetProtocol, Validators.required],
      assetSnNum: [this.data.data.assetSnNum, Validators.required],
      assetFirmwareVer: [this.data.data.assetFirmwareVer, Validators.required],
      assetModelNm: [this.data.data.assetModelNm, Validators.required],
      assetPosition: [this.data.data.assetPosition, Validators.required],
      assetHogiCode: [this.data.data.assetHogiCode, Validators.required],
      assetClassCode: [this.data.data.assetClassCode, Validators.required],
      // responsibilityUser: [this.data.data.responsibilityUser, Validators.required],
      // operatorUser: [this.data.data.operatorUser, Validators.required],
      // operatorDeptId: [this.data.data.operatorDeptId, Validators.required],
      acquireDate: [objAcquireDate, Validators.required],
      assetUseYsno: [this.data.data.assetUseYsno, Validators.required],
      assetMacAddr: [this.data.data.assetMacAddr],
      // assetImportanceId: [this.data.data.assetImportanceId, Validators.required],
      motieAssetIp: [this.data.data.motieAssetIp, Validators.required],
      powerGenId: [this.data.data.powerGenId, Validators.required],
      os: [this.data.data.os, Validators.required], //주석!!
      assetHighClassCode : [this.data.data.assetHighClassCode, Validators.required],
      assetIp:[],
      id: [this.data.data.id],
      assetMacAddrs: [this.data.data.assetMacAddrs]
      // assetIps: [this.data.data.assetIps]
    });
  }

  ngOnInit() {
    this.store.select(selectorDeviceManage)
      .pipe(
        takeUntil(this.unsubscribe$),
        filter(res => res.update !== undefined),
        map(res => res.update)
      )
      .subscribe((datas: any) => {
        this.store.dispatch(new ActionDeviceManageUpdateClear());
        this.dialogRef.close('success');
      });

    this.getPwrInfo('/MotiePwrInfos', '');
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

  getPwrInfo(path: string, param: any) {
    this.api.API('get', path, param).pipe(
      distinctUntilChanged(),
      debounceTime(500),
      map(res => res)
    )
      .subscribe(res => {
        this.pwrInfoList = res;
        this.stationNmList = _.filter(this.pwrInfoList, { 'gubun': 'S' });
        if (this.data.data.stationId !== null) {
          this.stationIdChange(this.data.data.stationId);
        }
      }, err => {
        this.msgs.error(err);
      });
  }

  /*ip validate 체크*/
  ipValidate(e) {
    if (this.Form.controls.motieAssetIp.value === '') {
      this.ipMsg = '';
      this.ipValidation = false;
      return false;
    }
    const arrAssetIp = this.Form.controls.motieAssetIp.value.split(',');
    for (let assetIp of arrAssetIp) {
      if (!/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/i.test(assetIp)) {
          this.ipMsg = this.translate.instant('motie_asset_manage.ip_msg');
          this.ipValidation = false;
          return false;
        break;
      } else {
        this.ipMsg = '';
        this.ipValidation = true;
      }
    }
  }

  onSubmit() {
    if (this.data.mode === 'del') { // 삭제
      this.data.data.state = 'D';
      this.store.dispatch(new ActionDeviceManageDelete(this.data.data));
    } else {
      if (!this.Form.dirty && !this.Form.valid) {
        return;
      }
      this.data.data = this.prepareSaveDept();
      if (this.data.data.assetNm.trim() === '') { // 공백만 있을경우
        this.msgs.warning({ title: '장비명 입력값 확인', message: '장비명 입력값을 확인하시기 바랍니다.' });
        this.assetNmValue.nativeElement.focus();
        /*      } else if (this.data.data.description.trim() === '') {
                this.msgs.warning({ title: '장비설명 입력값 확인', message: '장비설명 입력값을 확인하시기 바랍니다.' });
                this.descriptionValue.nativeElement.focus();*/
      } else if (!this.ipValidation) {
        this.msgs.warning({ title: 'IP 입력값 확인', message: 'ip 입력값을 확인하시기 바랍니다.' });
        this.ipValue.nativeElement.focus();
      } else {
        if (this.data.mode === 'new') { // 추가
          this.data.data.state = 'C';
          this.store.dispatch(new ActionDeviceManageCreate(this.data.data));
        } else if (this.data.mode === 'modi') { // 수정
          this.data.data.state = 'U';
          this.store.dispatch(new ActionDeviceManageUpdate(this.data.data));
        }
      }
    }
  }

  prepareSaveDept(): any {
    const formModel = this.Form.value;

    const saveDept: { //자산ip의 id킷값 추가
      assetId?             : number;
      assetNm              : string;
      stationId            : string;
      powerGenId           : string;
      //hostInfo             : string;
      motieAssetIp         : string;
      mnufcturCor          : string;
      assetType            : string;
      assetProtocol        : string;
      assetSnNum           : string;
      assetFirmwareVer     : string;
      assetModelNm         : string;
      assetPosition        : string;
      assetHogiCode        : string;
      assetClassCode       : string;
      assetHighClassCode   : string;
      //responsibilityUser   : string;
      //operatorUser         : string;
      //operatorDeptId       : string;
      acquireDate          : string;
      assetUseYsno         : string;
      assetMacAddr         : string;
      //assetImportanceId    : string;
      os                   : string
      fstUser              : string;
      lstUser              : string;
      fstDttm              : string;
      lstDttm              : string;
      assetIp              : string;
      id                      : number;
    }
      = {
      assetId              : this.data.data.assetId,
      assetNm              : formModel.assetNm            as string,
      stationId            : formModel.stationId          as string,
      powerGenId           : formModel.powerGenId         as string,
      //hostInfo             : formModel.hostInfo           as string,
      motieAssetIp         : formModel.motieAssetIp       as string,
      mnufcturCor          : formModel.mnufcturCor        as string,
      assetType            : formModel.assetType          as string,
      assetProtocol        : formModel.assetProtocol      as string,
      assetSnNum           : formModel.assetSnNum         as string,
      assetFirmwareVer     : formModel.assetFirmwareVer   as string,
      assetModelNm         : formModel.assetModelNm       as string,
      assetPosition        : formModel.assetPosition      as string,
      assetHogiCode        : formModel.assetHogiCode      as string,
      assetClassCode       : formModel.assetClassCode     as string,
      assetHighClassCode   : formModel.assetHighClassCode     as string,
      //responsibilityUser   : formModel.responsibilityUser as string,
      //operatorUser         : formModel.operatorUser       as string,
      //operatorDeptId       : formModel.operatorDeptId     as string,
      acquireDate          : formModel.acquireDate        as string,
      assetUseYsno         : formModel.assetUseYsno       as string,
      assetMacAddr         : formModel.assetMacAddr       as string,
      //assetImportanceId    : formModel.assetImportanceId  as string,
      os                   : formModel.os                 as string,
      fstUser              : formModel.fstUser            as string,
      lstUser              : formModel.lstUser            as string,
      fstDttm              : formModel.fstDttm            as string,
      lstDttm              : formModel.lstDttm            as string,
      assetIp              : ''                           as string,
          id                  : formModel.id
    };
    return saveDept;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  get f(): any {
    return this.Form.controls;
  }

  stationIdChange(newValue) {
    this.powerGenNmList = _.filter(this.pwrInfoList, (d) => {
      return d.gubun === 'P' && d.powerGenId !== null && d.powerGenId.includes(newValue);
    });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onMacClick() {
    this.MacerrorMassage = true;
    this.IperrorMassage = false;
  }

  onIpClick() {
    this.IperrorMassage = true;
    this.MacerrorMassage = false;
  }
}

/*
*
* Device Management File Upload Dialog Component --------------------------------------------------------------------------
*
* */
// import * as _ from 'lodash';
import * as XLSX from 'xlsx';
import {SwalComponent} from "@toverux/ngx-sweetalert2";
import {environment as env} from "@env/environment";
import {selectorLogins} from "@app/static/login/login.reducer";
import {CryptoJsService} from "@app/core/service/cryptoJs.service";

@Component({
  selector: 'device-management-file-upload-dialog',
  templateUrl: './device-management-file-upload.dialog.template.html',
  styleUrls: ['./device-management.style.scss']
})
export class DeviceManagementFileUploadDialog implements OnInit, OnDestroy {

  unsubscribe$: Subject<void> = new Subject<void>();
  public uploader:FileUploader;
  public hasBaseDropZoneOver:boolean = false;
  loading:boolean = false;
  isDisabledUploadBtn:boolean = false;

  params :any;
  swalOptions:any = {type: 'error', title: '자산 파일 업로드 오류', html: null, text : null, confirmButtonText: '확인', allowEscapeKey :false, allowOutsideClick: false, width: 600};
  @ViewChild('searchFile') fileInput:ElementRef;
  @ViewChild('errorSwal') private errorSwal: SwalComponent;

  constructor(
    public fileUploadDialogRef: MatDialogRef<DeviceManagementFileUploadDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private renderer:Renderer,
    private store: Store<any>,
    private msgs: MessagesService,
    private translate: TranslateService,
    private utilService: utilService,
    private api: ApiService,
  ) { }

  ngOnInit () {
    // console.log(this.data);
    // let queueLimit = 1;
    let localServer = window.location.host;
    let baseUrl = localServer == 'localhost:4200' ? API_BASE_URL + '/api' : '/api';
    // // let token = this.localStorageService.getItem('APPS.LOGINS.CONTENTS');
    //
    this.uploader = new FileUploader({
      // url: baseUrl + URL + '?access_token=' + token.id,
      url: baseUrl + URL ,
      autoUpload: false
    });

    this.uploader.onAfterAddingFile = () => {
      if (this.uploader.queue.length > 1) {
        this.uploader.removeFromQueue(this.uploader.queue[0]);
      }
    };

    // this.uploader.onWhenAddingFileFailed = (item, filter) => {
    //   let message = '';
    //   switch (filter.name) {
    //     case 'queueLimit':
    //       message = 'Permitido o envio de no máximo ' + queueLimit + ' arquivos';
    //       break;
    //     case 'fileSize':
    //       message = 'O arquivo ' + item.name + ' possui ' + this.formatBytes(item.size) + ' que ultrapassa o tamanho máximo permitido de '; // + this.formatBytes(maxFileSize);
    //       break;
    //     default:
    //       message = 'Erro tentar incluir o arquivo';
    //       break;
    //   }
    // };

    this.store.select(selectorDeviceManageFileUpdate)
      .pipe(
        takeUntil(this.unsubscribe$),
        filter(res => res !== undefined)
      )
      .subscribe((datas: any) => {
        // this.loading = date;
        this.loading = datas.loading;
        // let msg = {title: '자산 일괄 등록 완료', message: '자산 일관등록이 완료되었습니다.'};
        // this.msgs.success(msg);
        this.fileUploadDialogRef.close('success');
        this.store.dispatch( new ActionDeviceManageFileUploadClear());
      });

    this.getPwrInfo('/MotiePwrInfos', '');
    this.getCmnCode();
  }

  uploadFile() {
    this.store.dispatch( new ActionDeviceManageFileUpload(this.params));
  }

  /*
  * cmnCode list
  * */
  pwrInfoList: any = [];
  stationNmList: any = [];
  powerGenNmList: any = [];
  cmnCodeList = {
    hogiCmnCodeList: { param: { where: { gubunKey: 'div_hogi', object: 'DTI' } } ,codeList:[] }, // 호기 없음 99 필요
    divGubunCmnCodeList: { param: { where: { gubunKey: 'div_gubun', object: 'DTI' } } ,codeList:[]}, // 분류
    // assetImportanceCodeList: { param: { where: { gubunKey: 'asset_importance', object: 'DTI' } } ,codeList:[]}, // 자산 중요도 (상, 중, 하)
    assetProtocolCodeList: { param: { where: { gubunKey: 'asset_protocol', object: 'DTI' } } ,codeList:[]},
    osCodeList: { param: { where: { gubunKey: 'div_os', object: 'DTI' } } ,codeList:[]}, // Window
    manufCodeList: { param: { where: { gubunKey: 'div_manuf', object: 'DTI' } } ,codeList:[]}, // 제조사 기타 정보 필요
    highClassCodeList: { param: { where: { gubunKey: 'div_high_gubun', object: 'DTI' } } ,codeList:[]} // 보일러, 터빈
  };

  showImageBrowseDlg() {
    let event = new MouseEvent('click', {bubbles: true});
    this.renderer.invokeElementMethod(this.fileInput.nativeElement, 'dispatchEvent', [event]);
  }


  onInputClick(event) {
    event.target.value ='';
    event.target.result ='';
  }

  onFileChange(event: any) {
    let excelToJson = {};
    // let headerJson = {};
    /* wire up file reader */
    const target: DataTransfer = <DataTransfer>(event.target);
    const reader: FileReader = new FileReader();
    reader.readAsBinaryString(target.files[0]);
    // console.log("filename", target.files[0].name);
    excelToJson['filename'] = target.files[0].name;
    reader.onload = (e: any) => {
      /* create workbook */
      const binaryStr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(binaryStr, { type: 'binary' ,cellDates: true});
      // for (let i = 0; i < wb.SheetNames.length; ++i) {
      // 첫번재 시트 데이터만 가져오기
      const wsName: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsName];

      const excelData = XLSX.utils.sheet_to_json(ws); // to get 2d array pass 2nd parameter as object {header: 1}
      const headers = this.getHeaderRow(ws);
      this.changeDataAndValidation(excelData, headers);

      // 엑셀 IP 중복 처리
      /*iconst overlapExcelData = [];
      f(excelData.length > 0) {
        excelData.forEach((value,index) => {
          if(index == 0) {
            overlapExcelData.push(value);
          } else {
            let isData = _.filter(overlapExcelData,d => d['아이피'] && d['아이피'].trim() == value['아이피'].trim());
            if(isData.length == 0) {
              overlapExcelData.push(value);
            }
          }
        });
        const headers = this.getHeaderRow(ws);
        this.changeDataAndValidation(overlapExcelData, headers);
      }*/

      // headers.forEach(row => {
      //   console.log(headers)
      // })
      // headerJson[`header${i + 1}`] = headers;
    }
    // this.excelToJson['headers'] = headerJson;
    // console.log(this.excelToJson);
    // };
  }

  changeDataAndValidation(data, headerList) {
    this.loading = true;
    this.params = [];
    let errorList = [];
    let codeNames = this.translate.instant('motie_asset_manage');

    data.forEach((row, index) => {
      let copyHeaderList = [...headerList];
      copyHeaderList.forEach(header => {

        // if (header !='아이피' && (row[header] == null || row[header] == undefined)) {
        if (row[header] == null || row[header] == undefined) {
          errorList.push(`[ ${row['name'] || row['자산명'] || "자산명 없음"} ] "${ header }"은 필수 입력값 입니다.`);
          return;
        } else {
          let rowKey = Object.keys(row).find(key => key == header);
          let codeKeyName = rowKey === 'OS'? rowKey.toLowerCase() : Object.keys(codeNames).find(key => codeNames[key] == header);
          if (codeKeyName) {
            row[codeKeyName] = row[header];
            delete row[header];

            // 데이터 Validation check------------------------------------------------ start
            let sameValue = null;
            let addKeyName = 'codeID';
            let searchKeyName = 'codeNM';
            let codeDataList;

            let assetName = `[ ${row['name'] || row['자산명'] || '자산명 없음'} ]`;

            let isPass = false;
            switch (codeKeyName) {
              case 'station':
                addKeyName = 'stationId';
                searchKeyName = 'stationNm';
                codeDataList = this.stationNmList;
                break;
              case 'power':
                addKeyName = 'powerGenId';
                searchKeyName = 'powerGenNm';
                let checkEng = /[a-zA-Z]/;
                if( row.station && checkEng.test(row.station) ) {
                  codeDataList = this.stationIdChange(row.station);
                } else {
                  isPass = true;
                  errorList.push(`${assetName} "발전사" 입력값 및 칼럼 순서를 확인해주세요.( 칼럼 순서 : 발전사 | 발전본부)`);
                }
                break;
              case 'asset_class' :
                codeDataList = this.cmnCodeList.divGubunCmnCodeList.codeList;
                break;
              case 'aseet_protocol': //'assetProtocol':
                codeDataList = this.cmnCodeList.assetProtocolCodeList.codeList;
                break;
              case 'mnufctur_cor':
                codeDataList = this.cmnCodeList.manufCodeList.codeList;
                break;
              case 'os':
                codeDataList = this.cmnCodeList.osCodeList.codeList;
                break;
              // case 'asset_class':
              //   codeDataList = this.cmnCodeList.divGubunCmnCodeList.codeList;
              //   break;
              case 'asset_high_class_code' :
                codeDataList = this.cmnCodeList.highClassCodeList.codeList;
                break;
              case 'hogi' :
                codeDataList = this.cmnCodeList.hogiCmnCodeList.codeList;
                let codeDataListStr ='';
                if(typeof row[codeKeyName] =='number' && row[codeKeyName] > 5) {
                  isPass = true;
                  codeDataList.forEach((code, index) => {
                    if(index == codeDataList.length - 1) {
                      codeDataListStr = codeDataListStr + code[searchKeyName]
                    } else {
                      codeDataListStr = codeDataListStr + code[searchKeyName] + ', '
                    }
                  });
                  errorList.push(`${assetName} "${codeNames[codeKeyName]}" 입력값을 확인해주세요. ( 입력값: ${row[codeKeyName]} | 코드 목록 리스트: ${codeDataListStr == '' || codeDataListStr.length == 0 ? '없음' : codeDataListStr} )`);
                } else {
                  isPass = row[codeKeyName] != '없음';
                }
                break;

              case 'acquire_date':
                isPass = true;
                if ((row[codeKeyName] instanceof Date )) {
                  row[codeKeyName] = moment(Number(row[codeKeyName])).format("YYYY-MM-DD");
                } else {
                  errorList.push(`${assetName} "${codeNames[codeKeyName]}" 입력값을 확인하세요.(입력값 : ${row[codeKeyName]} | ex 2021-01-01)`);
                }
                break;

              case 'asset_mac_addr':
                isPass = true;
                // let macRegex = /^([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}(,([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2})*$/;
                let macRegex = /^([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}(,([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2})*$/;
                let rowMac = (row[codeKeyName] + "").trim();
                if( row[codeKeyName] && macRegex.test(rowMac) ) {
                  row[codeKeyName] = rowMac;
                } else {
                  errorList.push(`${assetName} "MAC ADDRESS" 입력값을 확인하세요.(입력값 : ${row[codeKeyName]})`);
                }
                break;

              case 'ip':
                isPass = true;
                let ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/i;
                let rowIP = (row[codeKeyName] + "").trim();
                if( row[codeKeyName] && ipRegex.test(rowIP) ) {
                  row[codeKeyName] = rowIP;
                } else {
                  errorList.push(`${assetName} "IP" 입력값을 확인하세요.(입력값 : ${row[codeKeyName]})`);
                }
                break;

              default :
                isPass = true;
                break;
            }

            if(!isPass) {
              if(codeDataList != undefined  && codeDataList.length > 0) {
                sameValue = _.find(codeDataList, code => code[searchKeyName] == row[codeKeyName] );
                if(sameValue) {
                  row[codeKeyName] = sameValue[addKeyName];
                } else {
                  let codeDataListStr = '';
                  codeDataList.forEach((row, index) => {
                    if(index == codeDataList.length - 1) {
                      codeDataListStr = codeDataListStr + row[searchKeyName]
                    } else {
                      codeDataListStr = codeDataListStr + row[searchKeyName] + ', '
                    }
                  });
                  errorList.push(`${assetName} "${codeNames[codeKeyName]}" 입력값을 확인해주세요. ( 입력값: ${row[codeKeyName]} | 코드 목록 리스트: ${codeDataListStr == '' || codeDataListStr.length == 0 ? '없음' : codeDataListStr} )`);
                }
              } else {
                errorList.push(`${assetName} 코드 데이터리스트가 존재하지 않습니다.(${codeNames[codeKeyName]})`);
              }
            }

            // 데이터 Validation check------------------------------------------------ end
          } else {
            errorList.push(`[ ${row['name'] || "자산명 없음"} ] "${ header }"은 칼럼명을 확인해주세요.`);
          }
        }
        copyHeaderList = _.filter(copyHeaderList, d => d != header);
      });

      let saveFormatData = this.prepareSaveDept(row);
      this.params.push(saveFormatData);
      // console.log('pwrInfoList------------', this.pwrInfoList);
      // console.log('stationNmList------------', this.stationNmList);
      // console.log('powerGenNmList------------', this.powerGenNmList);
      if(index == data.length -1) {
        if(errorList.length == 0) {
          this.isDisabledUploadBtn = false;
        } else {
          this.isDisabledUploadBtn = true;
          this.errorSwal.html = errorList.join('<br>');
          this.errorSwal.show();
        }
        this.loading = false;
      }
    });
  }

  getHeaderRow(sheet) {
    let headers = [];
    let range = XLSX.utils.decode_range(sheet['!ref']);
    let C, R = range.s.r; /* start in the first row */
    /* walk every column in the range */
    for (C = range.s.c; C <= range.e.c; ++C) {
      let cell = sheet[XLSX.utils.encode_cell({ c: C, r: R })]; /* find the cell in the first row */
      // console.log("cell",cell)
      let hdr = "UNKNOWN " + C; // <-- replace with your desired default
      if (cell && cell.t) {
        hdr = XLSX.utils.format_cell(cell);
        headers.push(hdr);
      }
    }
    return headers;
  }

  getPwrInfo(path: string, param: any) {
    this.api.API('get', path, param).pipe(
      distinctUntilChanged(),
      debounceTime(500),
      map(res => res)
    )
      .subscribe(res => {
        this.pwrInfoList = res;
        this.stationNmList = _.filter(this.pwrInfoList, { 'gubun': 'S' });
        // if (this.data.data.stationId !== null) {
        //   this.stationIdChange(this.data.data.stationId);
        // }
      }, err => {
        this.msgs.error(err);
      });
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

  stationIdChange(newValue): any {
    return _.filter(this.pwrInfoList, (d) => {
      return d.gubun === 'P' && d.powerGenId !== null && d.powerGenId.includes(newValue);
    });
  }

  // stationId -> station,
  prepareSaveDept(data: any) : any {
    return  {
      assetNm              : data.name            as string,
      stationId            : data.station          as string,
      powerGenId           : data.power         as string,
      //hostInfo             : formModel.hostInfo           as string,
      motieAssetIp         : data.ip       as string,
      mnufcturCor          : data.mnufctur_cor        as string,
      assetType            : data.asset_type          as string,
      assetProtocol        : data.aseet_protocol      as string,
      assetSnNum           : data.asset_sn_num         as string,
      assetFirmwareVer     : data.asset_firmware_ver   as string,
      assetModelNm         : data.asset_model_nm       as string,
      assetPosition        : data.asset_position      as string,
      assetHogiCode        : data.hogi      as string,
      assetClassCode       : data.asset_class     as string,
      assetHighClassCode   : data.asset_high_class_code     as string,
      //responsibilityUser   : formModel.responsibilityUser as string,
      //operatorUser         : formModel.operatorUser       as string,
      //operatorDeptId       : formModel.operatorDeptId     as string,
      acquireDate          : data.acquire_date        as string,
      assetUseYsno         : data.asset_use_ysno       as string,
      assetMacAddr         : data.asset_mac_addr       as string,
      //assetImportanceId    : formModel.assetImportanceId  as string,
      os                   : data.os                 as string,
      // fstUser              : data.fstUser            as string,
      // lstUser              : data.lstUser            as string,
      // fstDttm              : data.fstDttm            as string,
      // lstDttm              : data.lstDttm            as string,
      // assetIp              : data.assetIp                          as string
    };
  }

  onNoClick (): void {
    this.fileUploadDialogRef.close();
  }

  ngOnDestroy(){
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
