import { map } from 'rxjs/operators';
import { StorageService, IexeedEntry } from './../../Services/storage.service';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Chart, ChartDataSets } from "chart.js";
import { APIService, IAllDeviceData } from 'src/app/Services/api.service';
import { DatePipe } from '@angular/common';
import { interval } from 'rxjs';
import { ToastController, Platform } from '@ionic/angular';



@Component({
  selector: 'app-temperature',
  templateUrl: './temperature.page.html',
  styleUrls: ['./temperature.page.scss'],
  providers: [DatePipe]
})
export class TemperaturePage implements OnInit {

  entries: IexeedEntry[] = [];
  newEntry: IexeedEntry = <IexeedEntry>{};
  chartData: ChartDataSets[] = [{ data: [], label: 'Temperature', fill: false }];
  chartLabels: String[];
  metric: String = "celcius";

  DataDevice: IAllDeviceData;
  DataDeviceArray: IAllDeviceData[];

  // Options the chart - Visualisation
  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    responsiveAnimationDuration: 1500,
    aspectRatio: 3,
    layout: {
      padding: {
        left: 0,
        right: 35,
        top: 0,
        bottom: 0
      }
    },
    title: {
      display: true,
      text: 'Humidity for Device 1'
    },
    pan: {
      enabled: true,
      mode: 'xy'
    },
    zoom: {
      enabled: true,
      mode: 'xy'
    }
  };
  chartType = 'line';
  showLegend = false;


  private today = new Date();
  constructor(public toastController: ToastController,
    private plt: Platform,
    private APIService: APIService,
    private storage: StorageService, 
    public datepipe: DatePipe) {
      this.plt.ready().then(()=> {
        this.loadEntries();
      })
      
    this.GetLatestData();
    this.GetAllInfoDevice(this.metric);
    interval(60000).subscribe(x => { //* will execute every 5 seconds
      this.GetLatestData();
      this.GetAllInfoDevice(this.metric);
    });
  }

  async ngOnInit() {
    this.APIService.GetLatestSingleDeviceInfo(1).subscribe(DataDevice => { //TODO: device ID moet een variabele zijn in de toekomst.
      this.DataDevice = DataDevice;
    })
  }


  //* ADD Entry
  addEntry(entry: IexeedEntry){
    this.newEntry.id = Date.now();

    this.storage.addEntry(entry).then(entry => {
      this.newEntry = <IexeedEntry>{};
      this.showToast('Entry Added');
      this.loadEntries();
    })
  }
  GetAllInfoDevice(metric: String) {
    this.APIService.GetDeviceDataSingle(1).subscribe(res => {
      //console.log('Res: ', res)

      this.chartData[0].data = [];
      this.chartLabels = [];

      for (let entry of res) {
        this.chartLabels.push(this.datepipe.transform(entry.Date, 'd/MM/y'));
        if (metric == "celcius") {
          this.chartData[0].data.push(entry['Temperature']);
        }
        else{
          this.chartData[0].data.push((entry['Temperature'] *1.8)+32);
        }

        
      }
    });
  }
  //* Load Entries
  loadEntries(){
    this.storage.getEntries().then(entries => {
      this.entries = entries;
    })
  }
  //remove Entry
  removeEntry(ID:number){
    this.storage.deleteEntry(ID);
  }
  

  //instellen van een limiet: 
  public rangeCount: number = 0;
  public message: string = "";
  public packetNumber: number = 100;
  // lastSavedDate:Date = this.entries[this.ReturnLastItemOfArray(this.entries)].date;
  private lastSavedDate:Date;


  async setTempLimit(range: number) {
    const toast = await this.toastController.create({
      message: 'Limit set on ' + this.rangeCount + ' degrees.',
      duration: 2000
    });
    toast.present();
  }
    GetLatestData() {
    this.APIService.GetLatestSingleDeviceInfo(1).subscribe(DataDevice => {
      this.DataDevice = DataDevice;
      if (this.DataDevice.Temperature > this.rangeCount && this.DataDevice.Date != this.lastSavedDate
        ) {
        
        this.newEntry.temperature = this.DataDevice.Temperature;
        this.newEntry.date = this.DataDevice.Date;
        this.lastSavedDate = this.DataDevice.Date;
        this.addEntry(this.newEntry)

     
    }
  });
  }
  
  ReturnLastItemOfArray(array) {
    if (array.length - 1 > 0) {
      return array[array.length - 1];
    }
    else return 0;   
  }
  typeChanged(e){
    const on = e.detail.checked;
    this.chartType = on ? 'line' : 'bar';
  }
  //* Helper
  async showToast(msg){
    const toast = await this.toastController.create({
      message: msg,
      duration: 2000
    });
    toast.present();
  }

  isDesktop() {
    let platforms = this.plt.platforms();
    if(platforms[0] == "mobile") {
        return "mobile";
    } 
    if(platforms[0] == "desktop") {
        return "desktop";
    }
    if(platforms[0] == "android"){
      return "android";
    }
    if(platforms[0] == "ios"){
      return "ios";
    }
}
TempSegmentChanged(event: any){
if(event.target.value == "celcius"){
  this.metric = "celcius";
  this.GetAllInfoDevice(this.metric);
}
else if(event.target.value == "fahrenheit"){
  this.metric = "fahrenheit"
  this.GetAllInfoDevice(this.metric);
}
}
}