import { supabase } from '../lib/supabaseClient';
import { SiteSummary } from '../components/VworldMap';

// -------------------------------------------------------------------
// 1. 도메인 타입 정의
// -------------------------------------------------------------------

export interface SiteDetail {
  id: string;
  name: string;
  address_text: string;
  toilet_status: 'yes' | 'no' | 'unknown';
  drinking_water_status: 'yes' | 'no' | 'unknown';
  amenity_note: string;
  last_verified_at: string | null;
  survey_location_id?: string | null;
  equipments: InstallationItem[];
}

export interface InstallationItem {
  installationId: string;
  quantity: number;
  display_order: number;
  site_image_path: string | null;
  equipmentId: string;
  name: string;
  model_name: string;
  default_image_path: string | null;
}

export interface EquipmentDetail {
  installationId: string;
  siteId: string;
  siteName: string;
  equipmentName: string;
  model_name: string;
  quantity: number;
  site_image_path: string | null;
  default_image_path: string | null;
  instructions: string;
  effects: string;
  precautions: string;
  source_reference: string;
}

// 백업 가짜 데이터
const MOCK_SITES: SiteSummary[] = [
  { id: 'site-01', name: '남산 산책로 A구역 운동시설', latitude: 37.5512, longitude: 126.9882 },
  { id: 'site-02', name: '한강공원 B지점 기구터', latitude: 37.5285, longitude: 126.9348 },
  { id: 'site-03', name: '보라매공원 C지점 운동기구', latitude: 37.4923, longitude: 126.9138 },
];

// -------------------------------------------------------------------
// 2. 서비스 함수 구현
// -------------------------------------------------------------------

/**
 * [S01 지도] 공개 지점 목록 조회
 */
export async function getPublishedSites(): Promise<SiteSummary[]> {
  const dataSource = import.meta.env.VITE_DATA_SOURCE || 'supabase';

  if (dataSource === 'mock') {
    return MOCK_SITES;
  }

  try {
    const { data, error } = await supabase
      .from('exercise_sites')
      .select('id, name, latitude, longitude')
      .eq('is_published', true);

    if (error || !data) {
      console.error('[siteService] ❌ 공개 지점 조회 실패:', error);
      return [];
    }

    return data.map((site: any) => ({
      id: site.id,
      name: site.name,
      latitude: Number(site.latitude),
      longitude: Number(site.longitude),
    }));
  } catch (err) {
    console.error('[siteService] 예외 발생:', err);
    return [];
  }
}

/**
 * [S02 지점 상세] - 특정 지점 및 조인된 설치 기구 목록 조회
 */
