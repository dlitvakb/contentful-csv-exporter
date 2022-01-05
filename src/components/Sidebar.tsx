import React from 'react';
import { PlainClientAPI } from 'contentful-management';
import { Paragraph, Typography, Textarea, Select, Option, Button } from '@contentful/forma-36-react-components';
import { SidebarExtensionSDK } from '@contentful/app-sdk';
import { renderCSV } from '../helpers/csv'

interface SidebarProps {
  sdk: SidebarExtensionSDK;
  cma: PlainClientAPI;
}

interface SidebarState {
  locale: string,
  csvText: string
}


class Sidebar extends React.Component<SidebarProps, SidebarState> {
  constructor(props: SidebarProps) {
    super(props)
    this.state = {
      locale: props.sdk.locales.default,
      csvText: renderCSV([this.props.sdk.entry], this.props.sdk.contentType, props.sdk.locales.default, '\t')
    }

    this.changeLocale = this.changeLocale.bind(this)
  }

  changeLocale(e: any) {
    this.setState({locale: e.target.value, csvText: renderCSV([this.props.sdk.entry], this.props.sdk.contentType, this.state.locale, '\t')})
  }

  download() {
    const element = document.createElement("a");
    const file = new Blob([this.state.csvText], {type: 'text/csv;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = this.props.sdk.entry.getSys().id + '-' + this.state.locale + '.csv';
    document.body.appendChild(element);
    element.click();
  }

  componentDidMount() {
    this.props.sdk.window.startAutoResizer()
  }

  render() {
    return (<>
      <Typography>
        <Paragraph>
          Locale: <Select id="localeSelect" name="localeSelect" width="large" value={this.state.locale} onChange={this.changeLocale}>
            {Object.entries(this.props.sdk.locales.names).map(([id, name]) => <Option value={id} key={'locale-' + id}>{name}</Option>)}
          </Select>
        </Paragraph>
        <Paragraph>This entry as CSV:</Paragraph>
        <Textarea disabled value={this.state.csvText} rows={2} />
        <Button disabled={!this.state.csvText} onClick={() => {this.download()}}>Download as CSV</Button>
      </Typography>
    </>)
  }
};

export default Sidebar;
