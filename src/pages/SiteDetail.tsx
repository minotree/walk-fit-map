import React, { useEffect, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonBadge,
} from '@ionic/react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSiteDetail, SiteDetail as SiteDetailType } from '../services/siteService';

const SiteDetail: React.FC = () => {
  const { siteId } = useParams<{ siteId?: string }>();
  const navigate = useNavigate();

  const [site, setSite] = useState<SiteDetailType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!siteId) {
      setErrorMsg('유효하지 않은 지점 ID입니다.');
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchSite = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const data = await getSiteDetail(siteId);
        if (!isMounted) return;

        if (!data) {
          setErrorMsg('이 지점 정보를 현재 볼 수 없습니다.');
        } else {
          setSite(data);
        }
      } catch (err) {
        if (isMounted) {
          setErrorMsg('지점 정보를 불러오지 못했습니다.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSite();
    return () => {
      isMounted = false;
    };
  }, [siteId]);

  // 편의시설 상태 한글 매핑 헬퍼
  const getStatusBadge = (status: 'yes' | 'no' | 'unknown') => {
    switch (status) {
      case 'yes':
        return <IonBadge color="success">있음</IonBadge>;
      case 'no':
        return <IonBadge color="danger">없음</IonBadge>;
      default:
        return <IonBadge color="medium">미확인</IonBadge>;
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>{site?.name || '지점 상세'}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
            <IonSpinner name="crescent" />
          </div>
        ) : errorMsg ? (
          <div style={{ textAlign: 'center', marginTop: '50px', color: '#666' }}>
            <p>{errorMsg}</p>
            <button
              onClick={() => navigate('/home', { replace: true })}
              style={{ marginTop: '10px', padding: '8px 16px', background: '#3880ff', color: '#fff', border: 'none', borderRadius: '4px' }}
            >
              지도로 돌아가기
            </button>
          </div>
        ) : site ? (
          <div>
            {/* 1. 지점 대표 사진 영역 (survey-photos 버킷 연동) */}
            {site.site_image_path && (
              <div
                style={{
                  width: '100%',
                  height: '200px',
                  backgroundColor: '#f2f2f2',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  marginBottom: '16px',
                }}
              >
                <img
                  src={site.site_image_path}
                  alt={site.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}

            {/* 2. 지점 기본 정보 카드 */}
            <IonCard style={{ margin: '0 0 16px 0' }}>
              <IonCardContent>
                <h2 style={{ fontWeight: 'bold', fontSize: '20px', color: '#333', marginBottom: '8px' }}>
                  {site.name}
                </h2>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                  {site.address_text || '주소 정보 없음'}
                </p>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '14px' }}>
                  <div>
                    🚽 화장실: {getStatusBadge(site.toilet_status)}
                  </div>
                  <div>
                    💧 식수대: {getStatusBadge(site.drinking_water_status)}
                  </div>
                </div>

                {site.amenity_note && (
                  <p style={{ fontSize: '14px', color: '#444', marginBottom: '8px', whiteSpace: 'pre-line' }}>
                    📍 위치안내: {site.amenity_note}
                  </p>
                )}

                {site.last_verified_at && (
                  <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>
                    📅 현장 확인일: {site.last_verified_at}
                  </p>
                )}
              </IonCardContent>
            </IonCard>

            {/* 3. 설치된 운동기구 목록 섹션 */}
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 12px 4px' }}>
              설치된 운동기구 ({site.equipments.length}종)
            </h3>

            {site.equipments.length === 0 ? (
              <IonCard style={{ margin: 0 }}>
                <IonCardContent style={{ textAlign: 'center', color: '#888' }}>
                  등록된 운동기구 정보가 없습니다.
                </IonCardContent>
              </IonCard>
            ) : (
              site.equipments.map((eq) => (
                <IonCard
                  key={eq.installationId}
                  style={{ margin: '0 0 10px 0', cursor: 'pointer' }}
                  onClick={() => navigate(`/sites/${site.id}/equipment/${eq.installationId}`)}
                >
                  <IonItem lines="none">
                    <IonLabel>
                      <h3 style={{ fontWeight: 'bold', fontSize: '16px' }}>{eq.name}</h3>
                      <p style={{ color: '#666', fontSize: '13px' }}>
                        모델명: {eq.model_name || '정보 없음'}
                      </p>
                    </IonLabel>
                    <IonBadge slot="end" color="primary">
                      {eq.quantity}대
                    </IonBadge>
                  </IonItem>
                </IonCard>
              ))
            )}
          </div>
        ) : null}
      </IonContent>
    </IonPage>
  );
};

export default SiteDetail;