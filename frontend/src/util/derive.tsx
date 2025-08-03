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
