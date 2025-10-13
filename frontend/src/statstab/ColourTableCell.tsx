import type React from "react";
import { TableCell } from "@mui/material";

interface ColourStyle {
    background: string;
    textColour: string;
}

function hex(value: number): string {
    const v = Math.max(0, Math.min(255, Math.round(value)));
    return v.toString(16).toUpperCase().padStart(2, "0");
}

function formatLine(background: string, textColor: string): ColourStyle {
    return { background: `#${background}`, textColour: `#${textColor}` };
}

function rangePos(value: number, start: number, stop: number): number {
    if (start < stop) {
        if (value < start) return 0;
        if (value > stop) return 1;
        return (value - start) / (stop - start);
    } else {
        if (value < stop) return 1;
        if (value > start) return 0;
        return (start - value) / (start - stop);
    }
}

const daysColor = (val?: number): ColourStyle => {
    if (val == null) return formatLine("FFFFFF", "000000");

    let item = hex(rangePos(val, 20, 0) * 255);
    let background = item + item;

    item = hex(rangePos(val, 40, 20) * 255);
    background += item;

    const textColor = val >= 12 ? "FFFFFF" : "000000";
    return formatLine(background, textColor);
}

const greenColour = (val?: number): ColourStyle => {
    if (val == null) return formatLine("FFFFFF", "000000");

    const item1 = hex(rangePos(val, 165.6, 0) * 255);
    const item2 = hex(rangePos(val, 300, 165.61) * 207 + 48);
    const background = item1 + item2 + item1;
    const textColor = val >= 200 ? "FFFFFF" : "000000";
    return formatLine(background, textColor);
}

const temperatureColour = (val?: number): ColourStyle => {
    if (val == null) return formatLine("FFFFFF", "000000");

    let item: number;
    let background: string;

    if (val < 4.5) {
        item = rangePos(val, -42.75, 4.5) * 255;
        background = hex(item);
    } else {
        item = rangePos(val, 60, 41.5) * 255;
        background = hex(item);
    }

    if (val <= 4.5) {
        item = rangePos(val, -42.75, 4.5) * 255;
        background += hex(item);
    } else {
        item = rangePos(val, 41.5, 4.5) * 255;
        background += hex(item);
    }

    if (val < -42.78) {
        item = rangePos(val, -90, -42.78) * 255;
        background += hex(item);
    } else {
        item = rangePos(val, 23, 4.5) * 255;
        background += hex(item);
    }

    const textColor = val < -23.3 || val >= 37.8 ? "FFFFFF" : "000000";
    return formatLine(background, textColor);
}

const precipitationColour = (val?: number): ColourStyle => {
    if (val == null) return formatLine("FFFFFF", "000000");

    let item = hex(rangePos(val, 165.6, 0) * 255);
    let background = item + item;

    item = hex(rangePos(val, 300, 165.61) * 207 + 48);
    background += item;

    const textColor = val > 90 ? "FFFFFF" : "000000";
    return formatLine(background, textColor);
}

const humidityColour = (val?: number): ColourStyle => {
    if (val == null) return formatLine("FFFFFF", "000000");

    let item = hex(rangePos(val, 66.67, 0) * 255);
    let background = item + item;

    item = hex(rangePos(val, 133.33, 66.667) * 255);
    background += item;

    const textColor = val >= 40 ? "FFFFFF" : "000000";
    return formatLine(background, textColor);
}

const sunshineColour = (val?: number): ColourStyle => {
    if (val == null) return formatLine("FFFFFF", "000000");

    let item: string;
    if (val < 90) item = hex(rangePos(val, 0, 90) * 170);
    else if (val < 180) item = hex(rangePos(val, 90, 180) * 42.5 + 170);
    else item = hex(rangePos(val, 180, 360) * 42.5 + 212.5);
    let background = item + item;

    if (val < 90) item = hex(rangePos(val, 0, 90) * 170);
    else if (val < 270) item = hex(rangePos(val, 150, 90) * 170);
    else item = hex(rangePos(val, 270, 720) * 255);
    background += item;

    const textColor = val < 80 ? "FFFFFF" : "000000";
    return formatLine(background, textColor);
}

const uvColour = (val?: number): ColourStyle => {
    if (val == null) return formatLine("FFFFFF", "000000");

    let background: string;
    if (val < 3) background = "3EA72D";
    else if (val < 6) background = "FFF300";
    else if (val < 8) background = "F18B00";
    else if (val < 11) background = "E53210";
    else background = "A45693";

    const textColor = val < 3 ? "FFFFFF" : val < 8 ? "000000" : "FFFFFF";
    return formatLine(background, textColor);
}

const ColourTableCell: React.FC<{ type: 'temp' | 'uv' | 'rain' | 'green' | 'humidity' | 'sunshine' | 'days', children: number }> = ({ type, children }) => {
    let unit;
    let colours: ColourStyle | null = null;
    let decimalPlaces = 1;
    switch (type) {
        case 'temp':
            unit = '°C';
            colours = temperatureColour(children);
            break;
        case 'uv':
            unit = '';
            colours = uvColour(children);
            break;
        case 'rain':
            unit = 'mm';
            colours = precipitationColour(children);
            break;
        case 'green':
            unit = '';
            colours = greenColour(children);
            break;
        case 'humidity':
            unit = '%';
            colours = humidityColour(children);
            break;
        case 'sunshine':
            unit = '';
            colours = sunshineColour(children);
            break;
        case 'days':
            unit = 'day' + (children === 1 ? '' : 's');
            colours = daysColor(children);
            decimalPlaces = 0;
            break;
        default: throw new Error(`Unknown type ${type}`);
    }

    return (
        <TableCell style={{ backgroundColor: colours!.background, color: colours!.textColour }}>
            {children.toFixed(decimalPlaces)} {unit}
        </TableCell>
    );
};

export default ColourTableCell;
