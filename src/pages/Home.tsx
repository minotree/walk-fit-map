import {
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonViewDidEnter
} from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VworldMap, SiteSummary } from '../components/VworldMap';
import { getPublishedSites } from '../services/siteService';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState<SiteSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>('📡 운동시설 정보를 불러오는 중입니다...');

  const loadSites = async () => {
    console.log('[Home.tsx] 🚀 loadSites() 시작');
    setLoading(true);
    setStatusMessage('📡 운동시설 정보를 불러오는 중입니다...');

    try {
      const data = await getPublishedSites();
      console.log('[Home.tsx] 📦 getPublishedSites 반환 데이터:', data);
      setSites(data);

      if (data.length === 0) {
        setStatusMessage('⚠️ 등록된 공개 운동시설이 없습니다.');
      } else {
        setStatusMessage(`✅ ${data.length}개의 운동시설을 불러왔습니다.`);
      }
    } catch (err) {
      console.error('[Home.tsx] 지점 목록 로드 실패:', err);
      setStatusMessage('❌ 운동시설 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  useIonViewDidEnter(() => {
    loadSites();
  });

  const handleSelectSite = (siteId: string) => {
    console.log('[Home.tsx] 📍 마커 선택됨 -> 이동:', siteId);
    navigate(`/sites/${siteId}`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>산책로 운동기구 안내 (Walk Fit Map)</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <div style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 1000,
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '8px 14px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '13px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            border: '1px solid #ddd',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {loading && <IonSpinner name="crescent" style={{ width: '16px', height: '16px' }} />}
            <span>{statusMessage}</span>
          </div>

          <VworldMap sites={sites} onSelectSite={handleSelectSite} />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;