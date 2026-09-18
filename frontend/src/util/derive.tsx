import { Temporal } from 'temporal-polyfill';

export const dewPoint = (tempC?: number, relativeHumidity?: number) => {
    if (tempC == null || relativeHumidity == null) {
        return '-';
    }

    // Magnus formula constants for water over liquid
    const magnusA = 17.27;
    const magnusB = 237.7;
    
    const alpha = (magnusA * tempC) / (magnusB + tempC) + Math.log(relativeHumidity / 100);
    const dewPointC = (magnusB * alpha) / (magnusA - alpha);
    return dewPointC.toFixed(1);
};

export const isNight = (hour: number): boolean => {
    return hour < 6 || hour >= 18;
};

export type TimeOfDayPeriod = 'dawn' | 'day' | 'dusk' | 'night';

const TRANSITION_WINDOW_MINUTES = 45;

// Real BOM's current-conditions band changes colour with the time of day
// (dawn/day/dusk/night). We work it out from actual sunrise/sunset times
// when available, with a simple day/night fallback otherwise.
export const getTimeOfDayPeriod = (sunrise?: string, sunset?: string): TimeOfDayPeriod => {
    const now = Temporal.Now.instant();
    if (!sunrise || !sunset) {
        const hour = now.toZonedDateTimeISO(Temporal.Now.timeZoneId()).hour;
        return isNight(hour) ? 'night' : 'day';
    }

    const sunriseInstant = Temporal.Instant.from(sunrise);
    const sunsetInstant = Temporal.Instant.from(sunset);
    const window = { minutes: TRANSITION_WINDOW_MINUTES };

    const dawnStart = sunriseInstant.subtract(window);
    const dawnEnd = sunriseInstant.add(window);
    const duskStart = sunsetInstant.subtract(window);
    const duskEnd = sunsetInstant.add(window);

    if (Temporal.Instant.compare(now, dawnStart) >= 0 && Temporal.Instant.compare(now, dawnEnd) < 0) {
        return 'dawn';
    }
    if (Temporal.Instant.compare(now, duskStart) >= 0 && Temporal.Instant.compare(now, duskEnd) < 0) {
        return 'dusk';
    }
    if (Temporal.Instant.compare(now, dawnEnd) >= 0 && Temporal.Instant.compare(now, duskStart) < 0) {
        return 'day';
    }
    return 'night';
};
