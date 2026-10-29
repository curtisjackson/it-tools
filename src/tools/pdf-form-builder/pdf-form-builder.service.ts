import { PDFDocument, type PDFFont, StandardFonts, rgb } from 'pdf-lib';

// Ported from Omni-Tools (src/pages/tools/pdf/form-pdf), MIT, which places fields on the pages and
// writes them with pdf-lib. Unlike Omni, the values entered here go into the PDF, multi-line fields
// are multi-line, check boxes and radio buttons keep their size, radio buttons with the same name
// form one group, and text that Helvetica cannot write (Cyrillic and others) uses an embedded font.

export type FieldType = 'text' | 'multiline' | 'checkbox' | 'radio' | 'dropdown' | 'label';

/** A field on a page. Coordinates in PDF points, from the top left corner of the page. */
export interface FormField {
  id: string;
  type: FieldType;
  /** 0-based. */
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Field name; for radio buttons, the name of their group. */
  name: string;
  /**
   * Text fields and drop-downs: the value. Check boxes: 'true' when checked. Radio buttons: the
   * value of this option. Labels: the text.
   */
  value: string;
  /** Radio buttons: selected by default. */
  checked: boolean;
  /** Drop-downs: the options, one per line. */
  options: string;
  /** 0 for the automatic size of fields. */
  fontSize: number;
  required: boolean;
}

export interface PageSize {
  width: number;
  height: number;
}

export const DEFAULT_SIZES: Record<FieldType, PageSize> = {
  text: { width: 160, height: 22 },
  multiline: { width: 220, height: 60 },
  checkbox: { width: 14, height: 14 },
  radio: { width: 14, height: 14 },
  dropdown: { width: 140, height: 22 },
  label: { width: 140, height: 18 },
};

const MIN_SIZE = 6;

export function clampField(field: FormField, page: PageSize): FormField {
  const width = Math.min(Math.max(field.width, MIN_SIZE), page.width);
  const height = Math.min(Math.max(field.height, MIN_SIZE), page.height);
  return {
    ...field,
    width,
    height,
    x: Math.min(Math.max(field.x, 0), page.width - width),
    y: Math.min(Math.max(field.y, 0), page.height - height),
  };
}

/** A new field of its default size centered on a point of the page, with a free name. */
export function newField(
  type: FieldType,
  page: number,
  size: PageSize,
  center: { x: number; y: number },
  existing: FormField[],
): FormField {
  const { width, height } = DEFAULT_SIZES[type];
  const taken = new Set(existing.map((field) => field.name));
  let index = 1;
  while (taken.has(`${type}${index}`)) {
    index++;
  }
  return clampField(
    {
      id: Math.random().toString(36).slice(2),
      type,
      page,
      x: center.x - width / 2,
      y: center.y - height / 2,
      width,
      height,
      name: `${type}${index}`,
      value: type === 'radio' ? 'option1' : '',
      checked: false,
      options: type === 'dropdown' ? 'Option 1\nOption 2' : '',
      fontSize: type === 'label' ? 12 : 0,
      required: false,
    },
    size,
  );
}

/** Field names that cannot go into the PDF: used twice, or already in it. */
export class FieldNameError extends Error {
  constructor(
    readonly kind: 'duplicate' | 'existing',
    readonly names: string[],
  ) {
    super(
      kind === 'duplicate'
        ? `Several fields are named ${names.join(', ')}.`
        : `The PDF already has a field named ${names.join(', ')}.`,
    );
  }
}

export function dropdownOptions(field: FormField): string[] {
  return field.options
    .split('\n')
    .map((option) => option.trim())
    .filter(Boolean);
}

/** Names used by two fields, which a PDF form cannot have; radio buttons share the name of their group. */
export function duplicateNames(fields: FormField[]): string[] {
  const owners = new Map<string, string>();
  const duplicates = new Set<string>();
  for (const field of fields) {
    if (field.type === 'label') {
      continue;
    }
    const owner = field.type === 'radio' ? `radio:${field.name}` : field.id;
    const previous = owners.get(field.name);
    if (previous !== undefined && previous !== owner) {
      duplicates.add(field.name);
    }
    owners.set(field.name, owner);
  }
  return [...duplicates];
}

