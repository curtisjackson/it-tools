import { describe, expect, it } from 'vitest';
import { Base64 } from 'js-base64';
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFRadioGroup, PDFTextField } from 'pdf-lib';
import { normal as robotoBase64 } from 'roboto-base64';
import {
  type FieldType,
  type FormField,
  addFormFields,
  clampField,
  duplicateNames,
  newField,
} from './pdf-form-builder.service';

const A4 = { width: 595, height: 842 };
const roboto = async () => Base64.toUint8Array(robotoBase64);

async function blankPdf(pages = 1) {
  const document = await PDFDocument.create();
  for (let i = 0; i < pages; i++) {
    document.addPage([A4.width, A4.height]);
  }
  return document.save();
}

function field(type: FieldType, overrides: Partial<FormField> = {}): FormField {
  return { ...newField(type, 0, A4, { x: 200, y: 100 }, []), ...overrides };
}

describe('pdf-form-builder', () => {
  it('places a new field around the point, inside the page, with a free name', () => {
    const first = newField('text', 0, A4, { x: 100, y: 50 }, []);
    expect(first).toMatchObject({ name: 'text1', x: 20, y: 39, width: 160, height: 22 });
    expect(newField('text', 0, A4, { x: 100, y: 50 }, [first]).name).toBe('text2');
    expect(newField('checkbox', 0, A4, { x: 0, y: 0 }, [])).toMatchObject({ x: 0, y: 0 });
    expect(clampField({ ...first, x: 590, y: 900, width: 2 }, A4)).toMatchObject({ x: 589, y: 820, width: 6 });
  });

  it('finds names used twice, but lets radio buttons share their group name', async () => {
    const fields = [
      field('text', { name: 'a' }),
      field('text', { name: 'a' }),
      field('radio', { name: 'r', value: 'yes' }),
      field('radio', { name: 'r', value: 'no' }),
      field('checkbox', { name: 'r' }),
      field('label', { name: 'label1' }),
      field('label', { name: 'label1' }),
    ];
    expect(duplicateNames(fields).sort()).toEqual(['a', 'r']);
    await expect(addFormFields(await blankPdf(), fields, roboto)).rejects.toThrow('a, r');
  });

  it('writes every kind of field, with its value', async () => {
    const fields = [
      field('text', { name: 'name', value: 'Ada', x: 50, y: 100, width: 200, height: 20, required: true }),
      field('multiline', { name: 'notes', value: 'line 1\nline 2' }),
      field('checkbox', { name: 'agree', value: 'true' }),
      field('radio', { name: 'answer', value: 'yes', checked: true, x: 50 }),
      field('radio', { name: 'answer', value: 'no', x: 100 }),
      field('dropdown', { name: 'size', options: 'S\nM\n\nL', value: 'M', fontSize: 10 }),
      field('label', { value: 'Signature:' }),
    ];
    const output = await addFormFields(await blankPdf(), fields, roboto);
    const form = (await PDFDocument.load(output)).getForm();

    const name = form.getField('name') as PDFTextField;
    expect(name).toBeInstanceOf(PDFTextField);
    expect(name.getText()).toBe('Ada');
    expect(name.isRequired()).toBe(true);
    // 100 pt from the top of an 842 pt page, 20 pt high: 722 pt from the bottom.
    expect(name.acroField.getWidgets()[0].getRectangle()).toEqual({ x: 50, y: 722, width: 200, height: 20 });

    const notes = form.getTextField('notes');
    expect(notes.isMultiline()).toBe(true);
    expect(notes.getText()).toBe('line 1\nline 2');
    expect(form.getCheckBox('agree')).toBeInstanceOf(PDFCheckBox);
    expect(form.getCheckBox('agree').isChecked()).toBe(true);

    const answer = form.getRadioGroup('answer');
    expect(answer).toBeInstanceOf(PDFRadioGroup);
    expect(answer.getOptions()).toEqual(['yes', 'no']);
    expect(answer.getSelected()).toBe('yes');

    const size = form.getDropdown('size');
    expect(size).toBeInstanceOf(PDFDropdown);
    expect(size.getOptions()).toEqual(['S', 'M', 'L']);
    expect(size.getSelected()).toEqual(['M']);

    expect(form.getFields()).toHaveLength(5);
  });

  it('embeds a font for text Helvetica cannot write, and only then', async () => {
    const latin = await addFormFields(await blankPdf(), [field('text', { value: 'Café' })], roboto);
    const cyrillic = await addFormFields(
      await blankPdf(),
      [field('text', { name: 'fio', value: 'Иванов Иван' }), field('label', { value: 'Подпись:' })],
      roboto,
    );
    expect(cyrillic.length).toBeGreaterThan(latin.length + 50_000);
    expect((await PDFDocument.load(cyrillic)).getForm().getTextField('fio').getText()).toBe('Иванов Иван');
  });

  it('puts fields on their page, and refuses names the PDF already has', async () => {
    const output = await addFormFields(await blankPdf(2), [field('text', { name: 'p2', page: 1 })], roboto);
    const document = await PDFDocument.load(output);
    const widget = document.getForm().getTextField('p2').acroField.getWidgets()[0];
    expect(widget.P()).toBe(document.getPages()[1].ref);
    await expect(addFormFields(output, [field('checkbox', { name: 'p2' })], roboto)).rejects.toThrow('p2');
  });
});
