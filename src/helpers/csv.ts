import { EntryAPI, ContentEntitySys, ContentTypeAPI } from '@contentful/app-sdk';

export const MetadataFields = [
  'createdAt',
  'updatedAt',
  'status',
  'tags',
  'id'
]

export interface CSVElements {
  header: Array<string>,
  body: Array<Array<string>>
}

export function sanitizeMultiline(value: string): string {
  return value.split('\n').join('\\n')
}

export function sanitizeJSON(value: object): string {
  return sanitizeMultiline(JSON.stringify(value))
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

    if (['Text', 'Symbol', 'Date'].includes(fieldType)) return sanitizeMultiline(value as string)
    if (['Number', 'Integer'].includes(fieldType)) return value + ''
    if (['RichText', 'Object', 'Link', 'Array', 'Location'].includes(fieldType)) return sanitizeJSON(value as object)
    if (fieldType === 'Boolean') return value ? 'true' : 'false'
  } catch {
    // explicitly silenced
  }
  return ''
}

export function csvHead(contentType: ContentTypeAPI, selected: Array<string>): Array<string> {
  return contentType.fields.filter((f: any) => selected.includes(f.id)).map((f: any) => f.id)
}

export function csvLine(entry: EntryAPI, contentType: ContentTypeAPI, locale: string, selected: Array<string>): Array<string> {
  let line: Array<string> = []
  contentType.fields.forEach(f => {
    let fieldId = f.id
    if (!selected.includes(fieldId)) return

    let value: string = ''
    if (entry.fields[fieldId])
      value = serializeValue(entry.fields[fieldId], fieldId, contentType, locale) || ''
    line.push(value)
  })
  return line
}

export function statusFrom(sys: ContentEntitySys): string {
  if (!('publishedAt' in sys)) return 'draft'
  if (sys.publishedVersion && sys.version > sys.publishedVersion + 1) return 'changed'
  return 'published'
}

export function metadataFor(entry: EntryAPI): Array<string> {
  let sys: any
  try {
    sys = (entry as any).sys
  } catch {
    sys = entry.getSys()
  }

  let metadata: any
  try {
    metadata = entry.metadata
  } catch {
    metadata = entry.getMetadata()
  }

  return [sys.createdAt, sys.updatedAt, statusFrom(sys), metadata.tags.map((t: any) => t.sys.id).join(', '), sys.id]
}

export function csvForContentType(entries: Array<EntryAPI>, contentType: ContentTypeAPI, locale: string, selected: Array<string>): CSVElements {
  return {
    header: csvHead(contentType, selected).concat(MetadataFields),
    body: entries.map(e => csvLine(e, contentType, locale, selected).concat(metadataFor(e)))
  }
}

export function renderCSV(entries: Array<EntryAPI>, contentType: ContentTypeAPI, locale: string, selected: Array<string>, separator: string): string {
  let {header, body} = csvForContentType(entries, contentType, locale, selected)

  let lines: Array<string> = []

  lines.push(header.join(separator))
  body.forEach(b => lines.push(b.join(separator)))

  return lines.join('\n')
}
