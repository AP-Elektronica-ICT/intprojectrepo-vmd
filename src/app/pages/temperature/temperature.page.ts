import { StorageService, IexeedEntry } from './../../Services/storage.service';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Chart, ChartDataSets } from "chart.js";
import { APIService, IAllDeviceData } from 'src/app/Services/api.service';
import { DatePipe } from '@angular/common';
import { interval } from 'rxjs';
import { ToastController, Platform } from '@ionic/angular';
import { Router } from '@angular/router';


@Component({
  selector: 'app-temperature',
  templateUrl: './temperature.page.html',
  styleUrls: ['./temperature.page.scss'],
  providers: [DatePipe]
})
export class TemperaturePage implements OnInit {

  entries: IexeedEntry[] = [];
  newEntry: IexeedEntry = <IexeedEntry>{};
  rangeCountEntry: IexeedEntry = <IexeedEntry>{};
  chartData: ChartDataSets[] = [{ data: [], label: 'Temperature', fill: false }];
  chartLabels: String[];

  DataDevice: IAllDeviceData;
  DataDeviceArray: IAllDeviceData[];

  // Options the chart - Visualisation
  chartOptions = {
    responsive: true,
    responsiveAnimationDuration: 1500,
    aspectRatio: 3,
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
    public datepipe: DatePipe,
    private router: Router) {
      this.plt.ready().then(()=> {
        this.loadEntries();
      })
    this.GetLatestData();
    this.GetAllInfoDevice();
    interval(60000).subscribe(x => { //* will execute every minute
      this.GetLatestData();
      this.GetAllInfoDevice();
    });
  }

  async ngOnInit() { //TODO: selected device hier nog op toepassen
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
  GetAllInfoDevice() {
    this.APIService.GetDeviceDataSingle(1).subscribe(res => {

      this.chartData[0].data = [];
      this.chartLabels = [];

      for (let entry of res) {
        this.chartLabels.push(this.datepipe.transform(entry.Date, 'd/MM/y'));
        this.chartData[0].data.push(entry['Temperature']);
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
    // this.router.routeReuseStrategy.shouldReuseRoute = () => {
    //   return false;
    // }
    // this.router.onSameUrlNavigation = 'reload';
    // this.router.navigateByUrl('/menu/temperature');
  }

  //removeAllEntries
  removeAllEntries(){
   this.storage.deleteAllEntries();
  }
  

  //instellen van een limiet: 
  public rangeCount: number = 50;
  public packetNumber: number = 100;
  private lastSavedDate:Date;
   

  GetLatestData() {
    this.APIService.GetLatestSingleDeviceInfo(1).subscribe(DataDevice => {
      this.DataDevice = DataDevice;
      if (this.DataDevice.Temperature > this.rangeCount && this.DataDevice.Date != this.lastSavedDate
        ) {
        
        this.newEntry.temperature = this.DataDevice.Temperature;
        this.newEntry.date = this.DataDevice.Date;
        this.newEntry.time = this.DataDevice.Time;
        this.lastSavedDate = this.DataDevice.Date;
        this.addEntry(this.newEntry)

     
    }
  });
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
}