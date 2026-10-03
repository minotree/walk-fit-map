import React, { useEffect, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonSpinner,
  useIonViewDidEnter
} from '@ionic/react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSiteDetail, SiteDetail as ISiteDetail } from '../services/siteService';

// 화장실 / 식수대 한글 텍스트 변환 함수 (PRD 기준)
const formatAmenityStatus = (status: 'yes' | 'no' | 'unknown') => {
  switch (status) {
    case 'yes':
      return { text: '있음', color: 'success' };
    case 'no':
      return { text: '없음', color: 'danger' };
    case 'unknown':
    default:
      return { text: '미확인', color: 'medium' };
  }
};

const SiteDetailPage: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const [site, setSite] = useState<ISiteDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDetail = async () => {
    if (!siteId) {
      console.warn('[SiteDetail.tsx] ⚠️ siteId가 전달되지 않았습니다.');
      setLoading(false);
      return;
    }

    console.log('[SiteDetail.tsx] 🚀 getSiteDetail 호출시도 - siteId:', siteId);
    setLoading(true);

    try {
      const data = await getSiteDetail(siteId);
      console.log('[SiteDetail.tsx] 📦 지점 상세 수신 데이터:', data);
      setSite(data);
    } catch (err) {
      console.error('[SiteDetail.tsx] ❌ 지점 상세 불러오기 예외 발생:', err);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 실행
  useEffect(() => {
    fetchDetail();
  }, [siteId]);

  // Ionic 화면 재진입 시 실행
  useIonViewDidEnter(() => {
    fetchDetail();
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text="지도" />
          </IonButtons>
          <IonTitle>{site ? site.name : '지점 상세 정보'}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen style={{ backgroundColor: '#f4f5f8' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <IonSpinner name="crescent" />
            <p style={{ marginTop: '12px', color: '#666' }}>시설 상세 정보를 불러오는 중입니다...</p>
          </div>
        ) : !site ? (
          <IonCard color="light">
            <IonCardContent style={{ textAlign: 'center', padding: '30px' }}>
              <h3>⚠️ 정보를 찾을 수 없습니다.</h3>
              <p>비공개 처리되었거나 존재하지 않는 운동시설 지점입니다.</p>
            </IonCardContent>
          </IonCard>
        ) : (
          <div style={{ padding: '12px' }}>
            {/* 1. 지점 기본 정보 카드 */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>{site.name}</IonCardTitle>
                <IonCardSubtitle>{site.address_text || '주소 정보 없음'}</IonCardSubtitle>
              </IonCardHeader>
              <IonCardContent>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                  <div>
                    <strong>🚽 화장실: </strong>
                    <IonBadge color={formatAmenityStatus(site.toilet_status).color}>
                      {formatAmenityStatus(site.toilet_status).text}
                    </IonBadge>
                  </div>
                  <div>
                    <strong>🚰 식수대: </strong>
                    <IonBadge color={formatAmenityStatus(site.drinking_water_status).color}>
                      {formatAmenityStatus(site.drinking_water_status).text}
                    </IonBadge>
                  </div>
                </div>

                {site.amenity_note && (
                  <p style={{ margin: '8px 0', color: '#555' }}>
                    📌 <strong>위치안내:</strong> {site.amenity_note}
                  </p>
                )}

                {site.last_verified_at && (
                  <p style={{ fontSize: '12px', color: '#888', marginTop: '12px' }}>
                    🗓️ 현장 확인일: {site.last_verified_at}
                  </p>
                )}
              </IonCardContent>
            </IonCard>

            {/* 2. 설치된 운동기구 목록 */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle style={{ fontSize: '18px' }}>
                  🏋️ 설치된 운동기구 ({site.equipments ? site.equipments.length : 0}종)
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {!site.equipments || site.equipments.length === 0 ? (
                  <p style={{ color: '#888' }}>등록된 운동기구 정보가 없습니다.</p>
                ) : (
                  <IonList lines="full">
                    {site.equipments.map((item) => (
                      <IonItem
                        button
                        key={item.installationId}
                        onClick={() =>
                          navigate(`/sites/${site.id}/equipment/${item.installationId}`)
                        }
                      >
                        <IonLabel>
                          <h2><strong>{item.name}</strong></h2>
                          <p>{item.model_name ? `모델명: ${item.model_name}` : '기본 모델'}</p>
                        </IonLabel>
                        <IonBadge slot="end" color="primary">
                          {item.quantity}대
                        </IonBadge>
                      </IonItem>
                    ))}
                  </IonList>
                )}
              </IonCardContent>
            </IonCard>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default SiteDetailPage;