import React from 'react';
import { PlainClientAPI } from 'contentful-management';
import { EntryAPI, ContentTypeAPI } from '@contentful/app-sdk';
import {
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Select,
  Option,
  Button,
  Workbench,
  Heading,
  FormLabel,
  HelpText
} from '@contentful/forma-36-react-components';
import { PageExtensionSDK } from '@contentful/app-sdk';
import { renderCSV, csvForContentType, CSVElements } from '../helpers/csv'

interface PageProps {
  sdk: PageExtensionSDK;
  cma: PlainClientAPI;
}

interface ContentTypeKey {
  id: string,
  name: string
}

interface PageState {
  locale: string,
  contentType: any,
  entries: Array<EntryAPI>,
  contentTypeIds: Array<ContentTypeKey>,
  csvData?: CSVElements,
}


class Page extends React.Component<PageProps, PageState> {
  constructor(props: PageProps) {
    super(props)
    this.state = {
      locale: props.sdk.locales.default,
      contentType: undefined,
      entries: [],
      contentTypeIds: [],
      csvData: undefined
    }

    this.changeLocale = this.changeLocale.bind(this)
    this.changeContentType = this.changeContentType.bind(this)
  }

  changeLocale(e: any) {
    this.setState({locale: e.target.value})
  }

  async changeContentType(e: any) {
    if (e.target.value === '') {
      this.setState({
        contentType: undefined,
        entries: [],
        csvData: undefined
      })
      return
    }

    let contentType = await this.props.sdk.space.getContentType(e.target.value)
    let entries: any[] = []
    let total = (await this.props.sdk.space.getEntries({content_type: contentType.sys.id, limit: 0})).total
    let pages = (total % 1000) + 1
    let currentPage = 0;

    while(currentPage < pages) {
      let tempEntries = await this.props.sdk.space.getEntries({content_type: contentType.sys.id, limit: 1000, skip: currentPage * 1000})
      entries = entries.concat((tempEntries).items)
      currentPage += 1
    }

    let csvData = csvForContentType(entries, (contentType as unknown) as ContentTypeAPI, this.state.locale)

    this.setState({contentType, entries, csvData})
  }

  async componentDidMount() {
    let contentTypes: any[] = (await this.props.sdk.space.getContentTypes()).items
    this.setState({
      contentTypeIds: contentTypes.map(ct => {
        return {id: ct.sys.id, name: ct.name}
      })
    })
  }

  csvAsText(entries: Array<EntryAPI>, contentType: any) {
    if (entries.length >= 1) {
      return renderCSV(entries, contentType, this.state.locale, '\x09')
    }
    return ''
  }

  download() {
    const element = document.createElement("a");
    const file = new Blob([this.csvAsText(this.state.entries, this.state.contentType)], {type: 'text/csv;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = this.state.contentType.sys.id + '-' + this.props.sdk.ids.space + '-' + this.state.locale + '.csv';
    document.body.appendChild(element);
    element.click();
  }

  render() {
    return (<>
      <Workbench>
        <Workbench.Content>
          <Typography>
            <Heading>Generic CSV Export</Heading>
            <div id='buttonDiv'>
              <Button className='downloadButton' disabled={!this.state.csvData} onClick={() => {this.download()}}>Download as CSV</Button>
            </div>

            <div id='container'>
              <div id='leftContainer'>
                <FormLabel htmlFor="locale">Locale</FormLabel>
                <Select id="localeSelect" name="localeSelect" width="large" value={this.state.locale} onChange={this.changeLocale}>
                  {Object.entries(this.props.sdk.locales.names).map(([id, name]) => <Option value={id} key={'locale-' + id}>{name}</Option>)}
                </Select>
                <HelpText>Select a locale</HelpText>
              </div>
              <div id='rightContainer'>
                <FormLabel htmlFor="contentTypes">Content Type</FormLabel><Select id="contentTypeSelect" name="localeSelect" width="large" value={(this.state.contentType && this.state.contentType.sys.id) || ''} onChange={this.changeContentType}>
                  <Option value={''}>None</Option>
                  {this.state.contentTypeIds.map(ct => <Option value={ct.id} key={'ct-' + ct.id}>{ct.name}</Option>)}
                </Select>
                <HelpText>Select a content type</HelpText>
              </div>
            </div>

            <FormLabel htmlFor="csvData">All entries for this content type as CSV</FormLabel>
            {(this.state.csvData && <Table>
              <TableHead>
                <TableRow>
                  {this.state.csvData.header.map(f => <TableCell key={"header-" + f}>{f}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {this.state.csvData.body.map((r, i) => {
                  return <TableRow key={"body-row-" + i}>
                    {r.map((c, j) => <TableCell key={"body-row-" + i + "-" + j}>{c}</TableCell>)}
                  </TableRow>
                })}
              </TableBody>
            </Table>)}
          </Typography>
        </Workbench.Content>
      </Workbench>
    </>)
  }
};

export default Page;
