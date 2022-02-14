import React from 'react';
import { PlainClientAPI } from 'contentful-management';
import { EntryAPI, ContentTypeAPI } from '@contentful/app-sdk';
import {
  Typography,
  Select,
  Option,
  Button,
  Workbench,
  Heading,
  SectionHeading,
  FormLabel,
  FieldGroup,
  CheckboxField,
  HelpText
} from '@contentful/forma-36-react-components';
import { PageExtensionSDK } from '@contentful/app-sdk';
import { renderCSV, csvForContentType, CSVElements } from '../helpers/csv'
import CSVTable from './CSVTable'

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
  selectedFields: Array<string>,
  entries: Array<EntryAPI>,
  contentTypeIds: Array<ContentTypeKey>,
  csvData?: CSVElements,
  isLoading: boolean,
}


class Page extends React.Component<PageProps, PageState> {
  constructor(props: PageProps) {
    super(props)
    this.state = {
      locale: props.sdk.locales.default,
      contentType: undefined,
      selectedFields: [],
      entries: [],
      contentTypeIds: [],
      csvData: undefined,
      isLoading: false
    }

    this.changeLocale = this.changeLocale.bind(this)
    this.changeContentType = this.changeContentType.bind(this)
    this.checkField = this.checkField.bind(this)
  }

  async loadEntries() {
    if (this.state.contentType) {
      this.setState({isLoading: true})

      let entries = await this.fetchEntries()

      let csvData = csvForContentType(entries, (this.state.contentType as unknown) as ContentTypeAPI, this.state.locale, this.state.selectedFields)

      this.setState({entries, csvData, isLoading: false})
    }
  }

  async changeLocale(e: any) {
    this.setState({locale: e.target.value})

    await this.loadEntries()
  }

  async checkField(e: any) {
    let selectedFields = this.state.selectedFields
    let fieldId = e.target.value

    if (e.target.checked) {
      if (!selectedFields.includes(fieldId)) {
        selectedFields = [...this.state.selectedFields, fieldId]
      }
    } else {
      selectedFields = this.state.selectedFields.filter(f => f !== fieldId)
    }

    this.setState({selectedFields})

    await this.loadEntries()
  }

  async fetchEntries(): Promise<Array<EntryAPI>> {
    let entries: any[] = []
    let total = (await this.props.sdk.space.getEntries({content_type: this.state.contentType.sys.id, limit: 0})).total
    let pages = (total % 1000) + 1
    let currentPage = 0;

    while(currentPage < pages) {
      let tempEntries = await this.props.sdk.space.getEntries({content_type: this.state.contentType.sys.id, limit: 1000, skip: currentPage * 1000})
      entries = entries.concat((tempEntries).items)
      currentPage += 1
    }

    return entries
  }

  async changeContentType(e: any) {
    if (e.target.value === '') {
      this.setState({
        contentType: undefined,
        selectedFields: [],
        entries: [],
        csvData: undefined,
        isLoading: false
      })
      return
    }

    let contentType = await this.props.sdk.space.getContentType(e.target.value)
    let selectedFields = contentType.fields.map(f => f.id)

    this.setState({contentType, selectedFields})

    await this.loadEntries()
  }

  async componentDidMount() {
    let contentTypes: any[] = (await this.props.sdk.space.getContentTypes()).items
    this.setState({
      contentTypeIds: contentTypes.map(ct => {
        return {id: ct.sys.id, name: ct.name}
      })
    })
  }

  csvAsText() {
    if (this.state.entries.length >= 1) {
      return renderCSV(this.state.entries, this.state.contentType, this.state.locale, this.state.selectedFields, '\x09')
    }
    return ''
  }

  download() {
    const element = document.createElement("a");
    const file = new Blob([this.csvAsText()], {type: 'text/csv;charset=utf-8'});
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

            <CSVTable
              csvData={this.state.csvData}
              entries={this.state.entries}
              contentType={this.state.contentType}
              isLoading={this.state.isLoading}
              selectedFields={this.state.selectedFields}
            />
          </Typography>
        </Workbench.Content>

        {this.state.contentType && <Workbench.Sidebar position="right">
          <SectionHeading>Fields for export</SectionHeading>
          <HelpText>Metadata is always included</HelpText>
          <FieldGroup>
            {this.state.contentType.fields.map((f: any) => <CheckboxField id={"chk-" + f.id} key={"chk-" + f.id} checked={this.state.selectedFields.includes(f.id)} value={f.id} labelText={f.name} onChange={this.checkField} />)}
          </FieldGroup>

          <Button className='downloadButton' disabled={!this.state.csvData} onClick={() => this.download()}>Download as CSV</Button>
        </Workbench.Sidebar>}
      </Workbench>
    </>)
  }
};

export default Page;
