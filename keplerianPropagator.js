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

// keplerianPropagator.js
class KeplerianPropagator {
    constructor() {
        // Physical constants
        this.mu = 3.986004418e14; // m³/s² (exact value used in MATLAB)
    }

    /**
     * Generates a Walker Delta constellation
     * @param {Object} params - Constellation parameters
     * @param {number} params.a - Semi-major axis in meters
     * @param {number} params.i - Inclination in degrees
     * @param {number} params.totalSatellites - Total number of satellites
     * @param {number} params.geometryPlanes - Number of orbital planes
     * @param {number} params.phasing - Phasing factor
     * @param {number} params.epoch - Initial epoch in milliseconds
     * @returns {Array} Array of objects with orbital parameters for each satellite
     */
    generateWalkerDelta({ a, i, totalSatellites, geometryPlanes, phasing, epoch }) {
        const sats = [];
        const satsPerPlane = totalSatellites / geometryPlanes;
        const deltaRAAN = 360 / geometryPlanes;
        const deltaAnomaly = 360 / satsPerPlane;
        const phaseShift = (phasing * 360) / totalSatellites;

        for (let p = 0; p < geometryPlanes; p++) {
            const raan = p * deltaRAAN;

            for (let s = 0; s < satsPerPlane; s++) {
                const ν = (s * deltaAnomaly + p * phaseShift) % 360;
                sats.push({
                    a, e: 0, i, raan, argPerigee: 0, trueAnomaly0: ν,
                    epoch, name: `p${p + 1}s${s + 1}`
                });
            }
        }
        return sats;
    }

    /**
     * Propagates a satellite using Keplerian dynamics
     * @param {Object} params - Orbital parameters
     * @param {number} params.a - Semi-major axis in meters
     * @param {number} params.e - Eccentricity
     * @param {number} params.i - Inclination in degrees
     * @param {number} params.raan - Right ascension of ascending node in degrees
     * @param {number} params.argPerigee - Argument of perigee in degrees
     * @param {number} params.trueAnomaly0 - Initial true anomaly in degrees
     * @param {number} params.epoch - Initial epoch in milliseconds
     * @param {number} params.time - Propagation time in milliseconds
     * @returns {Object} Position in ECI coordinates (x, y, z in meters)
     */
    propagate({ a, e = 0, i, raan, argPerigee, trueAnomaly0, epoch, time }) {
        const deg2rad = x => x * Math.PI / 180;
        const iRad = deg2rad(i);
        const Ω = deg2rad(raan);
        const ω = deg2rad(argPerigee);
        const ν0 = deg2rad(trueAnomaly0);
        const dt = (time - epoch) / 1000; // in seconds
        const n = Math.sqrt(this.mu / Math.pow(a, 3)); // rad/s

        const E0 = 2 * Math.atan(Math.tan(ν0 / 2) * Math.sqrt((1 - e) / (1 + e)));
        const M0 = E0 - e * Math.sin(E0);
        const M = M0 + n * dt;

        function solveKepler(M, e, tol = 1e-12) {
            let E = M, delta = 1;
            while (Math.abs(delta) > tol) {
                delta = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
                E -= delta;
            }
            return E;
        }

        const E = solveKepler(M, e);
        const ν = 2 * Math.atan2(
            Math.sqrt(1 + e) * Math.sin(E / 2),
            Math.sqrt(1 - e) * Math.cos(E / 2)
        );

        const r = a * (1 - e * Math.cos(E));
        const x_p = r * Math.cos(ν);
        const y_p = r * Math.sin(ν);

        // Perifocal to ECI rotation
        const cosΩ = Math.cos(Ω), sinΩ = Math.sin(Ω);
        const cosω = Math.cos(ω), sinω = Math.sin(ω);
        const cosi = Math.cos(iRad), sini = Math.sin(iRad);

        const x =
            (cosΩ * cosω - sinΩ * sinω * cosi) * x_p +
            (-cosΩ * sinω - sinΩ * cosω * cosi) * y_p;
        const y =
            (sinΩ * cosω + cosΩ * sinω * cosi) * x_p +
            (-sinΩ * sinω + cosΩ * cosω * cosi) * y_p;
        const z =
            (sinω * sini) * x_p + (cosω * sini) * y_p;

        return { x, y, z };
    }

    /**
     * Generates a CSV file with propagated positions
     * @param {Object} sat - Satellite parameters
     * @param {number} startTime - Start time in milliseconds
     * @param {number} endTime - End time in milliseconds
     * @param {number} interval - Time interval in milliseconds
     * @returns {string} CSV file content
     */
    generateCSV(sat, startTime, endTime, interval) {
        let csvContent = "Time,X_km,Y_km,Z_km\n";

        for (let time = startTime; time <= endTime; time += interval) {
            const position = this.propagate({ ...sat, time });
            const date = new Date(time).toISOString();
            // Convert from meters to kilometers
            const x_km = position.x / 1000;
            const y_km = position.y / 1000;
            const z_km = position.z / 1000;
            csvContent += `${date},${x_km.toFixed(9)},${y_km.toFixed(9)},${z_km.toFixed(9)}\n`;
        }

        return csvContent;
    }

    /**
     * Calcula el Greenwich Mean Sidereal Time (GMST) para una fecha dada (Date o ms)
     * @param {Date|number} date - Fecha en ms o Date
     * @returns {number} GMST en radianes
     */
    gmst(date) {
        // Adaptado de satellite.js y Vallado
        const JD = (typeof date === 'number' ? date : date.getTime()) / 86400000 + 2440587.5;
        const T = (JD - 2451545.0) / 36525.0;
        let gmst = 280.46061837 + 360.98564736629 * (JD - 2451545.0) + 0.000387933 * T * T - (T * T * T) / 38710000.0;
        gmst = ((gmst % 360) + 360) % 360; // [0,360)
        return gmst * Math.PI / 180; // en radianes
    }

    /**
     * Convierte coordenadas ECI a ECEF
     * @param {Object} posECI - {x, y, z} en metros
     * @param {number} gmst - Greenwich Mean Sidereal Time en radianes
     * @returns {Object} {x, y, z} en metros (ECEF)
     */
    eciToEcef(posECI, gmst) {
        const cosGmst = Math.cos(gmst);
        const sinGmst = Math.sin(gmst);
        return {
            x: posECI.x * cosGmst + posECI.y * sinGmst,
            y: -posECI.x * sinGmst + posECI.y * cosGmst,
            z: posECI.z
        };
    }
}

// Export the class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KeplerianPropagator;
} else {
    window.KeplerianPropagator = KeplerianPropagator;
}
