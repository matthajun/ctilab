import {
      Component,
      OnInit,
      OnDestroy,
      HostListener,
      ElementRef,
      ViewChild,
      Input,
      Inject,
      ViewEncapsulation
} from '@angular/core';
import { Store } from '@ngrx/store';
import {Observable, Subject} from 'rxjs';
import {takeUntil, filter, map, distinctUntilChanged, debounceTime} from 'rxjs/operators';
import { ANIMATE_ON_ROUTE_ENTER } from '../../core';
import { GridOptions } from 'ag-grid';
import { utilService } from '../../core/service/util.service';
import * as moment from 'moment';
import * as R from 'ramda';
import { DetailButtonComponent } from '../../shared/ag-grid.component/detail-button.component';
import { UpdateButtonComponent } from '../../shared/ag-grid.component/update-button.component';
import { DeleteButtonComponent } from '../../shared/ag-grid.component/delete-button.component';
import { selectorCommuniWhite } from './communi-white.reducer';
import {
  ActionCommuniWhiteRead, ActionCommuniWhiteUpdate,
  ActionCommuniWhiteUpdateClear, ActionCommuniWhiteDelete, ActionCommuniWhiteCreate
} from './communi-white.actions';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import { CommuniWhiteRow } from './communi-white.model';
import { ToastrService } from 'ngx-toastr';
import {LangChangeEvent, TranslateService} from "@ngx-translate/core";
import * as _ from "lodash";
import {MessagesService} from "../../core/service/messages";
import {ApiService} from "@app/core/service/commons";
import {FormGroup, Validators} from "@angular/forms";
import {CryptoJsService} from "@app/core/service/cryptoJs.service";
import {ActionMotiePcabRead} from "@app/system-management/pcabfile/motie-pcab.actions";

@Component({
      selector: 'report-template',
      templateUrl: './communi-white.template.html',
      styleUrls: ['./communi-white.style.scss']
      //,encapsulation: ViewEncapsulation.None
})
export class CommuniWhiteComponent implements OnInit, OnDestroy {
      @ViewChild('gridWrap') gridWrap:ElementRef;

  unsubscribe$: Subject<void> = new Subject<void>();
  animateOnRouteEnter = ANIMATE_ON_ROUTE_ENTER;
  gridSettingView:boolean = false;
  searchFields:any;

  @Input() type:number;
  data:any;
  loading:boolean;
  filter:any;
  params:any;
  stationNm : any;
  pwrInfoList: any;
  stationNmList: any;
  powerGenNmList: any;


  // Search Params
  searchForm: FormGroup;
  searchField: string = '';
  searchValue: string = '';
  seachControl: any;
  searchFieldOptions: any = [];
  gridOptions: GridOptions;
  rowData$:any;
  sortField:string = 'fstDttm';
  sortOrder:string = 'desc';
  currentPage:number = 1;

  totalCnt: number;
  gridHeight:string = '300px';
  columnDefs: Array<any> = [];

