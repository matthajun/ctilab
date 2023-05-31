/**
 * 장비 관리 콤포넌트
 * @component MotiePcabComponent
 * @template './device-management.template.html',
 * @style './device-management.style.scss'
 * */

import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDatepicker } from '@angular/material';
import {
  Component, ElementRef, HostListener, Inject, OnDestroy, OnInit, ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { Observable } from 'rxjs';
import { MotiePcabRow } from './device-management.model';
import { takeUntil, filter, map, distinctUntilChanged, debounceTime, tap } from 'rxjs/operators';
import { select, Store } from '@ngrx/store';
import * as moment from 'moment';
import * as R from 'ramda';
import * as _ from 'lodash';
import { selectorMotiePcab } from './motie-pcab.reducer';
import {
  ActionMotiePcabRead,  ActionMotiePcabClear
} from './motie-pcab.actions';
import { GridOptions } from 'ag-grid';
import { Subject } from 'rxjs';
import { UpdateButtonComponent } from '../../shared/ag-grid.component/update-button.component';
import { DeleteButtonComponent } from '../../shared/ag-grid.component/delete-button.component';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { utilService } from '../../core/service/util.service';
import { MessagesService } from '../../core/service/messages';
import { roleCheckService } from '@app/shared/role-check.service';
import { ApiService } from '@app/core/service/commons';
import { environment } from '@env/environment';
import { API_BASE_URL } from '@app/core/service/constants';
import {selectorLogins} from '@app/static/login/login.reducer';


@Component({
  selector: 'motie-pcab',
  templateUrl: './motie-pcab.template.html',
  styleUrls: ['./motie-pcab.style.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MotiePcabComponent implements OnInit, OnDestroy {

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
  sortField:string = 'date_time';
  sortOrder:string = 'desc';
  filter: any;
  currentPage: number = 1;

  loading: boolean = true;

  // Pagination Params
  totalCnt: number;
  pageSize: number = 20;
  pager: any = {
    currentPage: 1,
    endIndex: 1,
    endPage: 1,
    pageSize: 20,
    pages: [],
    startIndex: 0,
    startPage: 1,
    totalItems: 1,
    totalPages: 1
  };


  template: any;
  powerSupply: any = []; // 계통운영센터

  constructor(
    private store: Store<any>,
    public dialog: MatDialog,
    private fb: FormBuilder,
    private translate: TranslateService,
    private utilService: utilService,
    private role: roleCheckService
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
    this.searchFieldOptions = [
      {
        label: '파일명',
        field: 'fileName',
        type: 'text',
        value_type: 'like'
      }
    ];
    let vm = this;
    this.columnDefs = [
      // {
      //   headerName: '발전사', //'User Name',
      //   field: 'stationName',
      //   width: 100,
      //   colVisible: true
      // },
      {
        headerName: '발전본부', //'User Name',
        field: 'powerGenName',
        width: 100,
        colVisible: true
      },
      {
        headerName: '호기', //'User Name',
        field: 'hogi',
        width: 80,
        colVisible: true
      },
      {
        headerName: '제조사', //'User Name',
        field: 'mnfcfr',
        width: 80,
        colVisible: true
      },
      {
        headerName: '파일명', //'User Name',
        field: 'fileName',
        width: 150,
        colVisible: true
      },
      {
        headerName: '수신일시', // 'Create Date',
        field: 'dateTime',
        width: 130,
        colVisible: true,
        suppressFilter: true,
        cellRenderer: function(params) {
          const stringToDateFormat = (gubun, datestring)=> {
            if(datestring === null || datestring.length !== 14)return '';
            const year = datestring.substring(0,4);
            const month = datestring.substring(4,6);
            const day = datestring.substring(6,8);
            const hour = datestring.substring(8,10);
            const min = datestring.substring(10,12);
            const sec = datestring.substring(12,14);
            return `${year}${gubun}${month}${gubun}${day}${gubun} ${hour}:${min}:${sec}`;
          };
          return params.value == null ? params.value : stringToDateFormat('-',params.value);
        }
      },
      {
        headerName: this.translate.instant('buttons.download'), // 'Update',
        field: 'down',
        width: 50,
        colVisible: true,
        suppressSorting: true,
        suppressFilter: true,
        suppressResize: true,
        cellStyle: {textAlign: 'center', padding: '0'},
        // cellRendererFramework: DownloadButtonComponent
        cellRenderer: function (params) {
          return '<i class="fa fa-download"></i>';
        }
      }
      ];

    this.onWindowRealese({});
  }
  stringToDateFormat(gubun : string, datestring : string){
    if(datestring === null || datestring.length !== 14)return '';
    const year = datestring.substring(0,4);
    const month = datestring.substring(4,6);
    const day = datestring.substring(6,8);
    const hour = datestring.substring(8,10);
    const min = datestring.substring(10,12);
    const sec = datestring.substring(12,14);
    return `${year}${gubun}${month}${gubun}${day}${gubun} ${hour}:${min}:${sec}`;
  }

  ngOnInit(): void {
    this.gridHeight = this.gridWrap.nativeElement.clientHeight + 'px';

    this.filter = { };
    this.rowData$ = this.store.select(selectorMotiePcab)
      .pipe(
        takeUntil(this.unsubscribe$),
        filter(res => res.contents !== undefined),
        map( res =>res.contents),
        tap(res => this.loading =  res.loading)
      )
      .subscribe((datas: any) => {
        this.rowData$ = datas.data;
        this.totalCnt = datas.data.total_cnt;
      });
    this.getData({});
    this.onWindowRealese({});
  }

  setOption(d : any) {
    console.log(d);
    let uniq_type = _.uniq(_.map(d, 'type'));
    let uniq_code = _.uniq(_.map(d, 'code'));
    let type:any = _.find(this.searchFieldOptions, {field: 'type'});
    let code:any = _.find(this.searchFieldOptions, {field: 'code'});
    type.option = _.map(uniq_type, res => {
      return {
    value: res,
      label: res
  }
});
    code.option = _.map(uniq_code, res => {
      return {
        value: res,
        label: res
      }
    });
    console.log(type);
  }

  search(event: any) {
    let likeChange = (v) => {
      return { like: '%' + v + '%' };
    };
    this.filter = R.map(likeChange, event);
    this.params = { filter: JSON.stringify(Object.assign({ where: this.filter })) };
    this.store.dispatch(new ActionMotiePcabRead(this.params));
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

  getData(event:any) {
    let sortField = event.sort_field === undefined ? this.sortField : event.sort_field;
    let sortOrder = event.sort_order === undefined ? this.sortOrder : event.sort_order;
    this.pager.currentPage = event.page === undefined ? this.pager.currentPage : event.page;
    this.pager.pageSize = event.size == undefined ? this.pager.pageSize : event.size;
    let offset = this.pager.pageSize * (this.pager.currentPage - 1);
    let params = { order: sortField + ' ' + sortOrder, limit: this.pager.pageSize, offset: offset };
    this.params = { filter : JSON.stringify(Object.assign(this.filter, params)) };
    this.store.dispatch(new ActionMotiePcabRead(this.params));
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
    this.store.dispatch(new ActionMotiePcabRead(this.params));
  }

  clearValue() {
    this.seachControl.setValue('');
    this.searchValue = '';
  }

  ngOnDestroy() {
    // this.store.dispatch( new ActionMotiePcabClear());
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.store.dispatch(new ActionMotiePcabClear());
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

  gridClick(e) {
    if(e.colDef.field ==='down') {
      let token:string;
      this.store.pipe(select(selectorLogins)).subscribe(res => {
        token = res.contents.id
      });
      let accessToken = `?access_token=${token}`;

      !environment.production ?
        window.open(`${API_BASE_URL}/api/fileData/event_pcap_file/download/${e.data.fileName}${accessToken}`)
        : window.open(`/api/fileData/event_pcap_file/download/${e.data.fileName}${accessToken}`)
    }
  }

  roleCheck(): boolean {
    return this.role.checkRole();
  }


  searchFilter(e:any) {
    _.forEach(this.searchFieldOptions, (v) => {
      if (v.field != undefined) {
        if (e[v.field] === undefined) {
          this.gridOptions.api.destroyFilter(v.field);
        } else {
          let agFilter: any = this.gridOptions.api.getFilterInstance(v.field);
            agFilter.setModel({
              type: v.value_type === 'like' ? 'contains' : 'equals',
              filter: e[v.field]
            });
            this.gridOptions.api.onFilterChanged();
        }
      }
    });
  }
}
