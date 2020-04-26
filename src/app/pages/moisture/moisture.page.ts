import { Component, OnInit } from '@angular/core';
import { IexeedEntry, StorageService } from './../../Services/storage.service';
import { Chart, ChartDataSets } from "chart.js";
import { APIService, IDeviceData, IAllDeviceData } from 'src/app/Services/api.service';
import { ToastController, Platform } from '@ionic/angular';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { interval } from 'rxjs';

@Component({
  selector: 'app-moisture',
  templateUrl: './moisture.page.html',
  styleUrls: ['./moisture.page.scss'],
})
export class MoisturePage implements OnInit {
  moistEntries: IexeedEntry[] = [];
  newMoistEntry: IexeedEntry = <IexeedEntry>{};
  rangeCountEntry: IexeedEntry = <IexeedEntry>{};
  chartData: ChartDataSets[] = [{ data: [], label: 'Moisture', fill: false }];
  chartLabels: String[];

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
      text: 'Moisture for Device 1'
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


  constructor(public toastController:ToastController,
    private plt: Platform,
    private APIService: APIService,
    private storage: StorageService,
    public datepipe: DatePipe) { 
      this.plt.ready().then(() => {
        this.loadMoistEntries();
      })

      this.GetLatestData();
      this.GetAllInfoDevice();
      interval(60000).subscribe(x => { // will execute every minute
        this.GetLatestData();
        this.GetAllInfoDevice();
      });
    }

  async ngOnInit() { //TODO: selected device hier nog op toepassen
    this.APIService.GetLatestSingleDeviceInfo(1).subscribe(DataDevice => { //TODO: device ID moet een variabele zijn in de toekomst.
      this.DataDevice = DataDevice;
    })
  }

  // Add Entry
  addMoistEntry(moistEntry: IexeedEntry) {
    this.newMoistEntry.id = Date.now();
    this.storage.addEntry(moistEntry).then(entry => {
      this.newMoistEntry = <IexeedEntry>{};
      this.showToast('Moisture Entry Added');
      this.loadMoistEntries();
    })
  }
  
  // Load Entries
  loadMoistEntries() {
    this.storage.getEntries().then(moistEntries => {
      this.moistEntries = moistEntries;
    })
  }

  //Remove Entry
  removeMoistEntry(ID: number) {
    this.storage.deleteEntry(ID);
  }

  //Remove All Entries
  removeAllMoistEntries(){
    this.storage.deleteAllEntries();
  }

  GetAllInfoDevice() {
    this.APIService.GetDeviceDataSingle(1).subscribe(res => {
      console.log('Res: ', res)
  
      this.chartData[0].data = [];
      this.chartLabels = [];
  
  
      for (let entry of res) {
        this.chartLabels.push(this.datepipe.transform(entry.Date, 'd/MM/y'));
        this.chartData[0].data.push(entry['Moisture']);
      }
    })
  }

  typeChanged(e) {
    const on = e.detail.checked;
    this.chartType = on ? 'line' : 'bar';
  }

  //instellen van een limiet: 
  public rangeCount: number = 50;
  public packetNumber: number = 100;
  private lastSavedDate: Date;

  GetLatestData() {
    this.APIService.GetLatestSingleDeviceInfo(1).subscribe(DataDevice => {
      this.DataDevice = DataDevice;
      if (this.DataDevice.Temperature > this.rangeCount && this.DataDevice.Date != this.lastSavedDate
      ) {
  
        this.newMoistEntry.temperature = this.DataDevice.Temperature;
        this.newMoistEntry.date = this.DataDevice.Date;
        this.newMoistEntry.time = this.DataDevice.Time;
        this.lastSavedDate = this.DataDevice.Date;
        this.addMoistEntry(this.newMoistEntry)
  
        //* Notification
        var message = {
          app_id: "b16686d2-04a8-468a-8658-7b411f0a777b",
          contents: { "en": "The moisture level is higher than your given moisture level!" }, //placeholder text
          included_segments: ["All"]
        };
  
        this.APIService.SendNotification(message).subscribe(data => {
          console.log('The moisture level is higher than your given moisture level!');
          console.log(data);
        },
        err => {
          alert(err);
        });
      }
    });
  }
    
  async showToast(msg) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2000
    });
    toast.present();
  }
}