  pageSize:number = 20;
  pager:any = {
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

  tempData:any;

  constructor(
    private store: Store<any>,
    public dialog: MatDialog,
    private translate: TranslateService,
    private msgs: MessagesService,
    private api: ApiService,
    private cryptoJsService: CryptoJsService,
    private utilService: utilService
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
      suppressPropertyNamesCheck: true, // ag grid console 제거
      onGridReady: () => {
        this.onWindowRealese({});
      },
      onCellClicked: function (e) { // Grid Click Event
        vm.gridClick(e);
      },
      overlayNoRowsTemplate:`<div class="no-data-display" style="top:31px"><div><i class="fa fa-inbox"></i><p>${translate.instant('message.no_data')}</p></div></div>`
    };
    this.setColumnDef();
    translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.setColumnDef();
    });
  }

  setColumnDef() {
  this.searchFieldOptions = [
    /*{
      label: this.translate.instant('communi.name'),
      field: 'name'
    },*/
        {
              label: this.translate.instant('communi.unit'),
              field: 'unit'
        },
        {
              label: this.translate.instant('communi.make'),
              field: 'make'
        },
    {
      label: this.translate.instant('communi.srcIp'),
      field: 'srcIp'
    },
    {
      label: this.translate.instant('communi.dstIp'),
      field: 'dstIp'
    }
    /*,{
      label: this.translate.instant('communi.srcPort'),
      field: 'srcPort'
    },
    {
      label: this.translate.instant('communi.dstPort'),
      field: 'dstPort'
    }*/
    ];


    this.columnDefs = [
      {
        headerName: this.translate.instant('motie_asset_manage.power'),
        field: 'powerGenNm',
        width: 80,
        cellStyle: { textAlign: 'center' },
        colVisible: true
      },
      {
        headerName: this.translate.instant('b&w.unit'),
        field: 'unit',
        width: 50,
        cellStyle: { textAlign: 'center' },
        colVisible: true,
        cellRenderer: function(params) {
          if (params.value === '99') {
            return '없음';
          } else if (params.value){
            return  params.value }
        },
      },
      {
        headerName: this.translate.instant('b&w.make'),
        field: 'make',
        width: 70,
        cellStyle: { textAlign: 'center' },
        colVisible: true
      },
      {
        headerName: this.translate.instant('communi.name'),
        field: 'name',
        width: 80,
        cellStyle: { textAlign: 'center' },
        colVisible: true
      },
      {
        headerName: this.translate.instant('communi.srcIp'),
        field: 'srcIp',
        width: 70,
        cellStyle: { textAlign: 'center' },
        colVisible: true
      },
      {
        headerName: this.translate.instant('communi.dstIp'),
        field: 'dstIp',
        width: 70,
        cellStyle: { textAlign: 'center' },
        colVisible: true
      },
      {
        headerName: this.translate.instant('communi.srcPort'),
        field: 'srcPort',
        width: 60,
        cellStyle: { textAlign: 'center' },
        colVisible: true
      },
      {
        headerName: this.translate.instant('communi.dstPort'),
        field: 'dstPort',
        width: 60,
        cellStyle: { textAlign: 'center' },
        colVisible: true
      },
      {
        headerName: this.translate.instant('buttons.update'),
        field: 'modi',
        width: 50,
        colVisible: true,
        suppressSorting: true,
        suppressFilter: true,
        suppressResize: true,
        cellStyle: {textAlign: 'center', padding: 0},
        cellRendererFramework: UpdateButtonComponent
      },
      {
        headerName: this.translate.instant('buttons.delete'),
        field: 'del',
        width: 50,
        colVisible: true,
        suppressSorting: true,
        suppressFilter: true,
        suppressResize: true,
        cellStyle: {textAlign: 'center', padding: 0},
        cellRendererFramework: DeleteButtonComponent
      }
    ];
    this.onWindowRealese({});
  }

  searchFilter(e:any) {
    let search:any = {};
    _.forEach(this.searchFieldOptions, (v) => {
          console.log(v.value_type);
      if(e[v.field] !== undefined) {
            if(e[v.field].trim() !== '') search[v.field] = { like : '%' + e[v.field] + '%' };
      }
    });
    this.filter = search;
    this.getData({ page : 1 });
        this.onWindowRealese({});
  }

  ngOnInit() {
    // this.params = { filter : JSON.stringify({ order: this.sortField + ' ' + this.sortOrder, page: 1 }) };
    this.getPwrInfo('/MotiePwrInfos', '');
    // this.store.dispatch( new ActionCommuniWhiteRead(this.params));
    this.filter={ }; //필터 초기화 추가

    this.store.select(selectorCommuniWhite)
      .pipe(
        takeUntil(this.unsubscribe$),
        filter(res => res !== null)
      )
      .subscribe((datas: any) => {
        this.loading = datas.loading;
        if(datas.contents !== null) {
          this.data = datas.contents.contents;

          if(this.data !== null){
            let temp = [];
            this.totalCnt = this.data.data.total_cnt;

            for(let i=0; i < this.data.data.data.length; i++){
              if(this.data.data.data[i].state != "D" && this.data.data.data[i].state != "DE"){
                temp.push(this.data.data.data[i]);
              }
            }

            let data = temp;
            //아이피 값 복호화
            _.map( data, d => {
              if(d.state != "D" || d.state != "DE"){
                if(d.srcIp != undefined && d.srcIp.length != 0) {
                  d.srcIp = this.cryptoJsService.decrypt(d.srcIp);
                }
                if(d.dstIp != undefined && d.dstIp.length != 0) {
                  d.dstIp = this.cryptoJsService.decrypt(d.dstIp);
                }
                if(this.stationNmList !== undefined) {
                  for (let j = 0; j < this.stationNmList.length; j++) {
                    if (this.stationNmList[j].powerGenId == d.powerGenId) {
                      d.powerGenNm = this.stationNmList[j].powerGenNm;
                    }
                  }
                }
              }

              this.rowData$ = data;
              this.pager.totalItems = this.rowData$.length;

              // this.pageSize = datas.contents.contents.data.total_cnt;
            });
          }

        }
      }); // store 끝
    this.getData({});
    this.onWindowRealese({});
  }

  getPwrInfo(path: string, param: any) {
    this.api.API('get', path, param).pipe(
      distinctUntilChanged(),
      debounceTime(500),
      map(res => res)
    )
      .subscribe(res => {
        this.pwrInfoList = res;
        this.stationNmList = _.filter(this.pwrInfoList, { 'gubun': 'P' });
        this.stationNm = _.filter(this.pwrInfoList, { 'gubun': 'S' });
      }, err => {
        this.msgs.error(err);
      });
  }

  ngOnDestroy(){
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.store.dispatch(new ActionCommuniWhiteUpdateClear());
  }

  gridClick (e) {
    if(e.colDef.field === 'del') this.deleteRow(e.data, e.colDef.field);
    if(e.colDef.field === 'modi') this.updateRow(e.data, e.colDef.field);
  }

  getData(event:any) {
        let sortField = event.sort_field === undefined ? this.sortField : event.sort_field;
        let sortOrder = event.sort_order === undefined ? this.sortOrder : event.sort_order;
        this.pager.currentPage = event.page === undefined ? this.pager.currentPage : event.page;
        this.pager.pageSize = event.size == undefined ? this.pager.pageSize : event.size;
        let offset = this.pager.pageSize * (this.pager.currentPage - 1);

        if(Object.keys(this.filter).length === 0) { // 서치필터 사용 안할때, 디폴트
              console.log('1. 서치필터 사용안함~');
              // where 조건 필터에 추가
              let params = {
                    order: sortField + ' ' + sortOrder,
                    limit: this.pager.pageSize,
                    offset: offset,
                    where: {state: {nin: ["D", "DE"]}}
              };
              this.params = {filter: JSON.stringify(Object.assign(this.filter, params))};
        }
        else { // 서치필터 사용하는 경우
              let params = {
                    order: sortField + ' ' + sortOrder,
                    limit: this.pager.pageSize,
                    offset: offset,
                    where: Object.assign(this.filter, {state: {nin: ["D", "DE"]}})
              };
              this.params = {filter: JSON.stringify(Object.assign(params))};
        }
        this.store.dispatch(new ActionCommuniWhiteRead(this.params));
      /*  if(Object.keys(this.filter).length === 0) { // filter가 없을때
          this.params = { filter : JSON.stringify(params) };
        } else {
          this.params = {
            filter : JSON.stringify({
              ...params,
              where : this.filter
            })
          };
        }*/
  }

