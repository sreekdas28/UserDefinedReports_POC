import React, { useState } from 'react';
import { GridPDFExport } from '@progress/kendo-react-pdf';
import { ExcelExport } from '@progress/kendo-react-excel-export';
import { Button, ButtonGroup } from '@progress/kendo-react-buttons';
import { Grid, GridColumn as Column, GridToolbar, GridSearchBox } from '@progress/kendo-react-grid';
import { BudgetCell, ColumnMenu, PersonCell, ProgressCell, RatingCell, CountryCell } from '../components/CustomCell';
import { employees } from '../data/employee';
import { process, State } from '@progress/kendo-data-query';

const DATA_ITEM_KEY = 'id';

const Employees = () => {
  let _pdfExport: any;
  let _export: any;

  const exportExcel = () => {
    _export.save();
  };

  const exportPDF = () => {
    _pdfExport.save();
  };

  const [gridDataState, setGridDataState] = useState<State>({
    sort: [],
    group: [],
    skip: 0,
    take: 10
  });

  const [result, setResult] = useState(process(employees, gridDataState));

  const handleDataStateChange = (e: any) => {
    setGridDataState(e.dataState);
    setResult(process(employees, e.dataState));
    console.log('Grid structure JSON:', JSON.stringify(e.dataState, null, 2));
  };

  const handleColumnReorder = (e: any) => {
    console.log('Column Reordered:', e);
  };

  const handleColumnResize = (e: any) => {
    console.log('Column Resized:', e);
  };

  const generateJSON = () => {
    console.log('Current Grid State:', gridDataState);
    console.log('Processed Result:', result);
  };

  const grid = (
    <Grid
      style={{ height: '670px' }}
      dataItemKey={DATA_ITEM_KEY}
      data={result}
      autoProcessData={true}
      sortable={true}
      pageable={{ pageSizes: true }}
      groupable={true}
      selectable={true}
      reorderable={true} // ✅ enable column drag
      resizable={true}   // ✅ enable column resize
      rowSpannable={{ valueGetter: (dataItem, field) => `${dataItem.job_title}-${dataItem[field]}` }}
      {...gridDataState}
      onDataStateChange={handleDataStateChange}
      onColumnReorder={handleColumnReorder}
      onColumnResize={handleColumnResize}
    >
      <GridToolbar>
        <GridSearchBox style={{ width: 210 }} />
        <ButtonGroup>
          <Button themeColor={'base'} onClick={exportExcel}>
            Export to Excel
          </Button>
          <Button themeColor={'base'} onClick={exportPDF}>
            Export to PDF
          </Button>
          <Button themeColor={'base'} onClick={generateJSON}>
            Generate JSON
          </Button>
        </ButtonGroup>
      </GridToolbar>

      <Column filterable={false} groupable={false} width={50} columnType="checkbox" />

      <Column title="Employee" groupable={false} sortable={false}>
        <Column
          field="full_name"
          title="Contact Name"
          columnMenu={ColumnMenu}
          cells={{ data: PersonCell }}
          reorderable={true}
          resizable={true}
          width="250px"
        />
        <Column field="job_title" title="Job Title" columnMenu={ColumnMenu} width="220px" />
        <Column
          field="country"
          title="Country"
          columnMenu={ColumnMenu}
          cells={{ data: CountryCell }}
          reorderable={true}
          resizable={true}
          width="120px"
        />
      </Column>

      <Column title="Performance" groupable={false} sortable={false}>
        <Column
          field="target"
          title="Engagement"
          columnMenu={ColumnMenu}
          cells={{ data: ProgressCell }}
          width="250px"
        />
        <Column
          field="budget"
          title="Budget"
          columnMenu={ColumnMenu}
          cells={{ data: BudgetCell }}
          width="150px"
        />
        <Column
          field="rating"
          title="Rating"
          columnMenu={ColumnMenu}
          cells={{ data: RatingCell }}
          width="230px"
        />
      </Column>

      <Column title="Contacts" groupable={false} sortable={false}>
        <Column field="phone" title="Phone" columnMenu={ColumnMenu} width="230px" />
        <Column field="address" title="Address" columnMenu={ColumnMenu} width="230px" />
      </Column>
    </Grid>
  );

  return (
    <>
      <ExcelExport
        data={employees}
        ref={(exporter) => {
          _export = exporter;
        }}
      >
        {grid}
      </ExcelExport>

      <GridPDFExport
        margin="1cm"
        ref={(element) => {
          _pdfExport = element;
        }}
      >
        {grid}
      </GridPDFExport>
    </>
  );
};

export default Employees;
