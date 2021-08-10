import { CSVtoObject, removeFirstLine, reverseLookup, XMLtoObject } from './parser';

test('CSVtoObject', async () => {
  const parsedCSV = await CSVtoObject('1;2;3;4\n1;2;3;4', { dynamicTyping: true });
  expect(parsedCSV).toEqual([
    [1, 2, 3, 4],
    [1, 2, 3, 4]
  ]);
});

test('XMLtoObject', async () => {
  const parsedXML = await XMLtoObject(
    '<root><item>1</item><item>2</item><item>3</item><item>4</item></root>'
  );
  expect(parsedXML).toEqual({ root: { item: ['1', '2', '3', '4'] } });
});

test('reverseLookup', async () => {
  const reverseLookupResult = await reverseLookup('0977194800');
  expect(reverseLookupResult).toEqual({
    succeeded: true,
    status: 'done',
    results: [
      { name: 'Hotline zum Thema Coronavirus', type: 'company' },
      { name: 'SG 3.4 - Gesundheitsamt Corona-Hotline', type: 'company' }
    ]
  });
});

test('removeFirstLine', () => {
  const testString1 = '1;2;3;4\n5;6;7;8';
  const testString2 = '1;2;3;4\r\n5;6;7;8';
  const result1 = removeFirstLine(testString1);
  const result2 = removeFirstLine(testString2, '\r\n');
  expect(result1).toBe('5;6;7;8');
  expect(result2).toBe('5;6;7;8');
});
