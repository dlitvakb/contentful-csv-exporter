import { EntryAPI, ContentTypeAPI } from '@contentful/app-sdk';

export interface CSVElements {
  header: Array<string>,
  body: Array<Array<string>>
}

export function csvHeaders(contentType: ContentTypeAPI): Array<string> {
  return contentType.fields.map(f => f.id)
}

export function serializeValue(field: any, fieldId: string, contentType: ContentTypeAPI, locale: string): string {
  try {
    let value: any

    try {
      value = field.getValue(locale) // for sidebar cases
    } catch {
      value = field[locale] // for page cases
    }

    let fieldType = contentType.fields.find(f => f.id === fieldId)!.type

    if (['Text', 'Symbol', 'Date'].includes(fieldType)) return (value as string).replace('\n', '\\n').replace('\r', '\\r')
    if (['Number', 'Integer'].includes(fieldType)) return value + ''
    if (['RichText', 'Object', 'Link', 'Array', 'Location'].includes(fieldType)) return JSON.stringify(value).replace('\n', '\\n').replace('\r', '\\r')
    if (fieldType === 'Boolean') return value ? 'true' : 'false'
  } catch {
    // explicitly silenced
  }
  return ''
}

export function csvLine(entry: EntryAPI, contentType: ContentTypeAPI, locale: string): Array<string> {
  let line: Array<string> = []
  contentType.fields.forEach(f => {
    let fieldId = f.id
    let value: string = ''
    if (entry.fields[fieldId])
      value = serializeValue(entry.fields[fieldId], fieldId, contentType, locale) || ''
    line.push(value)
  })
  return line
}

export function csvForContentType(entries: Array<EntryAPI>, contentType: ContentTypeAPI, locale: string): CSVElements {
  return {
    header: csvHeaders(contentType),
    body: entries.map(e => csvLine(e, contentType, locale))
  }
}

export function renderCSV(entries: Array<EntryAPI>, contentType: ContentTypeAPI, locale: string, separator: string): string {
  let {header, body} = csvForContentType(entries, contentType, locale)

  let lines: Array<string> = []

  lines.push(header.join(separator))
  body.forEach(b => lines.push(b.join(separator)))

  return lines.join('\n')
}