/*  getData(event:any) {
    // console.log(event);
    let sortField = event.sort_field === undefined ? this.sortField : event.sort_field;
    let sortOrder = event.sort_order === undefined ? this.sortOrder : event.sort_order;
    this.pager.currentPage = event.page === undefined ? this.pager.currentPage : event.page;
    this.pager.pageSize = event.size == undefined ? this.pager.pageSize : event.size;
    let offset = this.pager.pageSize * (this.pager.currentPage - 1);
    let params = { order: sortField + ' ' + sortOrder, limit: this.pager.pageSize, offset: offset };

    this.params = { filter : JSON.stringify(Object.assign(this.filter, params)) };
    // this.params = { filter : JSON.stringify(Object.assign(params)) };
    this.store.dispatch( new ActionCommuniWhiteRead(this.params));
  }*/


  searchGrid(){
    this.loading = true;
    if(this.searchField === '') {
      return false;
    }
    this.filter = {where: {}};
    if(this.searchValue !== '') this.filter.where[this.searchField] = {like: '%' + this.searchValue + '%'}; //R.map(likeChange, event.value);
    this.currentPage = 1;
    let offset = (this.currentPage - 1) * this.pageSize;
    this.params = { filter : JSON.stringify(Object.assign(this.filter, { order: this.sortField + ' ' + this.sortOrder, page: this.currentPage, offset:offset })) };
    // console.log(this.params);
    this.store.dispatch( new ActionCommuniWhiteRead(this.params));
  }

  setCellVisible(col:string, reverse:boolean) {
    this.gridOptions.columnApi.setColumnVisible(col, reverse);
    this.gridOptions.api.sizeColumnsToFit();
  }

  sizeColumnsToFit() {
    this.gridOptions.api.sizeColumnsToFit();
  }

  autoSizeAll() {
    let allColumnIds = this.columnDefs.map(x => x.field);
    this.gridOptions.columnApi.autoSizeColumns(allColumnIds);
    // let blackColumnIds = this.columnDefss.map(x => x.field);
    // this.gridOptions.columnApi.autoSizeColumns(blackColumnIds);
  }

  addRow() {
    let dialogRef = this.dialog.open(CommuniWhiteDialog, {
      width: '600px',
      data: {
        mode: 'new',
        data: {
          id: '0',
          stationId: '',
          powerGenId: 'DS_001',
          unit: '',
          make: '',
          protocolType: '',
          detailProtocol: '',
          srcIp: '',
          dstIp: '',
          srcPort: null,
          dstPort: null,
          state: ''
        }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      // console.log('Add');
      // console.log(result);
      if(result !== undefined) this.getData({ page: 1 });
    });
  }

  updateRow (d:CommuniWhiteRow, mode:string) {
    d.status = d.deploy === 'Y' ? true : false;
    let dialogRef = this.dialog.open(CommuniWhiteDialog, {
      width: '600px',
      data: {mode: mode, data: d}
    });
    dialogRef.afterClosed().subscribe(result => {
      // console.log('Update');
      // console.log(result);
      if(result !== undefined) this.getData({ page: 1 });
    });
  }

  deleteRow (d: CommuniWhiteRow, mode:string) {
    let dialogRef = this.dialog.open(CommuniWhiteDeleteDialog, {
      width: '350px',
      data: {mode: mode, data: d}
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result !== undefined) this.getData({ page: 1 }); //// console.log(result);
    });
  }


  // this.store.dispatch(accountsDeleteRequest(d.id));

  /*
   * Window Resize Event
   * */
  @HostListener('window:resize',['$event'])
  onWindowRealese(e?:any){
    setTimeout(() => {
      if(this.gridOptions.api) {
        this.gridOptions.api.sizeColumnsToFit();
        this.gridHeight = this.gridWrap.nativeElement.clientHeight + 'px';
      }
    }, 300);
  }
}

