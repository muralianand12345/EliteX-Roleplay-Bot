import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { ColorData } from '../../types';

const csvFilePath = path.resolve(__dirname, '../../../assets/colornames.csv');
const csvData = fs.readFileSync(csvFilePath, 'utf8');
const records: ColorData[] = parse(csvData, {
    columns: true,
    skip_empty_lines: true
});

const colorMap = new Map<string, string>();
records.forEach(record => {
    colorMap.set(record.name.toLowerCase(), record.hex);
    if (record.goodName) {
        colorMap.set(record.goodName.toLowerCase(), record.hex);
    }
});

const getNearestColor = (color: string): { name: string; hex: string } | null => {
    const lowerColor = color.toLowerCase();
    if (colorMap.has(lowerColor)) {
        return { name: lowerColor, hex: colorMap.get(lowerColor)! };
    }
    return null;
}

export { getNearestColor };