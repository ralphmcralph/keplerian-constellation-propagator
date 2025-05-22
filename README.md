# Keplerian Propagator and Walker Delta constellation generator

A JavaScript library for two-body Keplerian orbital propagation and Walker Delta constellation generation. The library provides tools for satellite position calculation in both ECI and ECEF coordinate systems.

## Installation

```bash
npm install keplerian-walkerdelta-propagator
```

## Usage

### Basic Propagation

```javascript
const KeplerianPropagator = require('keplerian-walkerdelta-propagator');

const propagator = new KeplerianPropagator();

// Define satellite parameters (Starlink-like orbit)
const satParams = {
  a: 6928137, // meters (altitude 550 km)
  e: 0,
  i: 53.0, // degrees
  raan: 0, // degrees
  argPerigee: 0, // degrees
  trueAnomaly0: 0, // degrees
  epoch: Date.parse('2024-01-01T00:00:00Z'),
};

// Propagate to 1 hour after epoch
const time = satParams.epoch + 3600000;
const position = propagator.propagate({ ...satParams, time });
console.log('Position (ECI):', position);

// Convert to ECEF
const gmst = propagator.gmst(time);
const positionECEF = propagator.eciToEcef(position, gmst);
console.log('Position (ECEF):', positionECEF);
```

### Walker Delta Constellation

```javascript
// Generate a Starlink-like constellation (72 planes × 22 satellites)
const constellation = propagator.generateWalkerDelta({
  a: 6928137, // meters (altitude 550 km)
  i: 53.0, // degrees
  totalSatellites: 1584, // 72 planes × 22 satellites
  geometryPlanes: 72,
  phasing: 1,
  epoch: Date.parse('2024-01-01T00:00:00Z'),
});
```

### Generate CSV with Positions

```javascript
const startTime = satParams.epoch;
const endTime = startTime + 24 * 60 * 60 * 1000; // 24 hours
const interval = 60 * 1000; // 1 minute

let csvContent =
  'Time,X_ECI_km,Y_ECI_km,Z_ECI_km,X_ECEF_km,Y_ECEF_km,Z_ECEF_km\n';

for (let time = startTime; time <= endTime; time += interval) {
  const posECI = propagator.propagate({ ...satParams, time });
  const gmst = propagator.gmst(time);
  const posECEF = propagator.eciToEcef(posECI, gmst);

  const date = new Date(time).toISOString();
  // Convert from meters to kilometers
  const x_eci_km = posECI.x / 1000;
  const y_eci_km = posECI.y / 1000;
  const z_eci_km = posECI.z / 1000;
  const x_ecef_km = posECEF.x / 1000;
  const y_ecef_km = posECEF.y / 1000;
  const z_ecef_km = posECEF.z / 1000;

  csvContent += `${date},${x_eci_km.toFixed(9)},${y_eci_km.toFixed(
    9,
  )},${z_eci_km.toFixed(9)},${x_ecef_km.toFixed(9)},${y_ecef_km.toFixed(
    9,
  )},${z_ecef_km.toFixed(9)}\n`;
}
```

## API Reference

### KeplerianPropagator

Main class for orbital propagation calculations.

#### Methods

##### propagate(params)

Propagates a satellite using Keplerian dynamics.

- `params` (Object):
  - `a` (number): Semi-major axis in meters
  - `e` (number): Eccentricity
  - `i` (number): Inclination in degrees
  - `raan` (number): Right ascension of ascending node in degrees
  - `argPerigee` (number): Argument of perigee in degrees
  - `trueAnomaly0` (number): Initial true anomaly in degrees
  - `epoch` (number): Initial epoch in milliseconds
  - `time` (number): Propagation time in milliseconds
- Returns: `{x, y, z}` in meters (ECI coordinates)

##### generateWalkerDelta(params)

Generates a Walker Delta constellation.

- `params` (Object):
  - `a` (number): Semi-major axis in meters
  - `i` (number): Inclination in degrees
  - `totalSatellites` (number): Total number of satellites
  - `geometryPlanes` (number): Number of orbital planes
  - `phasing` (number): Phasing factor
  - `epoch` (number): Initial epoch in milliseconds
- Returns: Array of satellite objects with orbital parameters

##### gmst(date)

Calculates Greenwich Mean Sidereal Time (GMST).

- `date` (Date|number): Date object or timestamp in milliseconds
- Returns: GMST in radians

##### eciToEcef(posECI, gmst)

Converts ECI coordinates to ECEF.

- `posECI` (Object): `{x, y, z}` in meters (ECI coordinates)
- `gmst` (number): GMST in radians
- Returns: `{x, y, z}` in meters (ECEF coordinates)

## License

Keplerian Constellation Propagator is licensed under the GNU General Public License v3.0 (GPLv3).  
See the [LICENSE](./LICENSE) file for details.