@Component({
  selector: 'black-white-dialog',
  templateUrl: './communi-white.dialog.template.html',
})
export class CommuniWhiteDialog implements OnInit {
  title:string;
  loading:boolean;
  status:boolean = true;
  senADS$: Observable<any>;
  sppassMsg:string = '';
  spValidation:boolean = false;
  dppassMsg:string = '';
  dpValidation:boolean = false;
  dprotocolpassMsg:string = '';
  dprotocolValidation:boolean = false;
  namepassMsg:string = '';
  nameValidation:boolean = false;
  dipassMsg:string = '';
  diValidation:boolean = false;
  sipassMsg:string = '';
  siValidation:boolean = false;
  private unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<CommuniWhiteDialog>,
    @Inject(MAT_DIALOG_DATA) public data: {mode:string; data:CommuniWhiteRow;},
    // @Inject(MAT_DIALOG_DATA) public data: {data:CommuniWhiteRow; mode:string},
    private store: Store<any>,
    private translate: TranslateService,
    private msgs: MessagesService,
    private api: ApiService
  ) {
  // this.title += this.data.id !== 0 ? " " + this.translate.instant('buttons.modify') : " " + this.translate.instant('buttons.add');
    this.title = this.translate.instant('communi.title');
  }
  pwrInfoList: any;
  stationNmList: any;
  powerGenNmList: any;
  stationNm: any;
  cmnCodeList: { hogiCmnCodeList: any, manufCmnCodeList, assetProtocolCodeList: any}
    = {
    hogiCmnCodeList: { param: { where: { gubunKey: 'div_hogi', object: 'DTI' } } ,codeList:[] },
    manufCmnCodeList: { param: { where: { gubunKey: 'div_manuf', object: 'DTI' } } ,codeList:[]},
    assetProtocolCodeList: { param: { where: { gubunKey: 'asset_protocol', object: 'DTI' } } ,codeList:[]}
  };


  ngOnInit () {
    this.store.select(selectorCommuniWhite)
      .pipe(
        takeUntil(this.unsubscribe$),
        map(res => res.update),
        filter(res => res !== null)
      )
      .subscribe((datas: any) => {
        this.loading = datas.loading;
        if(datas.contents !== null) {
          this.store.dispatch(new ActionCommuniWhiteUpdateClear());
          this.dialogRef.close(this.data);
        }
      });
    this.getPwrInfo('/MotiePwrInfos', '');
    this.getCmnCode();
  }

  changeStatus() {
    this.data.data.status = !this.data.data.status;
    this.data.data.deploy = this.data.data.status ? 'Y' : 'N';
  }


  spValidate (e:any) {
    // Number, combination of upper and lower case letters from 4 to 45 characters.
    this.sppassMsg = '';
    //

    if (isNaN(Number(this.data.data.srcPort))) {
      this.sppassMsg += this.translate.instant('communi.mag_index5');
      this.spValidation = false;
      return false;
    }
    // 범위 체크
    if (Number(this.data.data.srcPort) < 0 || Number(this.data.data.srcPort) > 65535) {
      this.sppassMsg += this.translate.instant('communi.mag_index');
      this.spValidation = false;
      return false;
    }
    this.spValidation = true;
  }

  dpValidate (e:any) {
    // Number, combination of upper and lower case letters from 4 to 45 characters.
    this.dppassMsg = '';
    //
     if (isNaN(Number(this.data.data.dstPort))) {
       this.dppassMsg += this.translate.instant('communi.mag_index5');
       this.dpValidation = false;
       return false;
     }

    if (Number(this.data.data.dstPort) < 0 || Number(this.data.data.dstPort) > 65535) {
       this.dppassMsg += this.translate.instant('communi.mag_index');
       this.dpValidation = false;
       return false;
     }
    this.dpValidation = true;
  }

  dprotocolValidate (e:any) {
    // Number, combination of upper and lower case letters from 4 to 45 characters.
    this.dprotocolpassMsg = '';
    //
  if (!/^.{1,30}$/.test(this.data.data.detailProtocol)) {
       this.dprotocolpassMsg += this.translate.instant('communi.mag_index2');
       this.dprotocolValidation = false;
       return false;
     }
    this.dprotocolValidation = true;
  }

  nameValidate (e:any) {
    // Number, combination of upper and lower case letters from 4 to 45 characters.
    this.namepassMsg = '';
    //
     if (!/.{0,40}$/.test(this.data.data.name)) {
       this.namepassMsg += this.translate.instant('communi.mag_index3');
       this.nameValidation = false;
       return false;
     }

     if (/[~!@#$%^&*()_+/|<>?:{}]/.test(this.data.data.name)) {
       this.namepassMsg += this.translate.instant('communi.mag_index4');
       this.nameValidation = false;
       return false;
     }
    this.nameValidation = true;
  }

  diValidate (e:any) {
    // Number, combination of upper and lower case letters from 4 to 45 characters.
    this.dipassMsg = '';
    //
  if (!/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/i.test(this.data.data.dstIp)) {
       this.dipassMsg = this.translate.instant('communi.mag_index6');
       this.diValidation = false;
       return false;
     }
    this.diValidation = true;
  }
  siValidate (e:any) {
    // Number, combination of upper and lower case letters from 4 to 45 characters.
    this.sipassMsg = '';
    //
     if (!/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/i.test(this.data.data.srcIp)) {
       this.sipassMsg = this.translate.instant('communi.mag_index6');
       this.siValidation = false;
       return false;
     }
    this.diValidation = true;
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
    };
  }

  getPwrInfo(path: string, param: any) {
    this.api.API('get', path, param).pipe(
      distinctUntilChanged(),
      debounceTime(500),
      map(res => res)
    )
      .subscribe(res => {
        this.pwrInfoList = res;
        this.stationNm = _.filter(this.pwrInfoList, { 'gubun': 'S' });
        this.stationNmList = _.filter(this.pwrInfoList, { 'gubun': 'P' });
        // this.stationIdChange(this.data.stationId);
        // if (this.data.data.stationId !== null) {
        //   this.stationIdChange(this.data.data.stationId);
        // }
      }, err => {
        this.msgs.error(err);
      });

    this.data.data.stationId = "DS";

  }

  stationIdChange(newValue) {
    this.powerGenNmList = _.filter(this.pwrInfoList, (d) => {
      // return d.gubun === 'P' && d.powerGenId !== null && d.powerGenId.includes(newValue);
      this.data.data.powerGenId = newValue;
      return d.gubun === 'P' && d.powerGenId !== null && d.powerGenId.includes(newValue);
    });
  }

  onNoClick (): void {
    this.dialogRef.close();
  }

  Submit() {
    if (this.data.mode !== 'del') {
    if(this.data.data.stationId === "") {
      this.msgs.warning({title: '발전사 확인', message: '발전사를 확인하시기 바랍니다.'});
      return;
    } else if(this.data.data.powerGenId ==="") {
      this.msgs.warning({title: '발전본부 확인', message: '발전본부를 확인하시기 바랍니다.'});
      return;
    } else if(this.data.data.unit ==="") {
      this.msgs.warning({title: '호기 확인', message: '호기를 확인하시기 바랍니다.'});
      return;
    }else if(this.data.data.make ==="") {
      this.msgs.warning({title: '제조사 확인', message: '제조사를 확인하시기 바랍니다.'});
      return;
    }else if(this.data.data.name === "") {
      this.msgs.warning({title: '정책명 입력값 확인', message: '정책명 입력값을 입력해주세요.'});
      return;
    }else if(this.data.data.protocolType =="") {
      this.msgs.warning({title: '프로토콜 타입 확인', message: '프로토콜 타입을 입력해주세요.'});
      return;
    }else if(this.data.data.detailProtocol =="") {
      this.msgs.warning({title: '상세 프로토콜 확인', message: '상세 프로토콜을 입력해주세요.'});
      return;
    }else if(this.data.data.srcIp =="") {
      this.msgs.warning({title: '출발지IP 확인', message: '출발지IP를 입력해주세요.'});
      return;
    }else if(this.data.data.dstIp =="") {
      this.msgs.warning({title: '도착지IP 확인', message: '도착지 PORT 를 입력해주세요.'});
      return;
    }else if(this.data.data.srcPort == null) {
      this.msgs.warning({title: '출발지Port 확인', message: '출발지 PORT 를  입력해주세요..'});
      return;
    }else if(this.data.data.dstPort == null) {
      this.msgs.warning({title: '도착지Port 확인', message: '도착지 PORT를  입력해주세요.'});
      return;
    }}
    this.data.data.lstDttm = moment().format('YYYY-MM-DD HH:mm:ss');
    this.data.data.state === '' ? this.data.data.state = 'C' : this.data.data.state = 'U';
   /* {
      let param = {
        id: '',
        name: this.data.name,
        dttm: this.data.lstDttm,
        state: this.data.state
      };
      this.senADS$ = this.api.API('post', '/MotieDetectionLists', param)
    };
    this.senADS$.pipe(
      debounceTime(500),
      takeUntil(this.unsubscribe$)
    ).subscribe(res => {},
      (err) => {
        return err;
    });*/
    if(this.data.mode === 'new') { // 추가
      this.data.data.state = 'C';
      this.store.dispatch(new ActionCommuniWhiteCreate(this.data.data));
    } else if (this.data.mode === 'modi') { // 수정
      this.data.data.state = 'U';
      this.data.data.lstDttm = moment().format('YYYY-MM-DD HH:mm:ss');
      this.store.dispatch(new ActionCommuniWhiteUpdate(this.data.data));
    } else if (this.data.mode === 'del') { // 삭제
      this.data.data.state = 'D';
      this.data.data.lstDttm = moment().format('YYYY-MM-DD HH:mm:ss');
      this.store.dispatch(new ActionCommuniWhiteDelete(this.data.data));
    }
    this.dialogRef.close();
  }

  ngOnDestroy(){
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}

