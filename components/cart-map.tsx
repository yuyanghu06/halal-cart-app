'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Cart, online } from '@/lib/types';
export default function CartMap({ carts, onSelect }: { carts: Cart[]; onSelect: (cart: Cart) => void }) {
  const el = useRef<HTMLDivElement>(null); const mapRef = useRef<L.Map | null>(null); const markers = useRef<L.LayerGroup | null>(null); const fitted = useRef(false); const selected = useRef(onSelect); selected.current = onSelect;
  useEffect(() => {
    if (!el.current) return;
    const map = L.map(el.current, { scrollWheelZoom: false }).setView([40.745, -73.985], 12); mapRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
    markers.current = L.layerGroup().addTo(map);
    const resize = new ResizeObserver(() => map.invalidateSize()); resize.observe(el.current);
    return () => { resize.disconnect(); map.remove(); mapRef.current = null; markers.current = null; fitted.current = false; };
  }, []);
  useEffect(() => {
    const map = mapRef.current; const layer = markers.current; if (!map || !layer) return;
    layer.clearLayers(); const points: L.LatLngTuple[] = [];
    carts.forEach(cart => {
      if (cart.latitude === null || cart.longitude === null) return;
      const position: L.LatLngTuple = [cart.latitude, cart.longitude]; points.push(position);
      const marker = L.marker(position, { icon: L.divIcon({ className: 'cart-marker', html: `<span class="${online(cart) ? 'live' : ''}">▣</span>`, iconSize: [36, 42], iconAnchor: [18, 40] }), title: cart.name, keyboard: true }).addTo(layer);
      const container = document.createElement('div'); const title = document.createElement('strong'); title.textContent = cart.name; container.append(title);
      const status = document.createElement('p'); status.textContent = online(cart) ? 'Online · accepting pickup orders' : 'Offline · last shared location'; container.append(status);
      const button = document.createElement('button'); button.textContent = 'View cart & menu'; button.onclick = () => selected.current(cart); container.append(button); marker.bindPopup(container);
    });
    if (points.length && !fitted.current) { map.fitBounds(L.latLngBounds(points), { padding: [45, 45], maxZoom: 15 }); fitted.current = true; }
  }, [carts]);
  return <div className="map-wrap"><div ref={el} className="map" role="region" aria-label="Map of owner-shared cart locations" /><div className="map-caption"><span className="dot" /> Owner-shared locations · select a pin for details</div></div>;
}
