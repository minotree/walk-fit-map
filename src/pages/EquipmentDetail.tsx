import React, { useState } from 'react';
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
  IonBadge,
  IonSpinner,
  useIonViewDidEnter
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { getEquipmentDetail, EquipmentDetail as IEquipmentDetail } from '../services/siteService';

const EquipmentDetailPage: React.FC = () => {
  const { siteId, installationId } = useParams<{ siteId: string; installationId: string }>();
  const [detail, setDetail] = useState<IEquipmentDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDetail = async () => {
    if (!siteId || !installationId) return;
    setLoading(true);
    const data = await getEquipmentDetail(siteId, installationId);
    setDetail(data);
    setLoading(false);
  };

  useIonViewDidEnter(() => {
    fetchDetail();
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref={`/sites/${siteId}`} text="지점 상세" />
          </IonButtons>
          <IonTitle>{detail ? detail.equipmentName : '기구 상세 정보'}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen style={{ backgroundColor: '#f4f5f8' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <IonSpinner name="crescent" />
            <p>기구 사용법 정보를 불러오는 중입니다...</p>
          </div>
        ) : !detail ? (
          <IonCard color="light">
            <IonCardContent style={{ textAlign: 'center', padding: '30px' }}>
              <h3>⚠️ 정보를 찾을 수 없습니다.</h3>
              <p>비공개 처리되었거나 존재하지 않는 운동기구 항목입니다.</p>
            </IonCardContent>
          </IonCard>
        ) : (
          <div style={{ padding: '12px' }}>
            {/* 1. 기구 제목 및 이미지 카드 */}
            <IonCard>
              {(detail.site_image_path || detail.default_image_path) && (
                <img
                  src={detail.site_image_path || detail.default_image_path || ''}
                  alt={detail.equipmentName}
                  style={{ width: '100%', maxHeight: '250px', objectFit: 'cover' }}
                  onError={(e) => {
                    // 이미지 로드 실패 시 대체 이미지 처리
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <IonCardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <IonCardTitle>{detail.equipmentName}</IonCardTitle>
                  <IonBadge color="secondary">{detail.quantity}대 설치됨</IonBadge>
                </div>
                <IonCardSubtitle>
                  {detail.siteName} {detail.model_name && `(${detail.model_name})`}
                </IonCardSubtitle>
              </IonCardHeader>
            </IonCard>

            {/* 2. 운동 방법 카드 */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle style={{ fontSize: '16px', color: '#1e88e5' }}>
                  🏃 올바른 운동 방법
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                {detail.instructions || '등록된 운동 방법 설명이 없습니다.'}
              </IonCardContent>
            </IonCard>

            {/* 3. 운동 효과 카드 */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle style={{ fontSize: '16px', color: '#2e7d32' }}>
                  💪 운동 효과
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                {detail.effects || '등록된 운동 효과 설명이 없습니다.'}
              </IonCardContent>
            </IonCard>

            {/* 4. 주의사항 카드 */}
            {detail.precautions && (
              <IonCard color="warning">
                <IonCardHeader>
                  <IonCardTitle style={{ fontSize: '16px' }}>⚠️ 사용 시 주의사항</IonCardTitle>
                </IonCardHeader>
                <IonCardContent style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                  {detail.precautions}
                </IonCardContent>
              </IonCard>
            )}

            {/* 출처 고지 */}
            {detail.source_reference && (
              <p style={{ padding: '0 10px', fontSize: '12px', color: '#888' }}>
                ℹ️ 출처: {detail.source_reference}
              </p>
            )}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default EquipmentDetailPage;