import React from 'react';
import {
  FormLabel,
  Paragraph,
  Table,
  TableHead,
  TableBody,
  TableRow,
  SkeletonRow,
  TableCell,
} from '@contentful/forma-36-react-components';
import { CSVElements, MetadataFields } from '../helpers/csv'
import { EntryAPI } from '@contentful/app-sdk';

interface TableProps {
  csvData?: CSVElements,
  entries: Array<EntryAPI>,
  contentType: any,
  isLoading: boolean,
  selectedFields: Array<string>,
}

function CSVTable(props: TableProps) {
    return (<>
      <FormLabel htmlFor="csvData">All entries for this content type as CSV ({props.entries.length})</FormLabel>
      {(((props.csvData || props.isLoading) && <div id="tableDiv"><Table className='styled-table'>
        <TableHead>
          <TableRow>
            {props.isLoading && props.contentType.fields.filter((f: any) => props.selectedFields.includes(f.id)).concat(MetadataFields.map((f: string) => { return {id: f} })).map((f: any) => <TableCell key={"header-" + f.id}>{f.id}</TableCell>)}
            {!props.isLoading && props.csvData!.header.map(f => <TableCell key={"header-" + f}>{f}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {props.isLoading && <SkeletonRow rowCount={4} columnCount={props.selectedFields.length + MetadataFields.length} />}
          {!props.isLoading && props.csvData!.body.map((r, i) => {
            return <TableRow key={"body-row-" + i}>
              {r.map((c, j) => <TableCell key={"body-row-" + i + "-" + j}>{c.slice(0, 50) + (c.length < 50 ? '' : ' ...')}</TableCell>)}
            </TableRow>
          })}
        </TableBody>
      </Table></div>) || <Paragraph>No content type selected</Paragraph>)}
    </>)
}

export default CSVTable;
