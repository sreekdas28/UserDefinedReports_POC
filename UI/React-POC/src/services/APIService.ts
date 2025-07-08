// apiService.ts

import { toDataSourceRequestString } from '@progress/kendo-data-query';
import { camelToPascal } from '../utils/helper';

const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;





export class APIService {


  private static baseUrl = `${BASE_API_URL}/StimulSoft/`;

  private static async request(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    data?: any
  ) {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, options);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Error ${response.status}: ${errorBody}`);
    }

    return response.json();
  }


  static get(endpoint: string, queryString="") {
  
    return this.request(`${endpoint}?${queryString}`, 'GET');
  }

  static post(endpoint: string, data?: any) {
    return this.request(endpoint, 'POST', data);
  }

  static put(endpoint: string, data?: any) {
    return this.request(endpoint, 'PUT', data);
  }

  static delete(endpoint: string, data?: any) {
    return this.request(endpoint, 'DELETE', data);
  }

  // Specific for Kendo Grid POST
  static fetchGridData(endpoint: string, gridState: any) {
    const requestGridState = {...gridState};
    delete requestGridState.columns;

    // const queryString = new URLSearchParams(requestGridState).toString();
  
    const kendoQueryString = toDataSourceRequestString(requestGridState);
    
    return this.get(endpoint, kendoQueryString);
  }

  static generateReport(endpoint: string, gridState){

    const modifiedGridColumns = gridState.columns.map((item) => {
      return {
        ...item,
        field: camelToPascal(item?.field) 
      }
    });
    const modifiedGridGroups = gridState.group.map((item) => {
    
      return {
        ...item,
        field:camelToPascal(item?.field) 
      }
    });

    const sortedModifiedColumns = modifiedGridColumns.sort((a, b) => {
      if (a.orderIndex === undefined && b.orderIndex === undefined) {
        return 0; // Maintain original relative order if both are undefined
      }
      if (a.orderIndex === undefined) {
        return 1; // 'a' (undefined) comes after 'b'
      }
      if (b.orderIndex === undefined) {
        return -1; // 'a' comes before 'b' (undefined)
      }
      return a.orderIndex - b.orderIndex;
    })

    const modifiedGridState = {
      ...gridState,
      columns: modifiedGridColumns,
      group: modifiedGridGroups
    }

    return this.post(endpoint, modifiedGridState)

  }
}
