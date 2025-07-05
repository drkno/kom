# KOM - The Knox of Meteorology

A parody of [BOM](https://beta.bom.gov.au) with real weather station data from a local weather station.

## Why

Why not. Also having your own weather site is fun.

## Was this vibe-coded

The vibes are strong with this one.

## Contributing

Contributions welcome, but they must remain compatible with my own weather station if I still have one.

## Deploying

Assuming you also have an ECOWITT GW1101 with WS69:

**docker-compose.yml**:

```yaml
services:
    influxdb:
        container_name: influxdb
        image: influxdb:latest
        volumes:
            - /share/Container/weather/influx:/var/lib/influxdb
        environment:
            - INFLUXDB_DB=db0
            - INFLUXDB_ADMIN_USER=${INFLUXDB_USERNAME}
            - INFLUXDB_ADMIN_PASSWORD=${INFLUXDB_PASSWORD}
        restart: unless-stopped

    ecowitt_listener:
        container_name: ecowitt_listener
        image: bentasker12/ecowitt_listener:latest
        ports:
            # configure your WS69 to post data to this port
            - 3001:8090
        depends_on:
            - influxdb
        environment:
            - INFLUX_URL=http://influxdb:8086
            - INFLUX_BUCKET=${INFLUXDB_BUCKET}
            - INFLUX_TOKEN=${INFLUXDB_TOKEN}
            - INFLUX_ORG=${INFLUXDB_ORG}
            - SPEED_KPH=yes
            - TEMP_C=yes
            - RAIN_MM=yes
            - PRESSURE_HPA=yes
            - MET_OFFICE_WOW_ENABLED=no
        restart: unless-stopped
    
    kom:
        container_name: kom
        image: drkno/kom:latest
        ports:
            - 80:5000
        depends_on:
            - influxdb
        environment:
            - INFLUX_URL=http://influxdb:8086
            - INFLUX_BUCKET=${INFLUXDB_BUCKET}
            - INFLUX_TOKEN=${INFLUXDB_TOKEN}
            - INFLUX_ORG=${INFLUXDB_ORG}
        restart: unless-stopped
```