/** The texts that go into the PDF. */
function textsOf(fields: FormField[]): string[] {
  return fields.flatMap((field) => {
    switch (field.type) {
      case 'text':
      case 'multiline':
      case 'label':
      case 'radio':
        return [field.value];
      case 'dropdown':
        return [field.value, ...dropdownOptions(field)];
      default:
        return [];
    }
  });
}

function encodable(font: PDFFont, text: string): boolean {
  try {
    font.encodeText(text.replace(/\n/g, ' '));
    return true;
  } catch {
    return false;
  }
}

/**
 * Adds the fields to the PDF. `loadUnicodeFont` gives a TrueType font, embedded only when a text
 * cannot be written with Helvetica.
 */
export async function addFormFields(
  pdf: ArrayBuffer | Uint8Array,
  fields: FormField[],
  loadUnicodeFont: () => Promise<Uint8Array>,
): Promise<Uint8Array> {
  const duplicates = duplicateNames(fields);
  if (duplicates.length) {
    throw new FieldNameError('duplicate', duplicates);
  }
  const document = await PDFDocument.load(pdf);
  const helvetica = await document.embedFont(StandardFonts.Helvetica);
  let font = helvetica;
  if (!textsOf(fields).every((text) => encodable(helvetica, text))) {
    const { default: fontkit } = await import('@pdf-lib/fontkit');
    document.registerFontkit(fontkit);
    // Not subset: whoever fills in the form may type letters that are not in it yet.
    font = await document.embedFont(await loadUnicodeFont(), { subset: false });
  }

  const form = document.getForm();
  const existing = new Set(form.getFields().map((field) => field.getName()));
  const clashes = [
    ...new Set(fields.filter((field) => field.type !== 'label' && existing.has(field.name)).map((field) => field.name)),
  ];
  if (clashes.length) {
    throw new FieldNameError('existing', clashes);
  }

  const pages = document.getPages();
  const groups = new Set<string>();
  for (const field of fields) {
    const page = pages[field.page];
    if (!page) {
      continue;
    }
    // pdf-lib, like PDF, counts from the bottom left corner. A cropped page starts at its crop box.
    const box = page.getCropBox();
    // pdf-lib grows a widget by half its border on each side: shrink it back to the drawn rectangle.
    const border = 1;
    const rect = {
      x: box.x + field.x + border / 2,
      y: box.y + box.height - field.y - field.height + border / 2,
      width: field.width - border,
      height: field.height - border,
      borderWidth: border,
      font,
    };

    switch (field.type) {
      case 'text':
      case 'multiline': {
        const text = form.createTextField(field.name);
        if (field.type === 'multiline') {
          text.enableMultiline();
        }
        if (field.value) {
          text.setText(field.value);
        }
        if (field.required) {
          text.enableRequired();
        }
        text.addToPage(page, rect);
        if (field.fontSize > 0) {
          text.setFontSize(field.fontSize);
        }
        break;
      }
      case 'checkbox': {
        const checkBox = form.createCheckBox(field.name);
        checkBox.addToPage(page, rect);
        if (field.value === 'true') {
          checkBox.check();
        }
        if (field.required) {
          checkBox.enableRequired();
        }
        break;
      }
      case 'radio': {
        const group = groups.has(field.name) ? form.getRadioGroup(field.name) : form.createRadioGroup(field.name);
        groups.add(field.name);
        group.addOptionToPage(field.value || 'option', page, rect);
        if (field.checked) {
          group.select(field.value || 'option');
        }
        if (field.required) {
          group.enableRequired();
        }
        break;
      }
      case 'dropdown': {
        const dropdown = form.createDropdown(field.name);
        const options = dropdownOptions(field);
        dropdown.addOptions(options);
        if (options.includes(field.value)) {
          dropdown.select(field.value);
        }
        if (field.required) {
          dropdown.enableRequired();
        }
        dropdown.addToPage(page, rect);
        if (field.fontSize > 0) {
          dropdown.setFontSize(field.fontSize);
        }
        break;
      }
      case 'label': {
        const size = field.fontSize || 12;
        page.drawText(field.value, {
          x: box.x + field.x,
          y: box.y + box.height - field.y - size,
          size,
          font,
          color: rgb(0, 0, 0),
          lineHeight: size * 1.2,
          maxWidth: field.width,
        });
        break;
      }
    }
  }

  form.updateFieldAppearances(font);
  return document.save();
}
