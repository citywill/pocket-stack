import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';

// Fix for default marker icon in Leaflet + React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
    value?: { lat: number; lon: number } | null;
    onChange: (val: { lat: number; lon: number }) => void;
}

export function MapPicker({ value, onChange }: MapPickerProps) {
    const [position, setPosition] = useState<L.LatLngExpression | null>(
        value && typeof value.lat === 'number' && typeof value.lon === 'number'
            ? [value.lat, value.lon]
            : null
    );

    const defaultCenter: L.LatLngExpression = [39.9042, 116.4074];

    useEffect(() => {
        if (value && typeof value.lat === 'number' && typeof value.lon === 'number') {
            setPosition([value.lat, value.lon]);
        } else {
            setPosition(null);
        }
    }, [value]);

    function ChangeView({ center }: { center: L.LatLngExpression }) {
        const map = useMap();
        useEffect(() => {
            if (center) {
                map.setView(center);
            }
        }, [center]);
        return null;
    }

    function LocationMarker() {
        const map = useMapEvents({
            click(e) {
                const { lat, lng } = e.latlng;
                setPosition([lat, lng]);
                onChange({ lat, lon: lng });
                map.flyTo(e.latlng, map.getZoom());
            },
        });

        if (!position) return null;

        // Final safety check for Leaflet
        const posArray = position as number[];
        if (typeof posArray[0] !== 'number' || typeof posArray[1] !== 'number') {
            return null;
        }

        return <Marker position={position}></Marker>;
    }

    return (
        <div className="h-[300px] w-full rounded-xl overflow-hidden border border-neutral-200">
            <MapContainer
                center={position || defaultCenter}
                zoom={13}
                scrollWheelZoom={true}
                className="h-full w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {position && <ChangeView center={position} />}
                <LocationMarker />
            </MapContainer>
        </div>
    );
}
