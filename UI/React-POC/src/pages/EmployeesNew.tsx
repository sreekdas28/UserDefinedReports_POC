import React, { useState, useRef } from 'react';
import { GridPDFExport } from '@progress/kendo-react-pdf';
import { ExcelExport } from '@progress/kendo-react-excel-export';
import { Button, ButtonGroup } from '@progress/kendo-react-buttons';
import {
  Grid,
  GridColumn as Column,
  GridToolbar,
  GridSearchBox,
} from '@progress/kendo-react-grid';
import { process, State } from '@progress/kendo-data-query';

import { employees } from '../data/employee';
import {
  BudgetCell,
  ColumnMenu,
  PersonCell,
  ProgressCell,
  RatingCell,
  CountryCell,
} from '../components/CustomCell';

const DATA_ITEM_KEY = 'id';

const Employees = () => {
  const pdfExportRef = useRef<GridPDFExport>(null);
  const excelExportRef = useRef<ExcelExport>(null);

  const [gridState, setGridState] = useState<State>({
    sort: [],
    group: [],
    filter: null,
    skip: 0,
    take: 10,
  });

  const [result, setResult] = useState(process(employees, gridState));

  const handleDataStateChange = (e: any) => {
    setGridState(e.dataState);
    setResult(process(employees, e.dataState));
  };

  const handleColumnResize = (e: any) => {
    console.log('📏 Column resized:', e);
    // You can update state if you want to persist column widths
  };

  const handleColumnReorder = (e: any) => {
    console.log('↔️ Column reordered:', e);
    // Optionally store new column order to state or localStorage
  };

  const exportExcel = () => {
    excelExportRef.current?.save();
  };

  const exportPDF = () => {
    pdfExportRef.current?.save();
  };

  const generateJSON = () => {
    const fullData = process(employees, {
      ...gridState,
      skip: 0,
      take: employees.length,
    }).data;

    const output = {
      structure: {
        state: gridState,
      },
      data: fullData,
    };

    console.log('🧾 Export JSON:\n', JSON.stringify(output, null, 2));
  };

  return (
    <>
      <ExcelExport ref={excelExportRef} data={employees}>
        <GridPDFExport ref={pdfExportRef} margin="1cm">
          <Grid
            style={{ height: '670px' }}
            dataItemKey={DATA_ITEM_KEY}
            data={result}
            autoProcessData={true}
            sortable
            pageable={{ pageSizes: true }}
            groupable
            selectable
            reorderable
            resizable
            rowSpannable={{
              valueGetter: (dataItem, field) =>
                `${dataItem.job_title}-${dataItem[field]}`,
            }}
            {...gridState}
            onDataStateChange={handleDataStateChange}
            onColumnResize={handleColumnResize}
            onColumnReorder={handleColumnReorder}
          >
            <GridToolbar>
              <GridSearchBox style={{ width: 210 }} />
              <ButtonGroup>
                <Button themeColor="base" onClick={exportExcel}>
                  Export to Excel
                </Button>
                <Button themeColor="base" onClick={exportPDF}>
                  Export to PDF
                </Button>
                <Button themeColor="base" onClick={generateJSON}>
                  Generate JSON
                </Button>
              </ButtonGroup>
            </GridToolbar>

            <Column
              filterable={false}
              groupable={false}
              width={50}
              columnType="checkbox"
            />

            <Column title="Employee" groupable={false} sortable={false}>
              <Column
                field="full_name"
                title="Contact Name"
                columnMenu={ColumnMenu}
                cells={{ data: PersonCell }}
                reorderable
                resizable
                width="250px"
              />
              <Column
                field="job_title"
                title="Job Title"
                columnMenu={ColumnMenu}
                width="220px"
              />
              <Column
                field="country"
                title="Country"
                columnMenu={ColumnMenu}
                cells={{ data: CountryCell }}
                reorderable
                resizable
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
              <Column
                field="phone"
                title="Phone"
                columnMenu={ColumnMenu}
                width="230px"
              />
              <Column
                field="address"
                title="Address"
                columnMenu={ColumnMenu}
                width="230px"
              />
            </Column>
          </Grid>
        </GridPDFExport>
      </ExcelExport>
    </>
  );
};

export default Employees;
