import {Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ViewEncapsulation} from '@angular/core';
import * as _ from 'lodash';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'dti-table-dynamic-filter',
  templateUrl: './table-dynamic-filter.template.html',
  styleUrls: ['./table-filter.style.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TableDynamicFilterComponent implements OnInit, OnDestroy {
  @Input() filterFields: any = [];
  @Input() osint_page : boolean;
  @Output() action = new EventEmitter<any>();
  @ViewChild('search') search : any;
  @ViewChild('fieldVal') fieldVal : any;
  filters:any;
  sendData:any;
  customEvent : Subject<any> = new Subject();
  sendFilter:any = [];
  fields:any = [];
  abc:any;
  Button:boolean = true;
  selected:any = [false];
  constructor() {}

  ngOnInit() {
    if (this.filterFields.length === 1) this.Button = false;
    this.sendFilter.push({
      label: '',
      field: '',
      type: 'text',
      value_type: 'equal',
      option: []
    });
    this.fields.push(this.filterFields.map(d => {
      return { label: d.label, field: d.field }
    }));
    if (this.filterFields.length === 1) {
      this.customEvent.pipe(
        debounceTime(500))
        .subscribe(e => {
            this.sendData = {};
            let valueFilter = _.filter(this.sendFilter, res => res.value !== undefined);/*res.value !== '' &&*/
            _.forEach(valueFilter, (v, k) => {
              this.sendData[this.filterFields[0].field] = v.value;
            });
            this.action.emit(this.sendData);
          }
        );
        this.action.emit()
    } else {
      this.customEvent.pipe(
        debounceTime(500))
        .subscribe(e => {
            this.sendData = {};
            let valueFilter = _.filter(this.sendFilter, res => res.value !== undefined);/*res.value !== '' &&*/
            _.forEach(valueFilter, (v, k) => {
              this.sendData[v.field] = v.value;
            });
            this.action.emit(this.sendData);
        });
    }
  }

  removeFilter(i:number, item:any) {
    this.sendFilter.splice(i, 1);
    this.fields.splice(i, 1);
    this.Button = true;
    if(item.field !== '') {
      _.forEach(this.fields, (v, k)=> {
        v.push({ label:item.label, field : item.field })
      });
    }
  }

  addFilter(i?) {
      // this.selected[i] = false;
    let y = this.sendFilter.length+1;
    if(y == this.filterFields.length) this.Button = false;
    // if(this.sendFilter.length == this.filterFields.length ) return false;
    this.sendFilter.push({
      label: '',
      field: '',
      type: 'text',
      value_type: 'equal',
      option: []
    });
    let filters = _.map(this.sendFilter, d => d.field);
    let listDatas = _.filter(this.filterFields, (d) =>{return _.findIndex(filters, (e) => {return e === d.field; }) === -1});
    this.fields.push(listDatas.map( d => { return { label:d.label, field : d.field }}));
  }

  valChange(e, i?) {
      // this.selected[i] = true;
    _.forEach(this.fields, (val, k) => {
      console.log(val);
      if (k !== i) {
        let selectVal = this.sendFilter[k].field;
        let selectAllVal = _.map(this.sendFilter, d => d.field);
        let selectIndex = _.findIndex(selectAllVal, d => d === selectVal);
        selectAllVal.splice(selectIndex, 1);
        let result = _.filter(this.filterFields, (d) => {
          return _.findIndex(selectAllVal, (e) => { return e === d.field; }) === -1;
        });
        val = result.reduce((a, b) => {
          return a.concat(b);
        }, []);
        this.fields[k] = val;
      }
    });
    let selectVal = _.find(this.filterFields, d => { return d.field === e});
    this.sendFilter[i] = _.clone(selectVal);
  }
  changeValue(d:any) {
    this.customEvent.next(this.sendFilter);
  }
  changeSearchValue(d:any){
    this.customEvent.next(this.sendFilter);
  }
    ngOnDestroy() {
    this.customEvent.unsubscribe();
  }
}