@Component({
  selector: 'black-white-delete-dialog.template',
  templateUrl: './communi-white-delete-dialog.template.html',
  styleUrls: ['./communi-white.style.scss']
})
export class CommuniWhiteDeleteDialog implements OnInit, OnDestroy {
  unsubscribe$: Subject<void> = new Subject<void>();
  loading:boolean;
  senADS$: Observable<any>;
  constructor(
    public dialogRef: MatDialogRef<CommuniWhiteDeleteDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private store: Store<any>,
    private translate: TranslateService,
    private utilService: utilService,
    private api: ApiService
  ) {
  }

  ngOnInit () {

    this.store.select(selectorCommuniWhite)
      .pipe(
        takeUntil(this.unsubscribe$),
        map(res => res.update),
        filter(res => res !== null)
      )
      .subscribe((datas: any) => {
        this.loading = datas.loading;
        if(datas.contents !== null) {
          this.store.dispatch(new ActionCommuniWhiteUpdateClear());
          this.dialogRef.close(this.data.data);
        }
      });
  }

  onNoClick (): void {
    this.dialogRef.close();
  }
  /**
   * 저장 실행
   * @function onSubmit ()
   * @action ActionAccountsCreate ? ActionAccountsUpdate ? ActionAccountsDelete // 생성, 수정, 삭제
   * */
  onSubmit () {
    this.data.state = "D";
  /*  {
      let param = {
        id: '',
        user: this.data.lstUser,
        name: this.data.name,
        dttm: moment().format('YYYY-MM-DD HH:mm:ss'),
        state: this.data.state
      };
      this.senADS$ = this.api.API('post', '/MotieDetectionLists', param)
    };
    this.senADS$.pipe(
      debounceTime(500),
      takeUntil(this.unsubscribe$)
    ).subscribe(res => {},
      (err) => {
        return err;
      });*/
    this.store.dispatch( new ActionCommuniWhiteDelete(this.data.data));
  }
  ngOnDestroy(){
    this.store.dispatch(new ActionCommuniWhiteUpdateClear());
  }
}
