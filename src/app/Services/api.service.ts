import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { map } from 'rxjs/operators';
import { DatePipe, formatDate } from '@angular/common';


@Injectable({
  providedIn: 'root'
})

export class APIService {
  constructor(private http: HttpClient) { }

  GetDeviceInfogeneral() {
    return this.http.get<IDevice[]>(`http://35.210.149.21:3000/device`);
  }

  GetDeviceDataAll() {
    return this.http.get<IDeviceData[]>(`http://35.210.149.21:3000/data`);
  }
  GetDeviceDataSingle(Id){
    return this.http.get<IDeviceData[]>(`http://35.210.149.21:3000/data/${Id}`)
    .pipe(
      map((data)=>{
        for(let entry of data){
          entry.Date = new Date(entry.Date);
        }
        return data;
      })
    );
  }
  
  GetDeviceinfo(Id) {
    return this.http.get<IDevice[]>(`http://35.210.149.21:3000/device/${Id}`);
  }
  GetLatestSingleDeviceInfo(Id){
    return this.http.get<IAllDeviceData>(`http://35.210.149.21:3000/device/${Id}/latest`);
  }

  UpdateNameDevice(Id: number, Name: string){
    console.log('update name in service');
    return this.http.put(`http://35.210.149.21:3000/device/11`, {'Name' : Name});
  }
}
export interface IAllDeviceData{
  ID: number;
	Device_ID: number;
	Temperature: number;
  Humidity: number;
  Moisture: number;
  Time: Date;
  Date: Date;
  Battery: Number;
  Password: String;
  Name: String;
  Status: number;
}

export interface IDeviceData {
  ID: number;
	Device_ID: number;
	Temperature: number;
  Humidity: number;
  Moisture: number;
  Time: Date;
  Date: Date;
  Battery: Number;
}

export interface IDevice {
	ID: number;
	Password: string;
  Name: string;
  Status: number;
}