export async function getSiteDetail(siteId: string): Promise<SiteDetail | null> {
  const dataSource = import.meta.env.VITE_DATA_SOURCE || 'supabase';

  if (dataSource === 'mock') {
    return {
      id: siteId,
      name: '중랑천 동 (Mock)',
      address_text: '서울특별시 노원구 상계동 1084-2',
      toilet_status: 'yes',
      drinking_water_status: 'no',
      amenity_note: '그늘막 있음 자전거 거치대 있음',
      last_verified_at: '2026-10-03',
      equipments: [
        {
          installationId: 'inst-01',
          quantity: 1,
          display_order: 0,
          site_image_path: null,
          equipmentId: 'eq-01',
          name: '상체일으키기',
          model_name: '기본형',
          default_image_path: null,
        },
      ],
    };
  }

  try {
    console.log(`[siteService] 📡 Supabase getSiteDetail() 실행 - siteId: ${siteId}`);

    // 1. 지점 기본 정보 조회
    const { data: siteData, error: siteError } = await supabase
      .from('exercise_sites')
      .select('*')
      .eq('id', siteId)
      .eq('is_published', true)
      .maybeSingle();

    if (siteError || !siteData) {
      console.error('[siteService] ❌ 지점 정보 조회 실패:', siteError);
      return null;
    }

    // 2. 해당 지점의 설치 기구 목록 & 기구 카탈로그 관계형 조인 조회
    const { data: eqData, error: eqError } = await supabase
      .from('site_equipment')
      .select(`
        id,
        quantity,
        display_order,
        site_image_path,
        is_published,
        equipment_catalog!inner (
          id,
          name,
          model_name,
          default_image_path,
          is_published
        )
      `)
      .eq('site_id', siteId);

    if (eqError) {
      console.error('[siteService] ⚠️ 기구 목록 조인 조회 에러:', eqError);
    }

    console.log('[siteService] 📦 원본 site_equipment 조인 결과:', eqData);

    const rawEquipments = eqData || [];
    // site_equipment 및 equipment_catalog 모두 공개(is_published)되거나, is_published 구문 유연 처리
    const equipments: InstallationItem[] = rawEquipments
      .map((item: any) => {
        const catalog = item.equipment_catalog || {};
        return {
          installationId: item.id,
          quantity: item.quantity || 1,
          display_order: item.display_order || 0,
          site_image_path: item.site_image_path,
          equipmentId: catalog.id || '',
          name: catalog.name || '운동기구',
          model_name: catalog.model_name || '',
          default_image_path: catalog.default_image_path,
        };
      })
      .sort((a: InstallationItem, b: InstallationItem) => a.display_order - b.display_order);

    return {
      id: siteData.id,
      name: siteData.name,
      address_text: siteData.address_text || '',
      toilet_status: siteData.toilet_status || 'unknown',
      drinking_water_status: siteData.drinking_water_status || 'unknown',
      amenity_note: siteData.amenity_note || '',
      last_verified_at: siteData.last_verified_at,
      survey_location_id: siteData.survey_location_id,
      equipments,
    };
  } catch (err) {
    console.error('[siteService] ❌ getSiteDetail 예외 발생:', err);
    return null;
  }
}

/**
 * [S03 기구 상세] - 특정 기구 상세 정보 및 운동 방법 조회
 */
export async function getEquipmentDetail(
  siteId: string,
  installationId: string
): Promise<EquipmentDetail | null> {
  const dataSource = import.meta.env.VITE_DATA_SOURCE || 'supabase';

  if (dataSource === 'mock') {
    return {
      installationId,
      siteId,
      siteName: '중랑천 동 (Mock)',
      equipmentName: '상체일으키기',
      model_name: '기본형',
      quantity: 1,
      site_image_path: null,
      default_image_path: null,
      instructions: '1. 발을 고정대에 걸고 자리에 앉습니다.\n2. 상체를 천천히 뒤로 젖혔다가 복근의 힘으로 일으킵니다.',
      effects: '복근 강화 및 허리 유연성 향상',
      precautions: '과도하게 허리를 젖히지 마시고 천천히 운동하세요.',
      source_reference: '제조사 사용자 안내판',
    };
  }

  try {
    console.log(`[siteService] 📡 getEquipmentDetail() - siteId: ${siteId}, instId: ${installationId}`);

    const { data, error } = await supabase
      .from('site_equipment')
      .select(`
        id,
        site_id,
        quantity,
        site_image_path,
        exercise_sites (
          id,
          name
        ),
        equipment_catalog (
          id,
          name,
          model_name,
          default_image_path,
          instructions,
          effects,
          precautions,
          source_reference
        )
      `)
      .eq('id', installationId)
      .eq('site_id', siteId)
      .maybeSingle();

    if (error || !data) {
      console.error('[siteService] ❌ 기구 상세 조회 실패:', error);
      return null;
    }

    const site = data.exercise_sites as any;
    const catalog = data.equipment_catalog as any;

    return {
      installationId: data.id,
      siteId: data.site_id,
      siteName: site?.name || '운동시설',
      equipmentName: catalog?.name || '운동기구',
      model_name: catalog?.model_name || '',
      quantity: data.quantity || 1,
      site_image_path: data.site_image_path,
      default_image_path: catalog?.default_image_path,
      instructions: catalog?.instructions || '',
      effects: catalog?.effects || '',
      precautions: catalog?.precautions || '',
      source_reference: catalog?.source_reference || '',
    };
  } catch (err) {
    console.error('[siteService] ❌ getEquipmentDetail 예외 발생:', err);
    return null;
  }
}