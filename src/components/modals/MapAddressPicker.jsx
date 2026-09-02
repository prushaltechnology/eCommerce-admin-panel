import { useState, useCallback, useEffect, useRef } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    useMap,
    useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
    MUMBAI_CENTER,
    MUMBAI_RADIUS_METERS,
    haversineDistance,
} from "./geoUtils"; // adjust path to wherever geoUtils.js lives

// Your Geoapify API key. CRA-style env var shown here — if your admin
// panel uses Vite instead, swap this for `import.meta.env.VITE_GEOAPIFY_KEY`
// (and name the env var accordingly in your .env file).
const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_KEY || "a7d46c39bb424ac2bc890c2d3f1fecd6";

const pinIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

function ClickHandler({ onPick }) {
    useMapEvents({
        click(e) {
            onPick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

function extractPincode(text) {
    if (!text) return "";
    const match = text.match(/\b\d{6}\b/);
    return match ? match[0] : "";
}

// Fixes two related problems with Leaflet inside a modal:
//
// 1. Leaflet measures its container on mount, and again only when
//    invalidateSize() is explicitly called — it has no way to know when
//    its container's real size changes on its own. A fixed-delay guess
//    (rAF + a timeout) is fragile: it assumes the modal's open transition,
//    any scrollbar appearing, DevTools opening, etc. all settle within that
//    window. When they don't, Leaflet keeps rendering tiles (and placing
//    the marker) for the stale, wrong size — which is exactly the "tiles
//    only fill half the box, pin nowhere to be seen" symptom. A
//    ResizeObserver on the actual container reacts to the real size
//    whenever it changes, for any reason, instead of guessing.
// 2. flyTo() animates FROM whatever the map currently thinks its view is.
//    Animating from a broken initial position just makes the glitch more
//    visible, so the settle passes below use a non-animated setView()
//    instead — flyTo is reserved for genuine later changes (a tap, or
//    geolocation resolving), once the size is known to be correct.
function MapReady({ center }) {
    const map = useMap();
    const centerRef = useRef(center);
    const settledRef = useRef(false);

    useEffect(() => {
        centerRef.current = center;
    }, [center]);

    useEffect(() => {
        const container = map.getContainer();

        const settle = () => {
            map.invalidateSize();
            map.setView(centerRef.current, 16, { animate: false });
            settledRef.current = true;
        };

        settle();

        const observer = new ResizeObserver(() => settle());
        observer.observe(container);

        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);

    useEffect(() => {
        if (!settledRef.current) return;
        map.flyTo(center, 16);
    }, [center, map]);

    return null;
}

export default function MapAddressPicker({
    onValidAddress,
    onInvalidAddress,
    // When provided (edit mode, address already has a saved point), the map
    // opens centered on this point with the pin already placed there instead
    // of running geolocation and jumping to wherever the browser thinks the
    // user currently is.
    initialLat,
    initialLng,
}) {
    const hasInitialPosition =
        typeof initialLat === "number" && typeof initialLng === "number";

    const [position, setPosition] = useState(
        hasInitialPosition ? [initialLat, initialLng] : null
    );
    const [mapCenter, setMapCenter] = useState(
        hasInitialPosition
            ? [initialLat, initialLng]
            : [MUMBAI_CENTER.lat, MUMBAI_CENTER.lon]
    );
    const [locating, setLocating] = useState(!hasInitialPosition);
    const [resolving, setResolving] = useState(false);
    const [locationDenied, setLocationDenied] = useState(false);

    const resolvePoint = useCallback(
        async (lat, lon) => {
            setPosition([lat, lon]);
            setResolving(true);
            try {
                const res = await fetch(
                    `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${GEOAPIFY_KEY}`
                );
                const data = await res.json();
                const p = data.features?.[0]?.properties;
                if (!p) {
                    onInvalidAddress();
                    return;
                }

                const distance = haversineDistance(
                    lat,
                    lon,
                    MUMBAI_CENTER.lat,
                    MUMBAI_CENTER.lon
                );
                if (distance > MUMBAI_RADIUS_METERS) {
                    onInvalidAddress();
                    return;
                }

                const pincode =
                    p.postcode ||
                    extractPincode(p.formatted) ||
                    extractPincode(p.address_line2) ||
                    "";

                onValidAddress({
                    formattedAddress: p.formatted,
                    pincode,
                    city: p.city ?? p.county ?? "Mumbai",
                    state: p.state ?? "Maharashtra",
                    lat,
                    lon,
                });
            } catch {
                onInvalidAddress();
            } finally {
                setResolving(false);
            }
        },
        [onValidAddress, onInvalidAddress]
    );

    useEffect(() => {
        // Already have a point to show (edit mode with a saved address) — place
        // the pin there and skip geolocation entirely. We don't call
        // resolvePoint() here: the caller already has valid city/state/pincode
        // for this point, so there's no need to re-derive it, and doing so
        // would risk an unexpected onValidAddress/onInvalidAddress call firing
        // before the user has touched anything.
        if (hasInitialPosition) {
            setLocating(false);
            return;
        }

        if (!("geolocation" in navigator)) {
            setLocating(false);
            setLocationDenied(true);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                setMapCenter([lat, lon]);
                setLocating(false);
                resolvePoint(lat, lon);
            },
            () => {
                setLocating(false);
                setLocationDenied(true);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleManualPick = useCallback(
        (lat, lon) => {
            setMapCenter([lat, lon]);
            resolvePoint(lat, lon);
        },
        [resolvePoint]
    );

    return (
        <div style={{ position: "relative" }}>
            {/* This wrapper is what actually clips Leaflet's panes — width/height
          here must be explicit and fixed, and overflow:hidden is what stops
          tiles from rendering outside the rounded box. */}
            <div
                style={{
                    height: 240,
                    width: "100%",
                    borderRadius: "0.75rem",
                    overflow: "hidden",
                    position: "relative",
                    isolation: "isolate", // keeps Leaflet's internal z-index stacking contained
                }}
            >
                <MapContainer
                    center={mapCenter}
                    zoom={15}
                    zoomControl={true}
                    style={{ height: "100%", width: "100%" }}
                >
                    <MapReady center={mapCenter} />
                    <ClickHandler onPick={handleManualPick} />
                    <TileLayer
                        url={`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_KEY}`}
                        attribution="© OpenMapTiles © OpenStreetMap contributors"
                    />
                    {position && <Marker position={position} icon={pinIcon} />}
                </MapContainer>
            </div>

            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                {locating
                    ? "Detecting your current location…"
                    : locationDenied
                        ? "Location access denied — tap the map to set your delivery pin."
                        : "Tap the map to adjust the pin if needed."}
            </p>

            {(locating || resolving) && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        bottom: 24,
                        background: "rgba(255,255,255,0.6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "0.75rem",
                    }}
                >
                    <span style={{ fontSize: 12, fontWeight: 500 }}>
                        {locating ? "Getting your location…" : "Checking address…"}
                    </span>
                </div>
            )}
        </div>
    );
}