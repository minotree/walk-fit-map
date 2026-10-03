import React, { useEffect, useRef } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { fromLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Style, Icon } from 'ol/style';

console.log('[STEP 5] 🗺️ VworldMap.tsx 파일 로드 성공');

export interface SiteSummary {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface VworldMapProps {
  sites: SiteSummary[];
  onSelectSite: (siteId: string) => void;
}

export const VworldMap: React.FC<VworldMapProps> = ({ sites, onSelectSite }) => {
  console.log('[STEP 6] 🧩 VworldMap 컴포넌트 렌더링');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);

  useEffect(() => {
    console.log('[STEP 7] ⚡ VworldMap 지도 생성 useEffect 진입');

    if (!mapContainerRef.current || mapInstanceRef.current) return;

    try {
      const apiKey = import.meta.env.VITE_VWORLD_API_KEY || 'YOUR_VWORLD_API_KEY';
      console.log('[STEP 8] 🔑 Vworld API Key 확인완료');

      const defaultLat = Number(import.meta.env.VITE_MAP_DEFAULT_LAT) || 37.5665;
      const defaultLng = Number(import.meta.env.VITE_MAP_DEFAULT_LNG) || 126.9780;
      const defaultZoom = Number(import.meta.env.VITE_MAP_DEFAULT_ZOOM) || 15;

      console.log('[STEP 9] 🗺️ OpenLayers 지도 생성 시작');
      const vworldTileLayer = new TileLayer({
        source: new XYZ({
          url: `https://api.vworld.kr/req/wmts/1.0.0/${apiKey}/Base/{z}/{y}/{x}.png`,
          crossOrigin: 'anonymous',
        }),
      });

      const map = new Map({
        target: mapContainerRef.current,
        layers: [vworldTileLayer],
        view: new View({
          center: fromLonLat([defaultLng, defaultLat]),
          zoom: defaultZoom,
        }),
      });

      mapInstanceRef.current = map;
      console.log('[STEP 10] 🎉 OpenLayers 지도 생성 성공!');
    } catch (error) {
      console.error('[ERROR] ❌ 지도 생성 오류:', error);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    console.log('[STEP 11] 📍 마커 레이어 useEffect 진입');
    const map = mapInstanceRef.current;
    if (!map) return;

    try {
      const vectorSource = new VectorSource();

      sites.forEach((site) => {
        const feature = new Feature({
          geometry: new Point(fromLonLat([site.longitude, site.latitude])),
          siteId: site.id,
          name: site.name,
        });

        feature.setStyle(
          new Style({
            image: new Icon({
              anchor: [0.5, 1],
              src: 'https://map.vworld.kr/images/ol3/marker_blue.png',
            }),
          })
        );

        vectorSource.addFeature(feature);
      });

      const vectorLayer = new VectorLayer({
        source: vectorSource,
      });

      map.addLayer(vectorLayer);
      console.log('[STEP 12] 📍 마커 렌더링 완료');

      const handleMapClick = (evt: any) => {
        const feature = map.forEachFeatureAtPixel(evt.pixel, (feat) => feat);
        if (feature) {
          const siteId = feature.get('siteId');
          if (siteId) {
            onSelectSite(siteId);
          }
        }
      };

      map.on('click', handleMapClick);

      return () => {
        map.removeLayer(vectorLayer);
        map.un('click', handleMapClick);
      };
    } catch (error) {
      console.error('[ERROR] ❌ 마커 생성 오류:', error);
    }
  }, [sites, onSelectSite]);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: '100%', height: '100%', minHeight: '100vh' }}
    />
  );
};