// # Keplerian Constellation Propagator
// # Copyright(C) 2025 Ralph M.C.Ralph
// #
// # This program is free software: you can redistribute it and / or modify
// # it under the terms of the GNU General Public License as published by
// # the Free Software Foundation, either version 3 of the License, or
// #(at your option) any later version.
// #
// # This program is distributed in the hope that it will be useful,
// # but WITHOUT ANY WARRANTY; without even the implied warranty of
// # MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.See the
// # GNU General Public License for more details.
// #
// # You should have received a copy of the GNU General Public License
// # along with this program.If not, see < https://www.gnu.org/licenses/>.


// example.js
const propagator = new KeplerianPropagator();

// Example 1: Propagate a single satellite
const satParams = {
    a: 6928137, // meters (altitude 550 km)
    e: 0,
    i: 53.0,    // degrees
    raan: 0,    // degrees
    argPerigee: 0, // degrees
    trueAnomaly0: 0, // degrees
    epoch: Date.parse("2024-01-01T00:00:00Z")
};

// Propagate to 1 hour after epoch
const time = satParams.epoch + 3600000; // +1 hour
const position = propagator.propagate({ ...satParams, time });
console.log('Position at 1 hour (ECI):', position);

// Example 2: Convert ECI to ECEF
const gmst = propagator.gmst(time);
const positionECEF = propagator.eciToEcef(position, gmst);
console.log('Position at 1 hour (ECEF):', positionECEF);

// Example 3: Generate a Walker Delta constellation
const constellation = propagator.generateWalkerDelta({
    a: 6928137,  // meters (altitude 550 km)
    i: 53.0,     // degrees
    totalSatellites: 1584, // 72 planes × 22 satellites
    geometryPlanes: 72,
    phasing: 1,
    epoch: satParams.epoch
});

// Example 4: Generate CSV for a satellite with both ECI and ECEF positions
const startTime = satParams.epoch;
const endTime = startTime + (24 * 60 * 60 * 1000); // 24 hours
const interval = 60 * 1000; // 1 minute

let csvContent = "Time,X_ECI_km,Y_ECI_km,Z_ECI_km,X_ECEF_km,Y_ECEF_km,Z_ECEF_km\n";

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

    csvContent += `${date},${x_eci_km.toFixed(9)},${y_eci_km.toFixed(9)},${z_eci_km.toFixed(9)},${x_ecef_km.toFixed(9)},${y_ecef_km.toFixed(9)},${z_ecef_km.toFixed(9)}\n`;
}

// Save CSV
const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
const url = URL.createObjectURL(blob);
const link = document.createElement("a");
link.setAttribute("href", url);
link.setAttribute("download", "satellite_positions.csv");
link.click();
URL.revokeObjectURL(url); 